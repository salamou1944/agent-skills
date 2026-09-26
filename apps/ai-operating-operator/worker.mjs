import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {executeTask} from './executor.mjs';
import {probeAccounts} from './account-probes.mjs';

const ROOT=path.dirname(fileURLToPath(import.meta.url));
const queue=process.env.OPERATOR_TASK_QUEUE||path.join(ROOT,'runtime','tasks');
const results=process.env.OPERATOR_RESULT_DIR||path.join(ROOT,'runtime','results');

async function main(){
  await fs.mkdir(queue,{recursive:true});await fs.mkdir(results,{recursive:true});
  const files=(await fs.readdir(queue)).filter(x=>x.endsWith('.json')).sort();
  const caps=await probeAccounts();
  for(const name of files){
    const p=path.join(queue,name);let task;
    try{task=JSON.parse(await fs.readFile(p,'utf8'));}catch(error){await fs.writeFile(path.join(results,name),JSON.stringify({state:'FAILED',failure:{class:'invalid_task',message:error.message}}));continue;}
    try{
      const result=await executeTask(task,{capabilities:{...caps,github:caps.github,'platform.github':caps.github}});
      await fs.writeFile(path.join(results,name),JSON.stringify(result,null,2));
      await fs.unlink(p);
    }catch(error){
      await fs.writeFile(path.join(results,name),JSON.stringify({taskId:task.taskId,state:'FAILED',failure:{class:'worker_error',message:error.message}},null,2));
    }
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
