# SNS Growth OS — Cloudflare Workers MVP

X・1アカウントの「投稿候補生成 → AIレビュー → 人間承認 → 予約 → 投稿済み化 → 実績登録 → 分析」をCloudflare上で動かすMVPです。SNS/外部AI APIはまだ呼ばず、決定的なデモ生成器を使用します。

## 構成

- **Cloudflare Workers:** `src/server.js`のES Modules `fetch()` handler
- **D1:** アカウント、投稿、承認履歴、実績、insight、AI実行メタデータ
- **KV (`CONTENT_STORE`):** AI生成runのJSON artifact（90日TTL）
- **Workers Static Assets (`ASSETS`):** `dashboard/`のHTML/CSS/JS
- **Core:** KPI計算と生成ルールはplatform adapterから独立

## 初回セットアップ

Node.jsとCloudflareアカウントが必要です。

```bash
npm install
npx wrangler login
npx wrangler d1 create sns-growth-os-db
npx wrangler kv namespace create CONTENT_STORE
```

作成結果のD1 `database_id`とKV `id`を`wrangler.jsonc`のプレースホルダーへ設定します。IDは秘密鍵ではありませんが、環境ごとの値として管理してください。

## D1 migration

```bash
npm run db:migrate:local
npm run db:migrate:remote
```

migrationはテーブル、index、最初のデモアカウントを作成します。削除処理は含みません。

## ローカル起動とデプロイ

```bash
npm run dev
# http://localhost:8787

npm run deploy
```

Workersから`DB`、`CONTENT_STORE`、`ASSETS` bindingsが渡されます。Node HTTP serverやローカルSQLiteファイルは使用しません。

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Workers・D1・KV binding確認 |
| GET | `/api/dashboard?range=30` | 承認キュー、期間KPI、ランキング、insight |
| GET | `/api/posts?status=posted` | 投稿一覧 |
| POST | `/api/posts/generate` | 1〜5案生成、レビュー、承認待ち登録、KV artifact保存 |
| PATCH | `/api/posts/:id` | 承認待ち/承認済み本文の人間編集 |
| PATCH | `/api/posts/:id/status` | 許可済み状態遷移。予約には`scheduled_at`必須 |
| PUT | `/api/posts/:id/metrics` | 投稿済み投稿のみ実績登録 |
| POST | `/api/analysis/run` | D1実績から根拠付き改善案を生成 |

## テスト

```bash
npm test
npm run check
```

テストはインメモリD1互換mockとKV/Assets mockへWorkers `fetch()` handlerを直接接続し、生成から実績・分析までをHTTP Request/Responseで検証します。

## 安全性

- `pending_human_review → approved`を経なければ予約できません。
- 本番SNS投稿、外部AI、課金、ルール自動反映は行いません。
- insightは`source / sample_size / period / confidence`を必須とします。
- APIキーやtokenは`wrangler secret put`で登録し、Gitへ保存しません。
