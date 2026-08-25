# MVP 開発ロードマップ

| Phase | 内容 | 完了条件 |
|---|---|---|
| 0（完了） | Workers、D1、KV、Static Assets、承認UI、KPI | Wrangler local/remoteで同一migrationとWorkerが動く |
| 1 | 設定管理、投稿企画30件、provider interface、v1→critique→v2 | 80点未満が再稿され、人間承認待ちになる |
| 2 | 実績入力UI、前7日比較、カテゴリ別TOP/WORST | 全指標がD1期間集計と一致する |
| 3 | proposed_rulesのKV versioningと承認フロー | 人間承認時だけcurrent rule pointerを更新 |
| 4 | X公式API adapter（明示承認後） | sandbox予約、規約準拠、取得成功率計測 |
| 5 | R2 export/backup、収益adapter、複数アカウント | scale gate達成後のみアカウント追加 |
