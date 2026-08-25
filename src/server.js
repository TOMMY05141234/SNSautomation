import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { dashboardData, changeStatus, updateContent, saveMetrics } from './database/repository.js';
import { getDb } from './database/db.js';

const port = Number(process.env.PORT || 3001);
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
const send = (res, status, body, type='application/json; charset=utf-8') => { res.writeHead(status, {'content-type':type}); res.end(type.startsWith('application/json') ? JSON.stringify(body) : body); };
async function body(req) { let raw=''; for await (const chunk of req) raw += chunk; return raw ? JSON.parse(raw) : {}; }
export const server = createServer(async (req,res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === '/api/dashboard' && req.method === 'GET') return send(res,200,dashboardData(getDb(),Number(url.searchParams.get('range')||30)));
    const statusMatch = url.pathname.match(/^\/api\/posts\/(\d+)\/status$/);
    if (statusMatch && req.method === 'PATCH') { const input=await body(req); return send(res,200,changeStatus(Number(statusMatch[1]),input.status,input.note)); }
    const postMatch = url.pathname.match(/^\/api\/posts\/(\d+)$/);
    if (postMatch && req.method === 'PATCH') { const input=await body(req); return send(res,200,updateContent(Number(postMatch[1]),input.content)); }
    const metricsMatch = url.pathname.match(/^\/api\/posts\/(\d+)\/metrics$/);
    if (metricsMatch && req.method === 'PUT') return send(res,200,saveMetrics(Number(metricsMatch[1]),await body(req)));
    if (url.pathname.startsWith('/api/')) return send(res,404,{error:'APIが見つかりません'});
    const requested = url.pathname === '/' ? 'index.html' : normalize(url.pathname).replace(/^[/\\]+/, '');
    const file = join(process.cwd(),'dashboard',requested);
    if (!file.startsWith(join(process.cwd(),'dashboard')) || !existsSync(file)) return send(res,404,'Not found','text/plain');
    return send(res,200,readFileSync(file),mime[extname(file)]||'application/octet-stream');
  } catch (error) { return send(res,error.message.includes('変更できません') ? 409 : 400,{error:error.message}); }
});
if (process.argv[1]?.endsWith('server.js')) server.listen(port,()=>console.log(`SNS Growth OS: http://localhost:${port}`));
