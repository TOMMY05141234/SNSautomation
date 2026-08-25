# SNS Growth OS — Local MVP

売上につながる投稿パターンを、人間の承認を残したまま検証するSNSマーケティングOSの最初の縦切りです。現在は**X・1アカウント・ローカルダミーデータのみ**。SNS APIや外部AI APIは呼びません。

## 今回実装した範囲

- SQLiteスキーマ：アカウント、投稿、9軸AI review結果、状態履歴、実績、AI insight、AI実行ログ
- `pending_human_review → approved/rejected`の承認UI、本文編集
- IMP/ER/フォロー/クリック/CV/売上と、売上優先のTOP/WORSTランキング
- `data → interpretation → action`およびsource/母数/期間/confidence付きinsight
- 将来のX/Instagram/Threads adapterをcoreから分離するディレクトリ境界

> 投稿生成とAI reviewは現時点ではseed済みの決定的ダミー成果物です。外部AIを使用しないため、再現性と安全性を保って承認以降のフローを確認できます。

## 必要環境

- Node.js 22.5以降（`node:sqlite`を使用。確認環境 Node 24）
- npm依存パッケージなし

## 3分で起動

```bash
npm run seed
npm start
```

ブラウザで <http://localhost:3001> を開きます。承認・編集・却下でDBが更新されます。初期状態へ戻す場合は停止後に`npm run seed`を再実行してください。

## テスト

```bash
npm test
npm run check
```

unitではKPI、ゼロ除算、revenue-first評価を、integrationでは投稿保存・編集・状態遷移・実績登録・集計をインメモリSQLiteで検証します。

## API（ローカル）

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/dashboard?range=30` | 承認キュー、KPI、ランキング、insight |
| PATCH | `/api/posts/:id` | 人間による本文編集 |
| PATCH | `/api/posts/:id/status` | 許可済み状態遷移 |
| PUT | `/api/posts/:id/metrics` | 実績登録/更新 |

## 設計資料

- [要件と非対象](docs/requirements.md)
- [システム構成](docs/architecture.md)
- [段階的ロードマップ](docs/roadmap.md)
- [DB schema](db/schema.sql)

## 現在の制約 / 次の実装

1. YAMLは人間向け設定例で、アプリへの設定ローダーは次Phase。
2. 日付範囲タブはAPI境界を備えるが、seed件数が少ないため集計期間filterは次Phase。
3. 実績登録APIは実装済み。UIフォームは次Phase。
4. 投稿企画30件、5 variant、80点未満のv2再稿をprovider interfaceとして実装する。
5. proposed_rules承認後にのみcurrent_rulesへ反映するワークフローを追加する。
6. SNS公式API接続は明示承認を得た後にadapterとして実装する。

## セキュリティ

`.env`、API key、token、個人情報、ローカルDBはGit対象外です。本番投稿、課金、ルールの自動上書きは行いません。
