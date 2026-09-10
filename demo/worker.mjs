import { createEngine } from './bridge.mjs';
const ready=fetch('./engine.wasm').then(r=>{if(!r.ok)throw Error(`Wasm HTTP ${r.status}`);return r.arrayBuffer()}).then(createEngine);
self.onmessage=async({data})=>{
  try { const engine=await ready; const result=data.action==='smoke'?{sum:engine.add(2,3),echo:engine.echo({label:'简投学堂 😀'})}:engine[data.action](data.request);self.postMessage({id:data.id,result}); }
  catch(error){self.postMessage({id:data.id,error:error.message});}
};
