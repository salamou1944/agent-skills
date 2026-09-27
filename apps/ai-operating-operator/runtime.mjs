import http from 'node:http';
import {startCapabilityFeed,getCapabilityFeedStatus,getCapabilityFeedDocuments,searchCapabilityFeed} from './capability-feed.mjs';

const PORT=Number(process.env.PORT||8787);
const HOST=process.env.HOST||'0.0.0.0';

function json(res,status,payload){
  res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
  res.end(JSON.stringify(payload));
}

startCapabilityFeed();

const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url||'/','http://'+(req.headers.host||'localhost'));
    if(req.method==='GET'&&url.pathname==='/health'){
      return json(res,200,{status:'ok',service:'ai-operating-operator',mode:'continuous',feed:getCapabilityFeedStatus()});
    }
    if(req.method==='GET'&&url.pathname==='/ready'){
      const feed=getCapabilityFeedStatus();
      const ready=Boolean(feed.lastSuccessAt&&feed.sourceCount===5);
      return json(res,ready?200:503,{ready,feed});
    }
    if(req.method==='GET'&&url.pathname==='/v1/sources'){
      return json(res,200,{feed:getCapabilityFeedStatus(),sources:await getCapabilityFeedDocuments({})});
    }
    if(req.method==='GET'&&url.pathname==='/v1/search'){
      const q=url.searchParams.get('q')||'';
      const source=url.searchParams.get('source')||null;
      return json(res,200,{results:await searchCapabilityFeed({query:q,source})});
    }
    return json(res,404,{error:'not_found'});
  }catch(error){
    return json(res,500,{state:'FAILED',error:String(error?.message||error)});
  }
});

server.listen(PORT,HOST,()=>console.log(JSON.stringify({service:'ai-operating-operator',status:'listening',host:HOST,port:PORT})));
