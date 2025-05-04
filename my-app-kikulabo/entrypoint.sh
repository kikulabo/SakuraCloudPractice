#!/bin/bash

# ログファイルの設定
LOG_FILE="/var/log/entrypoint.log"
APP_LOG_FILE="/var/log/app.log"

# ログを出力する関数
log() {
    echo "{\"time\":\"$(date '+%Y-%m-%d %H:%M:%S')\",\"message\":\"$1\"}" | tee -a "$LOG_FILE"
}

if [ -n "$NGROK_AUTHTOKEN" ]; then
    log "NGROK_AUTHTOKENが設定されています。SSHサーバーとngrokトンネルを起動します..."

    log "ngrokを設定中..."
    ngrok config add-authtoken $NGROK_AUTHTOKEN --log=stdout > /dev/null 2>&1

    log "SSHサーバーを起動中..."
    /usr/sbin/sshd -D > /dev/null 2>&1 &
    SSHD_PID=$!

    log "ngrok TCPトンネル (port 22) を起動中..."
    ngrok tcp 22 --log=stdout > /dev/null 2>&1 &
    NGROK_PID=$!

    log "SSHサーバー (PID: $SSHD_PID) と ngrok (PID: $NGROK_PID) がバックグラウンドで起動しました。"
else
    log "環境変数 NGROK_AUTHTOKEN が設定されていないため、SSHサーバーとngrokは起動しません。"
fi

if [ -n "$MACKEREL_APIKEY" ]; then
    log "Mackerel APIキーが設定されています。Mackerelエージェントを初期化/起動します..."
    if [ ! -f "/etc/mackerel-agent/id" ]; then
        mackerel-agent init -apikey=$MACKEREL_APIKEY > /dev/null 2>&1
        log "カスタム設定ファイルの内容を追記します..."
        if [ -f "/my-app-kikulabo/custom_mackerel-agent.conf" ]; then
            cat /my-app-kikulabo/custom_mackerel-agent.conf >> /etc/mackerel-agent/mackerel-agent.conf
            log "カスタム設定ファイルの内容を追記しました。"
        else
            log "カスタム設定ファイルが見つかりません: /my-app-kikulabo/custom_mackerel-agent.conf"
        fi
    fi
    mackerel-agent -conf /etc/mackerel-agent/mackerel-agent.conf > /dev/null 2>&1 &
    MACKEREL_PID=$!
    log "Mackerelエージェント (PID: $MACKEREL_PID) がバックグラウンドで起動しました。"
else
    log "環境変数 MACKEREL_APIKEY が設定されていないため、Mackerelエージェントは起動しません。"
fi

if [ -n "$FLUENTBIT_AUTH_TOKEN" ]; then
    log "Fluentbit認証トークンが設定されています。Fluentbitを起動します..."
    mkdir -p /etc/fluent-bit
    cat /app/fluentbit.conf | sed "s/FLUENTBIT_AUTH_TOKEN/${FLUENTBIT_AUTH_TOKEN}/g" > /etc/fluent-bit/fluent-bit.conf
    cp /app/parsers.conf /etc/fluent-bit/parsers.conf

    fluent-bit -c /etc/fluent-bit/fluent-bit.conf > /dev/null 2>&1 &
    FLUENTBIT_PID=$!
    if ps -p $FLUENTBIT_PID > /dev/null; then
        log "Fluentbit (PID: $FLUENTBIT_PID) がバックグラウンドで起動しました。"
    else
        log "Fluentbitの起動に失敗しました。"
        exit 1
    fi
else
    log "環境変数 FLUENTBIT_AUTH_TOKEN が設定されていないため、Fluentbitは起動しません。"
fi

log "Node.js アプリケーションを起動します..."
node dist/app.js 2>&1

APP_EXIT_CODE=$?
log "Node.js アプリケーションが終了コード $APP_EXIT_CODE で停止しました。"

exit $APP_EXIT_CODE
