import type { EtfPackEntry, EtfPackManifest, HistoryLibrary, HistorySeries, MacroHistory, Security } from './engine';
const base='https://maureen-11.github.io/investing-clarity-lab/';
async function json<T>(path:string):Promise<T>{
  const response=await fetch(new URL(path,base),{signal:AbortSignal.timeout(25000)});
  if(!response.ok)throw new Error(`历史数据请求失败（${response.status}），请重试`);
  return response.json();
}
function sanitizeMacroSeries(series: MacroHistory["fx"]["USD_CNY"] | MacroHistory["cpiCny"] | undefined) {
  if (!series) return series;
  // A missing FX quote is represented as 0 in one legacy snapshot. The
  // MoonBit validator correctly rejects it; omit that observation so the
  // engine can carry the last valid quote forward and surface its warning.
  return {...series, points: series.points.filter(([,value]) => Number.isFinite(value) && value > 0)};
}
export async function loadMarketData(_basePath=''){
  const [directory,etfManifest,rawMacro]=await Promise.all([
    json<Security[]>('data/securities.json'),json<EtfPackManifest>('data/etf-pack-manifest.json'),json<MacroHistory>('data/macro-history.json')]);
  const macroHistory:MacroHistory={...rawMacro,fx:{...rawMacro.fx,USD_CNY:sanitizeMacroSeries(rawMacro.fx.USD_CNY),HKD_CNY:sanitizeMacroSeries(rawMacro.fx.HKD_CNY)},cpiCny:sanitizeMacroSeries(rawMacro.cpiCny)};
  return {directory,etfManifest,macroHistory,historyLibrary:{} as HistoryLibrary,source:'static' as const};
}
const inflight=new Map<string,Promise<HistorySeries>>();
export async function loadSecurityHistory(entry:EtfPackEntry|undefined,_basePath=''){
  if(!entry?.historyPath)return undefined;
  const path=entry.historyPath;
  if(!inflight.has(path))inflight.set(path,json<HistorySeries>(path).finally(()=>inflight.delete(path)));
  return inflight.get(path)!;
}
