FROM node:20

RUN apt-get update && \
    apt-get install -y \
        openssh-server \
        curl \
        unzip \
        wget \
        sudo \
        gnupg2 \
        lsb-release \
        nginx

RUN wget -q -O - https://mackerel.io/file/script/setup-apt-v2.sh | sh && \
    apt-get update && \
    apt-get install -y mackerel-agent mackerel-agent-plugins

RUN curl -L https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.zip -o ngrok.zip \
 && unzip ngrok.zip -d /usr/local/bin \
 && rm ngrok.zip

RUN mkdir -p /var/run/sshd

# ログディレクトリの作成と権限設定
RUN mkdir -p /var/log && \
    touch /var/log/app.log && \
    touch /var/log/entrypoint.log && \
    mkdir -p /var/log/nginx && \
    touch /var/log/nginx/access.log && \
    touch /var/log/nginx/error.log && \
    chmod 666 /var/log/app.log && \
    chmod 666 /var/log/entrypoint.log && \
    chmod 666 /var/log/nginx/access.log && \
    chmod 666 /var/log/nginx/error.log

RUN useradd -m -s /bin/bash devuser && adduser devuser sudo
COPY public_key.pub /home/devuser/.ssh/authorized_keys
RUN chown -R devuser:devuser /home/devuser/.ssh && \
    chmod 700 /home/devuser/.ssh && \
    chmod 600 /home/devuser/.ssh/authorized_keys
RUN sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
RUN sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config
RUN sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

COPY custom_mackerel-agent.conf /my-app-kikulabo/custom_mackerel-agent.conf
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080
EXPOSE 22
EXPOSE 80

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

RUN wget -qO - https://packages.fluentbit.io/fluentbit.key | gpg --dearmor > /usr/share/keyrings/fluentbit-keyring.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/fluentbit-keyring.gpg] https://packages.fluentbit.io/debian/bookworm bookworm main" > /etc/apt/sources.list.d/fluentbit.list && \
    apt-get update && \
    apt-get install -y fluent-bit && \
    ln -s /opt/fluent-bit/bin/fluent-bit /usr/local/bin/fluent-bit && \
    rm -rf /var/lib/apt/lists/* && \
    mkdir -p /etc/fluent-bit

CMD ["/app/entrypoint.sh"]
