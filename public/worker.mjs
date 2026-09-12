const ready=(async()=>{
  const response=await fetch(new URL('./wasm/engine.wasm',import.meta.url));
  if(!response.ok)throw new Error(`MoonBit引擎加载失败 (${response.status})`);
  const {instance}=await WebAssembly.instantiate(await response.arrayBuffer(),{}, {builtins:['js-string'],importedStringConstants:'_'});
  return instance.exports;
})();
ready.catch(()=>{});
self.onmessage=async({data})=>{
  try{
    const exports=await ready;
    const allowed={analyze:'analyze_json',compare:'compare_json',ui:'ui_json',validateHistory:'validate_history_json'};
    if(!allowed[data.action])throw new Error('未知引擎操作');
    const result=JSON.parse(exports[allowed[data.action]](JSON.stringify(data.request)));
    if(!result.ok)throw new Error(result.error?.message||'计算失败');
    self.postMessage({id:data.id,result});
  }catch(error){self.postMessage({id:data.id,error:error.message})}
};
