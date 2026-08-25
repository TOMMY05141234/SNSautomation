# Workers MVP 要件

- Cloudflare Workers ES Modules形式の`fetch(request, env)`をentrypointにする。
- 永続的な業務データはD1、生成artifactはKV、静的UIはWorkers Static Assetsへ置く。
- 人間承認前の予約/投稿を拒否し、状態変更をD1 batchで履歴と同時保存する。
- 外部SNS/AI API、課金、production rule自動更新は行わない。
- insightにはsource、sample_size、period、confidenceを必ず付ける。
