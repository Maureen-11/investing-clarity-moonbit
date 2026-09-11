import { spawnSync } from 'node:child_process';
import { copyFile, mkdir } from 'node:fs/promises';
const out=spawnSync(process.execPath,['scripts/moon.mjs','build','--release','--target','wasm-gc'],{stdio:'inherit'});
if(out.status!==0) process.exit(out.status ?? 1);
await mkdir('demo',{recursive:true});
await copyFile('_build/wasm-gc/release/build/engine/engine.wasm','demo/engine.wasm');
await mkdir('public/wasm',{recursive:true});
await copyFile('_build/wasm-gc/release/build/engine/engine.wasm','public/wasm/engine.wasm');
