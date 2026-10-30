'use strict';
let probeResults = [];
const $ = id => document.getElementById(id);
const configurations = [
  {label:'Widevine / software',system:'com.widevine.alpha',init:'cenc',robustness:'SW_SECURE_CRYPTO'},
  {label:'Widevine / hardware',system:'com.widevine.alpha',init:'cenc',robustness:'HW_SECURE_ALL'},
  {label:'FairPlay / EME',system:'com.apple.fps',init:'sinf',robustness:''},
  {label:'PlayReady / EME',system:'com.microsoft.playready.recommendation',init:'cenc',robustness:''}
];
$('probe').addEventListener('click',async()=>{
  $('probe').disabled=true; $('results').replaceChildren(); probeResults=[];
  try {
    for(const item of configurations){
      let status='unavailable'; let detail='API利用不可';
      if(window.isSecureContext && navigator.requestMediaKeySystemAccess){
        try{
          const access=await navigator.requestMediaKeySystemAccess(item.system,[{initDataTypes:[item.init],videoCapabilities:[{contentType:'video/mp4; codecs="avc1.42E01E"',robustness:item.robustness}],distinctiveIdentifier:'not-allowed',persistentState:'not-allowed',sessionTypes:['temporary']}]);
          status='request-accepted';detail='対応要求を受理';
          probeResults.push({...item,status,configuration:access.getConfiguration()});
        }catch(error){status='request-rejected';detail='この設定では利用不可';probeResults.push({...item,status,error:error.name});}
      }else probeResults.push({...item,status});
      const row=document.createElement('div');row.className='result';const name=document.createElement('span');name.textContent=item.label;const value=document.createElement('span');value.className='status';value.textContent=detail;row.append(name,value);$('results').append(row);
    }
  }finally{$('probe').disabled=false;}
});
$('record').addEventListener('submit',event=>{
  event.preventDefault();
  const result={schemaVersion:1,createdAt:new Date().toISOString(),stage:'capability-lab',protectionVerified:false,drmPlayback:'not-connected',secureContext:window.isSecureContext,userAgent:navigator.userAgent,device:$('device').value.trim(),asset:$('asset').value.trim(),capabilities:probeResults,manualObservations:{screenshot:$('capture').value,screenRecording:$('recording').value,notes:$('notes').value.trim()},warning:'Manual observations are not proof of DRM protection. This build contains no encrypted media or license integration.'};
  const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='sumi-viewer-test-'+Date.now()+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('saved').textContent='検証記録を書き出しました。保護判定は未検証です。';
});
