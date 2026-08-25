# システム構成

```text
Dashboard (static HTML/CSS/JS)
  ↓ JSON/HTTP
Local Node API
  ├─ database/repository: 投稿・承認・実績
  ├─ analytics: KPIとrevenue-firstランキング
  ├─ agents/generators: 将来のAI境界
  └─ integrations/{x,instagram,threads}: 将来のSNS adapter境界
  ↓
SQLite (accounts, posts, metrics, history, insights, ai_runs)
```

Node標準機能のみでローカル起動できる。プラットフォーム依存コードは`src/integrations`内のadapterに限定し、投稿ライフサイクルやKPI計算には持ち込まない。
