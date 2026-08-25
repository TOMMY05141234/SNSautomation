# MVP 開発ロードマップ

| Phase | 内容 | 完了条件 |
|---|---|---|
| 0（今回） | 構造、DB、ダミーフロー、承認UI、KPI、根拠付きinsight | ローカルで承認・編集・却下とランキングを操作可能 |
| 1 | 設定ローダー、投稿企画30件、5 variant生成、review v1→v2 | unit/integration testと80点未満の自動再稿 |
| 2 | 実績入力フォーム、週次比較、TOP/WORST比較 | 7日対前7日、カテゴリ別差分を表示 |
| 3 | proposed_rules承認フロー、実験管理 | 人間承認時だけcurrent_rulesへ反映 |
| 4 | X公式API adapter（明示承認後） | sandboxで取得/予約、成功率計測、規約準拠 |
| 5 | 収益/LP adapterと複数アカウント | 4週・30投稿・取得95%・確認15分のscale gate達成 |
