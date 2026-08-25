import { getDb } from './db.js';
export function ensureBootstrap(db=getDb()) {
  if (!db.prepare('SELECT id FROM accounts LIMIT 1').get()) {
    db.prepare('INSERT INTO accounts(id,platform,name,handle) VALUES (?,?,?,?)').run('engineer_career_x','x','エンジニア転職ラボ','@career_engineer');
  }
  return db.prepare('SELECT * FROM accounts LIMIT 1').get();
}
