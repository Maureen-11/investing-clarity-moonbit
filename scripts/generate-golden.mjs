// Explicit developer command only. Never runs in CI or automatically after a failed test.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { request, syntheticPoints } from '../tests/helpers.mjs';
const source=resolve(process.argv[2] || '../maintenance-investing-clarity-lab/app/plan/engine.ts');
const { replayWindow, calculateRollingReplay, computeProductMetrics }=await import(pathToFileURL(source));
const cases=[];
for(const frequency of ['daily','monthly','yearly']) for(const unitMode of ['fractional','whole']) {
  const input=request(syntheticPoints(),{frequency,unitMode,initial:250,payment:37,lotSize:unitMode==='whole'?10:1,feeRate:0.3,scheduleDay:15}, {mode:'rolling',requestedYears:1});
  const expectedRolling=calculateRollingReplay(input.history,1,input.options);
  const end=input.history.points.findIndex(p=>p[0]>='2021-01-01');
  cases.push({name:`${frequency}-${unitMode}`,input,expected:{replay:replayWindow(input.history.points,0,end,input.options,true),rolling:expectedRolling,metrics:computeProductMetrics(input.history)}});
}
for(const [name,options] of [
  ['historical-fx',{fxMode:'historical',fxRate:7,fxPoints:[['2020-01-01',7],['2020-07-01',6.5],['2021-01-01',6]]}],
  ['cpi-growth',{contributionGrowth:true,inflationMode:'historical',cpiPoints:[['2020-03-01',100],['2021-01-01',110],['2022-01-01',112]]}],
]) {
  const input=request(syntheticPoints(),{initial:110,feeRate:0.2,...options},{requestedYears:20});
  cases.push({name,input,expected:{replay:replayWindow(input.history.points,0,input.history.points.length-1,input.options,true)}});
}
await mkdir('fixtures',{recursive:true});
await writeFile('fixtures/golden.json',JSON.stringify({upstream:{repository:'https://github.com/Maureen-11/investing-clarity-lab',commit:'0d07e0dd212bcd942de366e9650d05042bf0099e',engineSha256:createHash('sha256').update(await readFile(source)).digest('hex')},synthetic:true,cases},null,2)+'\n');
console.log(`Generated ${cases.length} synthetic golden cases. Review the diff; never regenerate to hide failures.`);
