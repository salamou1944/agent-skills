#!/usr/bin/env node
import process from 'node:process';

const base=String(process.argv[2]||process.env.EASY_PLATFORM_URL||'http://127.0.0.1:8790').replace(/\/$/,'');
const paths=['/api/health','/api/platform','/api/runtime','/api/registry'];
const results=[];
for(const path of paths){
  const started=Date.now();
  try{
    const r=await fetch(base+path,{headers:{accept:'application/json'}});
    const text=await r.text();
    let body;try{body=JSON.parse(text)}catch{body={raw:text.slice(0,500)}}
    results.push({path,status:r.status,ok:r.ok,ms:Date.now()-started,body});
  }catch(error){results.push({path,status:0,ok:false,ms:Date.now()-started,error:String(error.message||error)})}
}
const health=results.find(x=>x.path==='/api/health');
const contract=results.find(x=>x.path==='/api/platform');
const status=health?.ok&&contract?.ok?'VERIFIED':'FAILED';
const report={tool:'platform-runtime-check',status,base,checkedAt:new Date().toISOString(),results};
console.log(JSON.stringify(report,null,2));
if(status!=='VERIFIED')process.exitCode=1;
