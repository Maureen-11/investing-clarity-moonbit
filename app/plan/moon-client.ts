let worker:Worker|undefined;
let sequence=0;
const pending=new Map<number,{resolve:(r:any)=>void;reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
export function moon(action:'analyze'|'compare'|'ui'|'validateHistory',request:unknown):Promise<any>{
  if(!worker){
    worker=new Worker(`${process.env.NEXT_PUBLIC_BASE_PATH??''}/worker.mjs`,{type:'module'});
    worker.onmessage=({data})=>{const p=pending.get(data.id);if(!p)return;pending.delete(data.id);clearTimeout(p.timer);data.error?p.reject(new Error(data.error)):p.resolve(data.result)};
    worker.onerror=()=>{for(const p of pending.values()){clearTimeout(p.timer);p.reject(new Error('MoonBit引擎不可用，请检查浏览器支持与网络'))}pending.clear();worker?.terminate();worker=undefined;};
  }
  return new Promise((resolve,reject)=>{const id=++sequence;const timer=setTimeout(()=>{pending.delete(id);reject(new Error('计算超时，请缩短区间后重试'))},60000);pending.set(id,{resolve,reject,timer});worker!.postMessage({id,action,request})});
}
