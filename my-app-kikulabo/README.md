# My App Kikulabo

TypeScriptで書かれたシンプルなExpress.jsアプリケーション

## 機能

- Express.jsを使用したWebサーバー
- TypeScriptによる型安全な開発環境
- Docker対応

## 必要条件

- Node.js 20.x以上
- npm または yarn
- Docker（オプション）

## セットアップ

1. リポジトリのクローン:
```bash
git clone [repository-url]
cd my-app-kikulabo
```

2. 依存関係のインストール:
```bash
npm install
```

## 開発

開発モードで実行:
```bash
npm run dev
```

## ビルド

本番用ビルド:
```bash
npm run build
```

## 実行

本番環境での実行:
```bash
npm start
```

## Docker

Dockerイメージのビルド:
```bash
docker build -t my-app-kikulabo .
```

Dockerコンテナの実行:
```bash
docker run -p 8080:8080 my-app-kikulabo
```
