import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { engine } from './helpers.mjs';
import { compare, compareReplay } from './compare.mjs';
const golden=JSON.parse(await readFile(new URL('../fixtures/golden.json',import.meta.url),'utf8'));
for(const c of golden.cases) test(`TypeScript parity: ${c.name}`,()=>{
  const out=engine.analyze(c.input); assert.equal(out.ok,true,JSON.stringify(out));
  compareReplay(out.replay,c.expected.replay,c.name);
  if(c.expected.rolling) {
    for(const key of ['samples','requestedYears','lossShare','limited']) compare(out.rolling[key],c.expected.rolling[key],`${c.name}.rolling.${key}`);
    for(const key of ['worst','median','best']) compareReplay(out.rolling[key],c.expected.rolling[key],`${c.name}.${key}`);
  }
  if(c.expected.metrics) {
    for(const key of ['cagr','volatility','maxDrawdown','drawdownWindow','recoveryDays','recovered']) compare(out.metrics[key],c.expected.metrics[key],`${c.name}.metrics.${key}`);
    out.metrics.annualReturns.forEach((r,i)=>{assert.equal(r.year,c.expected.metrics.annualReturns[i].year);compare(r.value,c.expected.metrics.annualReturns[i].value,`${c.name}.annual.${r.year}`)});
  }
});
