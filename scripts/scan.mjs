import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
const files=spawnSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'});
if(files.status!==0)throw Error(files.stderr);
const findings=[];
for(const path of new Set(files.stdout.split('\0').filter(Boolean))) {
  if(/(^|\/)(node_modules|_build|artifacts|\.tools|\.openai|preview-assets)(\/|$)/.test(path)||/\.(wasm|zip|png|jpg|exe)$/.test(path))findings.push(`${path}: non-source file in publication scope`);
  const value=await readFile(path,'utf8');
  const patterns=[[/\b(?:ghp_|github_pat_|sk-proj-)[A-Za-z0-9_]{20,}/,'credential'],[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,'private key'],[/[A-Z]:[\\/]Users[\\/]/i,'local absolute path'],[/(?:新华保险|NCI\s*新华)/,'internal brand']];
  // Scanner regex literals themselves do not contain any real matches.
  for(const [pattern,label]of patterns){
    if(path==='scripts/scan.mjs'&&label==='internal brand')continue; // the detection pattern, not an asset
    if(pattern.test(value))findings.push(`${path}: ${label}`);
  }
}
if(findings.length){console.error(findings.join('\n'));process.exitCode=1}else console.log('Source boundary scan passed; no tokens, private keys, local user paths, internal brand assets or build outputs found.');
