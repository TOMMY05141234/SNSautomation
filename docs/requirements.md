# MVP 要件整理

## スコープ
1アカウント・Xを対象とし、外部SNS/AI APIを呼ばず、ダミーデータで「候補生成済み → AIレビュー済み → 人間承認 → 実績登録 → KPI/ランキング → 根拠付き改善提案」を再現する。

## 設計原則
- human-in-the-loopを必須とし、不正な状態遷移を拒否する。
- 売上・CV・クリックを投稿評価の優先指標にする。
- insightは data → interpretation → action と source/sample_size/period/confidence を必須にする。
- core（repository/analytics）とplatform adapter（integrations配下）を分離する。
- 本番投稿、ルールの自動反映、外部API、課金をMVP対象外とする。
