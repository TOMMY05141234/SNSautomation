import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { dashboardData, changeStatus, updateContent, saveMetrics, listPosts, generateCandidates, analyze, AppError } from './database/repository.js';
import { getDb } from './database/db.js';
import { ensureBootstrap } from './database/bootstrap.js';

const port=Number(process.env.PORT||3001);const root=join(process.cwd(),'dashboard');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
function send(res,status,payload,type='application/json; charset=utf-8'){const body=type.startsWith('application/json')?JSON.stringify(payload):payload;res.writeHead(status,{'content-type':type,'content-length':Buffer.byteLength(body),'cache-control':'no-store'});res.end(body);}
async function parseBody(req){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>1_000_000)throw new AppError('リクエストが大きすぎます',413);}if(!raw)return{};try{return JSON.parse(raw);}catch{throw new AppError('JSON形式が不正です');}}
function route(method,path,pattern){if(method!==pattern.method)return null;const match=path.match(pattern.path);return match?.groups||null;}
export function createAppServer({db=getDb()}={}){ensureBootstrap(db);return createServer(async(req,res)=>{try{const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);const path=url.pathname;
  if(req.method==='OPTIONS'){res.writeHead(204,{'access-control-allow-methods':'GET,POST,PATCH,PUT,OPTIONS','access-control-allow-headers':'content-type'});return res.end();}
  if(path==='/api/health'&&req.method==='GET')return send(res,200,{status:'ok',database:'connected',time:new Date().toISOString()});
  if(path==='/api/dashboard'&&req.method==='GET')return send(res,200,dashboardData(db,url.searchParams.get('range')));
  if(path==='/api/posts'&&req.method==='GET')return send(res,200,{items:listPosts({status:url.searchParams.get('status')||undefined,limit:url.searchParams.get('limit')},db)});
  if(path==='/api/posts/generate'&&req.method==='POST')return send(res,201,{items:generateCandidates(await parseBody(req),db)});
  if(path==='/api/analysis/run'&&req.method==='POST'){const input=await parseBody(req);return send(res,201,analyze(input.range||30,db));}
  let params=route(req.method,path,{method:'PATCH',path:/^\/api\/posts\/(?<id>\d+)$/});if(params)return send(res,200,updateContent(Number(params.id),(await parseBody(req)).content,db));
  params=route(req.method,path,{method:'PATCH',path:/^\/api\/posts\/(?<id>\d+)\/status$/});if(params){const input=await parseBody(req);return send(res,200,changeStatus(Number(params.id),input.status,input.note,db,{scheduledAt:input.scheduled_at,postedAt:input.posted_at}));}
  params=route(req.method,path,{method:'PUT',path:/^\/api\/posts\/(?<id>\d+)\/metrics$/});if(params)return send(res,200,saveMetrics(Number(params.id),await parseBody(req),db));
  if(path.startsWith('/api/'))return send(res,404,{error:'APIが見つかりません'});
  const requested=path==='/'?'index.html':normalize(path).replace(/^[/\\]+/,'');const file=join(root,requested);if(!file.startsWith(root)||!existsSync(file)||!statSync(file).isFile())return send(res,404,'Not found','text/plain; charset=utf-8');return send(res,200,readFileSync(file),mime[extname(file)]||'application/octet-stream');
}catch(error){console.error(error);return send(res,error.status||500,{error:error.status?error.message:'サーバー内部でエラーが発生しました'});}});}
export const server=createAppServer();
if(process.argv[1]?.endsWith('server.js'))server.listen(port,'0.0.0.0',()=>console.log(`SNS Growth OS: http://localhost:${port}`));
