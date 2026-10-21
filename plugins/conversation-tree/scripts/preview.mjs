import { createServer } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { TreeService, config, pluginRoot } from '../src/service.mjs';
const service=new TreeService();const token=randomBytes(32).toString('hex');
let port;
const server=createServer(async(req,res)=>{
  const origin=`http://127.0.0.1:${port}`;
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  if(req.headers.host!==`127.0.0.1:${port}` || (req.headers.origin&&req.headers.origin!==origin)){res.writeHead(403);res.end();return;}
  if(req.url==='/'&&req.method==='GET'){res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'");res.end(await readFile(join(pluginRoot,'dist/panel.html')));return;}
  res.setHeader('Content-Type','application/json; charset=utf-8');
  const supplied=Buffer.from(req.headers.authorization||'');const expected=Buffer.from(`Bearer ${token}`);
  if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected)){res.writeHead(401);res.end(JSON.stringify({error:'需要本機預覽連線憑證'}));return;}
  if(req.url!=='/api'||req.method!=='POST'){res.writeHead(404);res.end('{}');return;}
  try{
    let body='';for await(const chunk of req){body+=chunk;if(body.length>16384)throw new Error('請求過大');}
    const {name,args={}}=JSON.parse(body);let value;
    if(name==='tree_open')value=await service.open(args.rootThreadId);
    else if(name==='tree_projects')value=await service.projects();
    else if(name==='tree_select_root'){await service.selectRoot(args.rootThreadId);value=await service.snapshot(args.rootThreadId);}
    else if(name==='tree_snapshot')value=await service.snapshot(args.rootThreadId);
    else if(name==='tree_rename')value=await service.renameNode(args.rootThreadId,args.nodeId,args.title);
    else if(name==='tree_fork')value=await service.fork(args.rootThreadId,args.nodeId,args.name);
    else throw new Error('不支援的操作');
    res.end(JSON.stringify(value));
  }catch(error){res.writeHead(400);res.end(JSON.stringify({error:error.message}));}
});
server.listen(0,'127.0.0.1',async()=>{port=server.address().port;const info={url:`http://127.0.0.1:${port}/#token=${token}`,pid:process.pid};await mkdir(config.dataDirectory,{recursive:true});await writeFile(join(config.dataDirectory,'preview.json'),JSON.stringify(info));console.log(`Preview ready on 127.0.0.1:${port}. URL saved in .data/preview.json`);});
function stop(){service.close();server.close();process.exit(0);}
process.on('SIGTERM',stop);process.on('SIGINT',stop);
