'use client';
import {useEffect,useMemo,useState} from 'react';
import {moon} from './moon-client';
import rules from './calendar-rules.json';
import type {CalendarAnalysis,Frequency,HistorySeries,Market,ProductMetrics,Replay,ReplayOptions,RollingReplay} from './engine';
function useRequest<T>(key:string,enabled:boolean,run:()=>Promise<T>,retain=false){
  const [state,setState]=useState<{key:string;value?:T;error?:string}>({key:''});
  useEffect(()=>{if(!enabled)return;let cancelled=false;run().then(value=>{if(!cancelled)setState({key,value})}).catch(e=>{if(!cancelled)setState({key,error:e.message})});return()=>{cancelled=true};},[key,enabled]);
  return {value:enabled&&(retain||state.key===key)?state.value:undefined,error:enabled&&state.key===key?state.error:undefined,pending:enabled&&state.key!==key};
}
export function useAnalysis(args:{history?:HistorySeries;compared?:HistorySeries;comparedIsIndex?:boolean;isEtf:boolean;isIndex:boolean;options:ReplayOptions;years:number;startDate:string;historyStart:string;market:Market;frequency:Frequency;channelRates:Record<string,string>}){
  const {history,compared,comparedIsIndex=false,options,years,startDate,historyStart,market,frequency,isEtf}=args;
  const cleanOptions={...options,feeRate:Number.isFinite(options.feeRate)?options.feeRate:null};
  // Calendar counting does not need macro series. Keeping FX/CPI points out of
  // this request prevents a market switch from temporarily validating an
  // unrelated series while the selected security is being cleared.
  const calendarOptions={frequency,payment:options.payment,initial:options.initial,inflation:options.inflation,contributionGrowth:options.contributionGrowth};
  const planInput={schemaVersion:1,action:'plan',startDate,years,market,options:calendarOptions,calendarRules:rules};
  const plan=useRequest(JSON.stringify(planInput),true,async()=>{const {result}=await moon('ui',planInput);return {...result,start:new Date(result.start+'T12:00:00'),end:new Date(result.end+'T12:00:00')} as CalendarAnalysis&{principal:number;periodicPrincipal:number}},true);
  const requestKey=JSON.stringify([history,cleanOptions,years,historyStart,isEtf]);
  const selected=useRequest(requestKey,Boolean(history),async()=>{
    const meta={schemaVersion:1,history};
    const metrics=(await moon('ui',{...meta,action:'metrics'})).result as ProductMetrics;
    if(!isEtf)return {metrics,replay:null,shortReplay:null,specificReplay:null,replayForDisplay:null,warnings:[]};
    // Engine chooses the longest actual interval. Never pass invented proxy history.
    const result=await moon('analyze',{...meta,instrumentKind:'etf',mode:'rolling',requestedYears:years,options:cleanOptions,availableWindow:true});
    const specific=await moon('analyze',{...meta,instrumentKind:'etf',mode:'replay',requestedYears:years,options:cleanOptions,startDate:historyStart||history!.firstDate});
    const replay=result.rolling?{...result.rolling,firstDate:history!.firstDate,lastDate:history!.lastDate} as RollingReplay:null;
    const full=result.replay as Replay;
    return {metrics,replay,shortReplay:replay?null:full,specificReplay:specific.replay as Replay,replayForDisplay:replay??{samples:1,requestedYears:0,firstDate:history!.firstDate,lastDate:history!.lastDate,worst:full,median:full,best:full,lossShare:result.lossShare??0,limited:true},warnings:result.warnings as string[]};
  });
  const comparison=useRequest(JSON.stringify([history,compared,comparedIsIndex]),Boolean(history&&compared&&isEtf&&!comparedIsIndex),async()=>{
    // Comparison is a metrics-only MoonBit operation. Keep the original ETF
    // kind; using an index wrapper here would silently mislabel ETF history.
    const common=(await moon('ui',{schemaVersion:1,action:'compare',first:{schemaVersion:1,history:history!},second:{schemaVersion:1,history:compared!}})).result as {commonStart:string;commonEnd:string;first:{metrics:ProductMetrics;history:HistorySeries};second:{metrics:ProductMetrics;history:HistorySeries}};
    const other=(await moon('ui',{schemaVersion:1,action:'metrics',history:compared})).result as ProductMetrics;
    return {common,other};
  });
  const base=selected.value?.replayForDisplay?.median;
  const rates=Object.fromEntries(Object.entries(args.channelRates).map(([k,v])=>[k,v.trim()===''?null:Number(v)]));
  const fees=useRequest(JSON.stringify([base,history,cleanOptions,rates]),Boolean(base&&history&&isEtf),async()=> (await moon('ui',{schemaVersion:1,action:'channels',history,options:cleanOptions,startIndex:base!.startIndex,endIndex:base!.endIndex,anchorDate:base!.anchorDate,rates})).result as {key:string;paid:number;opportunity:number;rank:number;gap:number}[]);
  return {calendar:plan.value,principal:plan.value?.principal,periodicPrincipal:plan.value?.periodicPrincipal,
    metrics:selected.value?.metrics??null,replay:selected.value?.replay??null,shortReplay:selected.value?.shortReplay??null,specificReplay:selected.value?.specificReplay??null,replayForDisplay:selected.value?.replayForDisplay??null,
    comparedMetrics:comparison.value?.other??null,common:comparison.value?.common??null,
    commonMetricsA:comparison.value?.common.first.metrics??null,commonMetricsB:comparison.value?.common.second.metrics??null,
    channelResults:fees.value??[],pending:plan.pending||selected.pending||comparison.pending||fees.pending,
    error:plan.error||selected.error||comparison.error||fees.error,warnings:selected.value?.warnings??[]};
}
