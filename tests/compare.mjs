import assert from 'node:assert/strict';
const money=new Set(['endValue','realEndValue','principal','feeDrag','value','realValue','realPrincipal']);
export function compareReplay(actual,expected,label) {
  for(const key of ['anchorDate','start','end','startIndex','endIndex','endValue','realEndValue','principal','contributions','multiple','productMaxDrawdown','accountWorstReturn','recoveryDays','feeDrag','feeRateKnown','inflationFactor','startFx','endFx']) {
    compare(actual[key],expected[key],`${label}.${key}`,money.has(key));
  }
  if(expected.path) {
    assert.equal(actual.path.length,expected.path.length,`${label}.path.length`);
    expected.path.forEach((p,i)=>Object.entries(p).forEach(([k,v])=>compare(actual.path[i][k],v,`${label}.path.${i}.${k}`,money.has(k))));
  }
}
export function compare(actual,expected,label,isMoney=false) {
  if(typeof expected==='number' && !Number.isInteger(expected) || isMoney) {
    const tolerance=isMoney?Math.max(.01,Math.abs(expected)*1e-9):1e-8;
    assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=tolerance,`${label}: actual=${actual}, expected=${expected}, tolerance=${tolerance}`);
  } else assert.equal(actual,expected,label);
}
