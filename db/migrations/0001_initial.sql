CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY, platform TEXT NOT NULL, name TEXT NOT NULL, handle TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Tokyo', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS posts (
  post_id INTEGER PRIMARY KEY AUTOINCREMENT, account_id TEXT NOT NULL REFERENCES accounts(id), platform TEXT NOT NULL,
  content TEXT NOT NULL, theme TEXT NOT NULL,
  hook_type TEXT NOT NULL CHECK(hook_type IN ('number','warning','confession','contrarian','question','loss_aversion','curiosity','authority','experience','future')),
  content_type TEXT NOT NULL CHECK(content_type IN ('how_to','story','opinion','mistake','case_study','comparison','news','checklist','controversial','data')),
  cta_type TEXT NOT NULL CHECK(cta_type IN ('none','follow','profile','reply','bookmark','affiliate','newsletter','product')),
  variant TEXT, status TEXT NOT NULL CHECK(status IN ('draft','ai_reviewed','pending_human_review','approved','scheduled','posted','rejected')),
  review_score INTEGER CHECK(review_score BETWEEN 0 AND 90), review_notes TEXT, scheduled_at TEXT, posted_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS post_metrics (
  post_id INTEGER PRIMARY KEY REFERENCES posts(post_id) ON DELETE CASCADE, impressions INTEGER NOT NULL DEFAULT 0 CHECK(impressions >= 0),
  likes INTEGER NOT NULL DEFAULT 0, replies INTEGER NOT NULL DEFAULT 0, reposts INTEGER NOT NULL DEFAULT 0, bookmarks INTEGER NOT NULL DEFAULT 0,
  profile_clicks INTEGER NOT NULL DEFAULT 0, link_clicks INTEGER NOT NULL DEFAULT 0, follows INTEGER NOT NULL DEFAULT 0,
  affiliate_clicks INTEGER NOT NULL DEFAULT 0, conversions INTEGER NOT NULL DEFAULT 0, revenue REAL NOT NULL DEFAULT 0,
  recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL REFERENCES posts(post_id), from_status TEXT,
  to_status TEXT NOT NULL, note TEXT, changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, title TEXT NOT NULL, data_text TEXT NOT NULL,
  interpretation TEXT NOT NULL, action TEXT NOT NULL, source TEXT NOT NULL, sample_size INTEGER NOT NULL, period TEXT NOT NULL,
  confidence TEXT NOT NULL CHECK(confidence IN ('high','medium','low','insufficient_data')), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ai_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, agent TEXT NOT NULL, input_json TEXT NOT NULL, output_json TEXT NOT NULL,
  artifact_key TEXT, model TEXT NOT NULL, input_tokens INTEGER DEFAULT 0, output_tokens INTEGER DEFAULT 0,
  cost REAL DEFAULT 0, status TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_posts_account_status ON posts(account_id,status);
CREATE INDEX IF NOT EXISTS idx_posts_posted_at ON posts(posted_at);
INSERT OR IGNORE INTO accounts(id,platform,name,handle,timezone) VALUES ('engineer_career_x','x','エンジニア転職ラボ','@career_engineer','Asia/Tokyo');
