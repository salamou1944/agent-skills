const endpoint='https://backboard.railway.com/graphql/v2';
const token=process.env.RAILWAY_PROJECT_ACCESS_TOKEN||process.env.RAILWAY_TOKEN;
const projectId=process.env.RAILWAY_PROJECT_ID;
const serviceId=process.env.RAILWAY_SERVICE_ID;
const environmentId=process.env.RAILWAY_ENVIRONMENT_ID;
const desiredMount='/app/data';
const legacyVolumeId='6bd4d51f-923b-43b3-a80c-74720342786a';
if(!token||!projectId||!serviceId){console.log(JSON.stringify({volumeBootstrap:'SKIPPED',reason:'railway_credentials_missing'}));process.exit(0);}
async function gql(query,variables){const r=await fetch(endpoint,{method:'POST',headers:{'Project-Access-Token':token,'Content-Type':'application/json'},body:JSON.stringify({query,variables})});return await r.json();}
const legacy=await gql('query($id:String!){volumeInstance(id:$id){id mountPath volume{id name}}}',{id:legacyVolumeId});
if(legacy.data?.volumeInstance?.id){const deleted=await gql('mutation($volumeId:String!){volumeDelete(volumeId:$volumeId)}',{volumeId:legacyVolumeId});if(deleted.errors)throw new Error(`legacy_volume_delete_failed:${deleted.errors[0]?.message||'unknown'}`);console.log(JSON.stringify({volumeBootstrap:'REMOVED_DUPLICATE',volumeId:legacyVolumeId}));}
const existing=await gql('query($id:String!){project(id:$id){volumes{edges{node{id name createdAt}}}}}',{id:projectId});
if(existing.errors)throw new Error(`volume_list_failed:${existing.errors[0]?.message||'unknown'}`);
const volumes=existing.data?.project?.volumes?.edges?.map(x=>x.node)||[];
const attached=volumes.find(v=>v.name==='easy-customer-data');
if(attached){console.log(JSON.stringify({volumeBootstrap:'READY',volumeId:attached.id,volumeName:attached.name,mountPath:desiredMount,environmentId}));process.exit(0);}
const created=await gql('mutation($input:VolumeCreateInput!){volumeCreate(input:$input){id name}}',{input:{projectId,serviceId,mountPath:desiredMount,environmentId}});
if(created.errors)throw new Error(`volume_create_failed:${created.errors[0]?.message||'unknown'}`);
console.log(JSON.stringify({volumeBootstrap:'CREATED',volumeId:created.data?.volumeCreate?.id,volumeName:created.data?.volumeCreate?.name,mountPath:desiredMount,environmentId}));
