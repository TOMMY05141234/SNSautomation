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
npm start
# デモ投稿・実績も入れたい場合のみ、起動前に npm run seed
```

ブラウザで <http://localhost:3001> を開きます。初回起動時にアカウントを自動初期化します。「5案を生成」から投稿生成・AIレビュー・人間承認を開始でき、承認後は予約・デモ投稿完了まで状態を進められます。初期状態へ戻す場合は停止後に`npm run seed`を再実行してください。

## テスト

```bash
npm test
npm run check
```

unitではKPI、ゼロ除算、revenue-first評価を、integrationでは投稿保存・編集・状態遷移・実績登録・集計をインメモリSQLiteで検証します。

## API（ローカル）

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | サーバー・DBヘルスチェック |
| GET | `/api/dashboard?range=30` | 承認キュー、KPI、ランキング、insight |
| GET | `/api/posts?status=posted` | 投稿一覧・状態絞り込み |
| POST | `/api/posts/generate` | ローカル5案生成、AIレビュー、承認待ち登録 |
| PATCH | `/api/posts/:id` | 人間による本文編集 |
| PATCH | `/api/posts/:id/status` | 許可済み状態遷移 |
| PUT | `/api/posts/:id/metrics` | 投稿済み投稿の実績登録/更新 |
| POST | `/api/analysis/run` | 実績から根拠付き改善案を再生成 |

## 設計資料

- [要件と非対象](docs/requirements.md)
- [システム構成](docs/architecture.md)
- [段階的ロードマップ](docs/roadmap.md)
- [DB schema](db/schema.sql)

## 現在の制約 / 次の実装

1. YAMLは人間向け設定例で、アプリへの設定ローダーは次Phase。
2. 今日・7日・30日の期間filterは実装済み。前期間との厳密な比較値は次Phase。
3. 投稿生成・AIレビュー・承認・予約・デモ投稿・再分析はUI接続済み。詳細な実績入力フォームは次Phase。
4. 投稿企画30件、5 variant、80点未満のv2再稿をprovider interfaceとして実装する。
5. proposed_rules承認後にのみcurrent_rulesへ反映するワークフローを追加する。
6. SNS公式API接続は明示承認を得た後にadapterとして実装する。

## セキュリティ

`.env`、API key、token、個人情報、ローカルDBはGit対象外です。本番投稿、課金、ルールの自動上書きは行いません。
