# Cloudflare Workers構成

```text
Browser
  ├─ /             → Workers Static Assets (dashboard/)
  └─ /api/*        → Worker ES module fetch handler
                         ├─ D1 binding DB
                         │    accounts / posts / metrics / history / insights / ai_runs
                         └─ KV binding CONTENT_STORE
                              AI run JSON artifacts (90-day TTL)
```

`wrangler.jsonc`の`run_worker_first: ["/api/*"]`によりAPIだけをWorkerへ先に送り、それ以外は`ASSETS.fetch()`で配信する。D1 repositoryは非同期binding APIだけに依存し、Node.jsのHTTP、filesystem、SQLite APIを使用しない。SNS固有adapterは引き続き`src/integrations`へ隔離する。
