import { getDb } from './db.js';
import { deriveMetrics, revenueScore } from '../analytics/kpis.js';

const transitions = {
  draft: ['ai_reviewed'], ai_reviewed: ['pending_human_review'], pending_human_review: ['approved','rejected'],
  approved: ['scheduled','rejected'], scheduled: ['posted'], posted: [], rejected: []
};
export function canTransition(from, to) { return transitions[from]?.includes(to) ?? false; }
export function changeStatus(id, to, note = '', db = getDb()) {
  const post = db.prepare('SELECT status FROM posts WHERE post_id = ?').get(id);
  if (!post) throw new Error('投稿が見つかりません');
  if (!canTransition(post.status, to)) throw new Error(`${post.status} から ${to} へは変更できません`);
  db.exec('BEGIN');
  try {
    db.prepare("UPDATE posts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE post_id = ?").run(to, id);
    db.prepare('INSERT INTO status_history(post_id, from_status, to_status, note) VALUES (?,?,?,?)').run(id, post.status, to, note);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return getPost(id, db);
}
export function getPost(id, db = getDb()) { return db.prepare('SELECT * FROM posts WHERE post_id = ?').get(id); }
export function updateContent(id, content, db = getDb()) {
  if (!content?.trim()) throw new Error('本文を入力してください');
  const post = getPost(id, db);
  if (!post || !['pending_human_review','approved'].includes(post.status)) throw new Error('この投稿は編集できません');
  db.prepare("UPDATE posts SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE post_id = ?").run(content.trim(), id);
  return getPost(id, db);
}
export function saveMetrics(id, metrics, db = getDb()) {
  const post = getPost(id, db);
  if (!post) throw new Error('投稿が見つかりません');
  const keys = ['impressions','likes','replies','reposts','bookmarks','profile_clicks','link_clicks','follows','affiliate_clicks','conversions','revenue'];
  const values = keys.map(k => Math.max(0, Number(metrics[k] || 0)));
  db.prepare(`INSERT INTO post_metrics(post_id,${keys.join(',')}) VALUES (?,${keys.map(()=>'?').join(',')}) ON CONFLICT(post_id) DO UPDATE SET ${keys.map(k=>`${k}=excluded.${k}`).join(',')}, recorded_at=CURRENT_TIMESTAMP`).run(id, ...values);
  const saved = Object.fromEntries(keys.map((k,i) => [k, values[i]]));
  return { post_id: id, ...saved, ...deriveMetrics(saved) };
}
export function dashboardData(db = getDb(), range = 30) {
  const posts = db.prepare(`SELECT p.*, m.* FROM posts p LEFT JOIN post_metrics m USING(post_id) ORDER BY p.created_at DESC`).all();
  const reviewed = posts.filter(p => p.status === 'pending_human_review');
  const scheduled = posts.filter(p => p.status === 'scheduled');
  const published = posts.filter(p => p.status === 'posted');
  const withDerived = published.map(p => ({...p, ...deriveMetrics(p), score: revenueScore(p)}));
  const totals = withDerived.reduce((a,p) => ({impressions:a.impressions+(p.impressions||0), engagements:a.engagements+(p.likes||0)+(p.replies||0)+(p.reposts||0)+(p.bookmarks||0), follows:a.follows+(p.follows||0), link_clicks:a.link_clicks+(p.link_clicks||0), conversions:a.conversions+(p.conversions||0), revenue:a.revenue+(p.revenue||0)}), {impressions:0,engagements:0,follows:0,link_clicks:0,conversions:0,revenue:0});
  const revenueToday = withDerived.filter(p => String(p.posted_at||'').startsWith('2026-08-25')).reduce((s,p)=>s+(p.revenue||0),0);
  const insights = db.prepare('SELECT * FROM insights ORDER BY id DESC LIMIT 4').all();
  return { account: db.prepare('SELECT * FROM accounts LIMIT 1').get(), range, totals: {...totals, engagement_rate: totals.impressions ? totals.engagements/totals.impressions : 0}, revenueToday, approvalQueue: reviewed, scheduled, topPosts:[...withDerived].sort((a,b)=>b.score-a.score).slice(0,3), worstPosts:[...withDerived].sort((a,b)=>a.score-b.score).slice(0,3), insights };
}
