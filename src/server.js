import { AppError, ensureBootstrap, dashboardData, listPosts, generateCandidates, analyze, updateContent, changeStatus, saveMetrics } from './database/d1-repository.js';

const json=(payload,status=200)=>Response.json(payload,{status,headers:{'cache-control':'no-store'}});
async function body(request){const length=Number(request.headers.get('content-length')||0);if(length>1_000_000)throw new AppError('リクエストが大きすぎます',413);try{return await request.json();}catch{throw new AppError('JSON形式が不正です');}}
function idFrom(path,suffix=''){const match=path.match(new RegExp(`^/api/posts/(?<id>\\d+)${suffix}$`));return match?Number(match.groups.id):null;}
async function api(request,env){if(!env.DB)throw new AppError('D1 binding DB が設定されていません',503);await ensureBootstrap(env.DB);const url=new URL(request.url);const path=url.pathname;
  if(path==='/api/health'&&request.method==='GET')return json({status:'ok',database:'d1',storage:env.CONTENT_STORE?'kv':'not_configured',time:new Date().toISOString()});
  if(path==='/api/dashboard'&&request.method==='GET')return json(await dashboardData(env.DB,url.searchParams.get('range')));
  if(path==='/api/posts'&&request.method==='GET')return json({items:await listPosts(env.DB,{status:url.searchParams.get('status')||undefined,limit:url.searchParams.get('limit')})});
  if(path==='/api/posts/generate'&&request.method==='POST')return json({items:await generateCandidates(env.DB,env.CONTENT_STORE,await body(request))},201);
  if(path==='/api/analysis/run'&&request.method==='POST'){const input=await body(request);return json(await analyze(env.DB,input.range||30),201);}
  let id=idFrom(path);if(id&&request.method==='PATCH')return json(await updateContent(env.DB,id,(await body(request)).content));
  id=idFrom(path,'/status');if(id&&request.method==='PATCH'){const input=await body(request);return json(await changeStatus(env.DB,id,input.status,input.note,{scheduledAt:input.scheduled_at,postedAt:input.posted_at}));}
  id=idFrom(path,'/metrics');if(id&&request.method==='PUT')return json(await saveMetrics(env.DB,id,await body(request)));
  return json({error:'APIが見つかりません'},404);
}
export default {async fetch(request,env){try{const url=new URL(request.url);if(url.pathname.startsWith('/api/'))return await api(request,env);if(!env.ASSETS)throw new AppError('Static Assets binding ASSETS が設定されていません',503);return env.ASSETS.fetch(request);}catch(error){console.error(error);return json({error:error instanceof AppError?error.message:'サーバー内部でエラーが発生しました'},error instanceof AppError?error.status:500);}}};
