import http from 'node:http';
import {startCapabilityFeed,getCapabilityFeedStatus,getCapabilityFeedDocuments,searchCapabilityFeed} from './capability-feed.mjs';
import {dispatchToElite,getEliteBridgeStatus} from './elite-bridge.mjs';

const PORT=Number(process.env.PORT||8787);
const HOST=process.env.HOST||'0.0.0.0';
const MAX_BODY_BYTES=64*1024;

function json(res,status,payload){
  res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
  res.end(JSON.stringify(payload));
}

async function readJson(req){
  let body='';
  for await(const chunk of req){
    body+=chunk;
    if(Buffer.byteLength(body,'utf8')>MAX_BODY_BYTES) throw new Error('request_body_too_large');
  }
  if(!body.trim()) return {};
  return JSON.parse(body);
}

startCapabilityFeed();

const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url||'/','http://'+(req.headers.host||'localhost'));
    if(req.method==='GET'&&url.pathname==='/health'){
      return json(res,200,{status:'ok',service:'ai-operating-operator',mode:'continuous',feed:getCapabilityFeedStatus(),elite:getEliteBridgeStatus()});
    }
    if(req.method==='GET'&&url.pathname==='/ready'){
      const feed=getCapabilityFeedStatus();
      const elite=getEliteBridgeStatus();
      const ready=Boolean(feed.lastSuccessAt&&feed.sourceCount===5);
      return json(res,ready?200:503,{ready,feed,elite});
    }
    if(req.method==='GET'&&url.pathname==='/v1/elite/status'){
      return json(res,200,getEliteBridgeStatus());
    }
    if(req.method==='GET'&&url.pathname==='/v1/sources'){
      return json(res,200,{feed:getCapabilityFeedStatus(),sources:await getCapabilityFeedDocuments({})});
    }
    if(req.method==='GET'&&url.pathname==='/v1/search'){
      const q=url.searchParams.get('q')||'';
      const source=url.searchParams.get('source')||null;
      return json(res,200,{results:await searchCapabilityFeed({query:q,source})});
    }
    if(req.method==='POST'&&url.pathname==='/v1/task'){
      const input=await readJson(req);
      if(!String(input.goal||'').trim()) return json(res,400,{state:'FAILED',error:'goal_required'});
      const result=await dispatchToElite(input);
      const status=result.state==='VERIFIED'?200:
        result.state==='BLOCKED_PERMISSION'?403:
        result.state==='BLOCKED_EXTERNAL_DEPENDENCY'?503:502;
      return json(res,status,result);
    }
    return json(res,404,{error:'not_found'});
  }catch(error){
    const message=String(error?.message||error);
    return json(res,message==='request_body_too_large'?413:500,{state:'FAILED',error:message});
  }
});

server.listen(PORT,HOST,()=>console.log(JSON.stringify({service:'ai-operating-operator',status:'listening',host:HOST,port:PORT})));
