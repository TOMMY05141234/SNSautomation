import { getDb } from './db.js';
import { deriveMetrics, revenueScore } from '../analytics/kpis.js';
import { generateDemoCandidates, buildRuleInsight } from '../generators/demo-generator.js';

export class AppError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
const transitions = { draft:['ai_reviewed'], ai_reviewed:['pending_human_review'], pending_human_review:['approved','rejected'], approved:['scheduled','rejected'], scheduled:['posted'], posted:[], rejected:[] };
export function canTransition(from,to){ return transitions[from]?.includes(to) ?? false; }
export function getPost(id,db=getDb()){ return db.prepare('SELECT * FROM posts WHERE post_id=?').get(id); }
export function listPosts({status,limit=100}={},db=getDb()){
  const safeLimit=Math.min(200,Math.max(1,Number(limit)||100));
  return status ? db.prepare('SELECT * FROM posts WHERE status=? ORDER BY post_id DESC LIMIT ?').all(status,safeLimit) : db.prepare('SELECT * FROM posts ORDER BY post_id DESC LIMIT ?').all(safeLimit);
}
export function changeStatus(id,to,note='',db=getDb(),options={}){
  const post=getPost(id,db); if(!post) throw new AppError('投稿が見つかりません',404);
  if(!canTransition(post.status,to)) throw new AppError(`${post.status} から ${to} へは変更できません`,409);
  if(to==='scheduled' && !options.scheduledAt) throw new AppError('予約日時を指定してください');
  db.exec('BEGIN'); try {
    if(to==='scheduled') db.prepare("UPDATE posts SET status=?,scheduled_at=?,updated_at=CURRENT_TIMESTAMP WHERE post_id=?").run(to,options.scheduledAt,id);
    else if(to==='posted') db.prepare("UPDATE posts SET status=?,posted_at=COALESCE(posted_at,?),updated_at=CURRENT_TIMESTAMP WHERE post_id=?").run(to,options.postedAt||new Date().toISOString(),id);
    else db.prepare("UPDATE posts SET status=?,updated_at=CURRENT_TIMESTAMP WHERE post_id=?").run(to,id);
    db.prepare('INSERT INTO status_history(post_id,from_status,to_status,note) VALUES (?,?,?,?)').run(id,post.status,to,note||null); db.exec('COMMIT');
  } catch(error){ db.exec('ROLLBACK'); throw error; }
  return getPost(id,db);
}
export function updateContent(id,content,db=getDb()){
  if(!content?.trim()) throw new AppError('本文を入力してください'); if(content.trim().length>280) throw new AppError('本文は280文字以内です');
  const post=getPost(id,db); if(!post) throw new AppError('投稿が見つかりません',404);
  if(!['pending_human_review','approved'].includes(post.status)) throw new AppError('この投稿は編集できません',409);
  db.prepare("UPDATE posts SET content=?,updated_at=CURRENT_TIMESTAMP WHERE post_id=?").run(content.trim(),id); return getPost(id,db);
}
export function generateCandidates(input={},db=getDb()){
  const accountId=input.account_id||'engineer_career_x'; if(!db.prepare('SELECT id FROM accounts WHERE id=?').get(accountId)) throw new AppError('アカウントが見つかりません',404);
  const candidates=generateDemoCandidates({accountId,count:input.count}); const inserted=[];
  try { const stmt=db.prepare(`INSERT INTO posts(account_id,platform,content,theme,hook_type,content_type,cta_type,variant,status,review_score,review_notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
    for(const c of candidates){ const result=stmt.run(c.account_id,c.platform,c.content,c.theme,c.hook_type,c.content_type,c.cta_type,c.variant,'draft',c.score,c.note); const id=Number(result.lastInsertRowid); changeStatus(id,'ai_reviewed','ローカルデモレビュー完了',db); changeStatus(id,'pending_human_review','AIレビュー基準80点以上',db); inserted.push(getPost(id,db)); }
    db.prepare('INSERT INTO ai_runs(agent,input_json,output_json,model,input_tokens,output_tokens,cost,status) VALUES (?,?,?,?,?,?,?,?)').run('post_generation',JSON.stringify(input),JSON.stringify({post_ids:inserted.map(p=>p.post_id)}),'local-deterministic-demo',0,0,0,'success');
  } catch(error){ throw error; } return inserted;
}
export function saveMetrics(id,metrics,db=getDb()){
  const post=getPost(id,db); if(!post) throw new AppError('投稿が見つかりません',404); if(post.status!=='posted') throw new AppError('実績は投稿済みの投稿にのみ登録できます',409);
  const keys=['impressions','likes','replies','reposts','bookmarks','profile_clicks','link_clicks','follows','affiliate_clicks','conversions','revenue'];
  const saved={}; for(const key of keys){const value=Number(metrics[key]??0);if(!Number.isFinite(value)||value<0)throw new AppError(`${key}は0以上の数値で入力してください`);saved[key]=value;}
  db.prepare(`INSERT INTO post_metrics(post_id,${keys.join(',')}) VALUES (?,${keys.map(()=>'?').join(',')}) ON CONFLICT(post_id) DO UPDATE SET ${keys.map(k=>`${k}=excluded.${k}`).join(',')},recorded_at=CURRENT_TIMESTAMP`).run(id,...keys.map(k=>saved[k])); return {post_id:id,...saved,...deriveMetrics(saved)};
}
function publishedRows(db,range){return db.prepare(`SELECT p.*,m.* FROM posts p JOIN post_metrics m USING(post_id) WHERE p.status='posted' AND datetime(p.posted_at)>=datetime('now',?) ORDER BY p.posted_at DESC`).all(`-${Math.max(1,Number(range)||30)} days`);}
export function analyze(range=30,db=getDb()){
  const rows=publishedRows(db,range);const insight=buildRuleInsight(rows);db.prepare('INSERT INTO insights(kind,title,data_text,interpretation,action,source,sample_size,period,confidence) VALUES (?,?,?,?,?,?,?,?,?)').run(insight.kind,insight.title,insight.data_text,insight.interpretation,insight.action,insight.source,insight.sample_size,`${range}日`,insight.confidence);return insight;
}
export function dashboardData(db=getDb(),range=30){
  const days=Math.min(365,Math.max(1,Number(range)||30));const posts=listPosts({limit:200},db);const rows=publishedRows(db,days).map(p=>({...p,...deriveMetrics(p),score:revenueScore(p)}));
  const totals=rows.reduce((a,p)=>({impressions:a.impressions+p.impressions,engagements:a.engagements+p.likes+p.replies+p.reposts+p.bookmarks,follows:a.follows+p.follows,link_clicks:a.link_clicks+p.link_clicks,conversions:a.conversions+p.conversions,revenue:a.revenue+p.revenue}),{impressions:0,engagements:0,follows:0,link_clicks:0,conversions:0,revenue:0});
  return {account:db.prepare('SELECT * FROM accounts LIMIT 1').get(),range:days,totals:{...totals,engagement_rate:totals.impressions?totals.engagements/totals.impressions:0},revenueToday:rows.filter(p=>new Date(p.posted_at).toDateString()===new Date().toDateString()).reduce((s,p)=>s+p.revenue,0),approvalQueue:posts.filter(p=>p.status==='pending_human_review'),approved:posts.filter(p=>p.status==='approved'),scheduled:posts.filter(p=>p.status==='scheduled'),posted:rows,topPosts:[...rows].sort((a,b)=>b.score-a.score).slice(0,3),worstPosts:[...rows].sort((a,b)=>a.score-b.score).slice(0,3),insights:db.prepare('SELECT * FROM insights ORDER BY id DESC LIMIT 4').all()};
}
