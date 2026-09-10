import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { engine, base } from '../tests/helpers.mjs';
import { compareReplay, compare } from '../tests/compare.mjs';
const root=resolve(process.argv[2]||'../maintenance-investing-clarity-lab');
const manifestBytes=await readFile(resolve(root,'public/data/etf-pack-manifest.json'));
const manifest=JSON.parse(manifestBytes);
assert.equal(manifest.entries.length,300);assert.equal(manifest.indices.length,15);
const upstream=await import(pathToFileURL(resolve(root,'app/plan/engine.ts')));
const report={date:new Date().toISOString(),manifestHash:createHash('sha256').update(manifestBytes).digest('hex'),etfs:0,indices:0,replays:0,rolling:0,failures:[]};
const important=new Set(['159919','510300','510880','512890','VOO','QQQ','SCHX','SCHD','VT','BND','TLT','GLD','02800','03033']);
for(const entry of [...manifest.entries,...manifest.indices]) {
  try {
    const history=JSON.parse(await readFile(resolve(root,'public',entry.historyPath),'utf8'));
    const core={schemaVersion:1,instrumentKind:entry.instrumentKind,history,requestedYears:100};
    if(entry.instrumentKind==='index') {
      const out=engine.analyze(core);assert.equal(out.ok,true,JSON.stringify(out));assert.equal(out.replay,null);assert.ok(Number.isFinite(out.metrics.maxDrawdown));
      assert.equal(engine.analyze({...core,mode:'replay',options:base}).ok,false);report.indices++;
    } else {
      for(const frequency of ['daily','monthly','yearly']) {
        const options={...base,frequency,payment:10,feeRate:.1};
        const out=engine.analyze({...core,options});assert.equal(out.ok,true,JSON.stringify(out));
        const expected=upstream.replayWindow(history.points,0,history.points.length-1,options,true);
        compareReplay(out.replay,expected,`${entry.id}.${frequency}`);report.replays++;
      }
      // Every ETF executes rolling mode, including the explicit no-full-window path.
      const out=engine.analyze({...core,mode:'rolling',requestedYears:20,options:base});assert.equal(out.ok,true,JSON.stringify(out));
      const expected=upstream.calculateRollingReplay(history,20,base);
      if(expected) {
        compare(out.rolling.samples,expected.samples,`${entry.id}.rolling.samples`);
        for(const k of ['worst','median','best'])compareReplay(out.rolling[k],expected[k],`${entry.id}.${k}`);
      } else assert.equal(out.rolling,null);
      report.rolling++;
      if(important.has(entry.symbol)) {
        const metrics=upstream.computeProductMetrics(history);
        if(metrics&&out.metrics.cagr!==null) for(const k of ['cagr','volatility','maxDrawdown','recoveryDays','recovered'])compare(out.metrics[k],metrics[k],`${entry.id}.metrics.${k}`);
      }
      report.etfs++;
    }
  } catch(error) {report.failures.push({id:entry.id,error:error.message});}
  if((report.etfs+report.indices)%25===0) console.log(`Verified ${report.etfs} ETFs, ${report.indices} indices`);
}
await mkdir('artifacts',{recursive:true});await writeFile('artifacts/upstream-verification.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));if(report.failures.length)process.exitCode=1;
