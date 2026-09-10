import { offlineHistory } from './offline.mjs';
const $=id=>document.getElementById(id);
const dataBase='https://maureen-11.github.io/investing-clarity-lab/';
const worker=new Worker('./worker.mjs',{type:'module'});
let sequence=0;const pending=new Map();
worker.onmessage=({data})=>{const p=pending.get(data.id);if(p){pending.delete(data.id);data.error?p.reject(Error(data.error)):p.resolve(data.result)}};
worker.onerror=event=>{for(const p of pending.values())p.reject(Error(event.message||'计算线程启动失败'));pending.clear();$('engine-status').textContent='引擎加载失败，请使用支持 Wasm GC 的现代浏览器';};
function call(action,request){return new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});worker.postMessage({id,action,request})})}
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>n==null?'未知':new Intl.NumberFormat('zh-CN',{maximumFractionDigits:2}).format(n);
const percent=n=>n==null?'历史不足 / 不适用':`${n.toFixed(2)}%`;
let manifest,selected,history,macro,loadSequence=0;
async function getJson(path){const response=await fetch(new URL(path,dataBase),{signal:AbortSignal.timeout(25000)});if(!response.ok)throw Error(`HTTP ${response.status}`);return response.json()}
function populate(){if(!manifest)return;const query=$('search').value.trim().toLowerCase();const entries=[...manifest.entries,...manifest.indices].filter(e=>`${e.symbol} ${e.name} ${e.market}`.toLowerCase().includes(query));$('security').innerHTML='<option value="">请选择标的</option>'+entries.map(e=>`<option value="${escape(e.id)}">${escape(e.market)} · ${escape(e.symbol)} ${escape(e.name)} ${e.instrumentKind==='index'?'[指数]':''}</option>`).join('');if(selected)$('security').value=selected.id;}
function ready(){ $('calculate').disabled=!history; }
function setHistory(value,entry){history=value;selected=entry;$('start').value=value.firstDate;$('investment-inputs').hidden=entry.instrumentKind==='index';$('data-state').textContent=`${entry.name} · ${value.firstDate} 至 ${value.lastDate} · ${value.points.length} 条观察`;if(entry.synthetic){$('fx').value=1;$('fx-mode').value='fixed';$('cpi-mode').value='scenario'}else if(entry.market==='CN'){$('fx').value=1;}else{$('fx').value=entry.market==='US'?7.2:.93;} $('lot').value=entry.market==='US'?1:100;ready();}
$('offline').onclick=()=>{loadSequence++;setHistory(offlineHistory(),{id:'synthetic',name:'人工教学示例（非真实证券）',instrumentKind:'etf',synthetic:true,market:'CN'});$('security').value='';};
$('search').oninput=populate;
$('security').onchange=async()=>{
  const ticket=++loadSequence;const entry=[...manifest.entries,...manifest.indices].find(e=>e.id===$('security').value);history=null;ready();if(!entry)return;
  $('data-state').textContent=`正在加载 ${entry.name} 的历史…`;
  try{const value=await getJson(entry.historyPath);if(ticket===loadSequence)setHistory(value,entry)}catch(error){if(ticket===loadSequence)$('data-state').textContent=`数据加载失败：${error.message}。可重试或主动选择人工教学示例。`}
};
const warnings={PUBLIC_DISPLAY_PERMISSION_UNCONFIRMED:'此历史数据的公开展示及再分发许可尚未确认。',PRICE_ONLY_NOT_TOTAL_RETURN:'当前序列只有价格，不包含完整分红总收益。',LESS_THAN_ONE_YEAR_NO_ANNUALIZATION:'不足一年，仅显示实际累计表现，不显示年化收益。',REQUESTED_WINDOW_SHORTENED_TO_AVAILABLE_HISTORY:'历史短于计划期限，已使用实际可用区间。',START_SHIFTED_TO_FIRST_AVAILABLE_OBSERVATION:'起点已移至首个可用历史日期。',FIXED_FX_USED_BEFORE_AVAILABLE_FX_HISTORY:'汇率历史开始前使用填写的备用汇率。',LAST_AVAILABLE_FX_CARRIED_FORWARD:'汇率历史结束后沿用最后已知汇率。',INFLATION_SCENARIO_USED_OUTSIDE_CPI_HISTORY:'CPI未覆盖的部分使用通胀情景假设。',FEE_RATE_UNKNOWN:'费率未知，未生成费用拖累估算。',FEE_DRAG_IS_COUNTERFACTUAL_NOT_DEDUCTED_AGAIN:'费用影响为独立反事实估算，未从历史余额再次扣费。',NO_FULL_ROLLING_WINDOW_FULL_AVAILABLE_REPLAY_SHOWN:'没有足够长的完整滚动窗口，当前展示实际历史回放。'};
function chart(path,keys){
  const all=path.flatMap(p=>keys.map(k=>p[k]));if(!all.length)return '';
  const min=Math.min(0,...all),max=Math.max(1,...all),range=max-min;
  const colors=['#147c67','#bb9363'];
  return `<svg viewBox="0 0 600 250" role="img" aria-label="${keys.length===2?'账户价值和累计投入随历史日期变化':'产品历史表现'}"><line x1="35" x2="580" y1="210" y2="210" stroke="#ccd4ce"/>${keys.map((key,k)=>`<polyline fill="none" stroke="${colors[k]}" stroke-width="3" points="${path.map((p,i)=>`${35+i/Math.max(1,path.length-1)*545},${210-(p[key]-min)/range*175}`).join(' ')}"/>`).join('')}<text x="35" y="240" fill="#5b6f78" font-size="12">${escape(path[0].date)}</text><text x="580" y="240" text-anchor="end" fill="#5b6f78" font-size="12">${escape(path.at(-1).date)}</text><text x="35" y="23" fill="#5b6f78" font-size="12">${money(max)}</text></svg>`;
}
function render(out){
  const r=out.replay,m=out.metrics;const title=escape(selected.name);
  const summary=r?`<p class="eyebrow">${title} / HISTORICAL REPLAY</p><p>期末账户价值 · 人民币元</p><div class="amount">${money(r.endValue)}</div><div class="stats"><div><p>累计投入（元）</p><strong>${money(r.principal)}</strong></div><div><p>定投次数</p><strong>${r.contributions} 次</strong></div><div><p>盈亏（元）</p><strong>${money(r.endValue-r.principal)}</strong></div></div><p class="small" style="color:#c4dbd6">${escape(r.start)} → ${escape(r.end)} · 请求 ${out.requestedYears} 年 / 使用 ${out.availableYears.toFixed(2)} 年</p>`:`<p class="eyebrow">${title} / INDEX CONTEXT</p><p>指数累计价格表现</p><div class="amount">${percent(m.cumulativeReturn)}</div><p>指数作为市场参照，不能直接购买；此处不生成定投账户结果。</p>`;
  const rolling=out.rolling?`<div class="panel"><h3>过去不同起点，会有怎样的结果？</h3><table><thead><tr><th>历史路径</th><th>期末价值（元）</th><th>总投入（元）</th></tr></thead><tbody>${[['worst','最差'],['median','中间'],['best','最好']].map(([k,label])=>`<tr><td>${label}</td><td>${money(out.rolling[k].endValue)}</td><td>${money(out.rolling[k].principal)}</td></tr>`).join('')}</tbody></table><p>${out.rolling.samples} 个历史窗口，按期末价值与本金之比排序。相邻窗口重叠，不代表独立样本或未来概率。</p></div>`:'';
  $('results').innerHTML=`<div class="summary">${summary}</div><div class="panel"><h3>${r?'投入与账户价值':'指数增长：起点 = 100'}</h3>${chart(r?r.path:m.growth,r?['value','principal']:['value'])}<div class="legend">${r?'绿色：账户价值　棕色：累计投入':'绿色：产品价格增长'}</div><p>${r?'本金是你累计放进去的钱，账户价值还包含历史涨跌和汇率影响。':'这是市场走势，不是可购买产品的实际持有收益。'}</p></div>${rolling}<div class="panel"><h3>收益背后，经历了什么？</h3><div class="risk-grid"><div><span>产品历史最大回撤</span><strong>${percent(m.maxDrawdown)}</strong></div><div><span>谷底到恢复 / 观察终点</span><strong>${m.recoveryDays} 天${m.recovered?'':' · 未恢复'}</strong></div><div><span>产品年化增长</span><strong>${percent(m.cagr)}</strong></div><div><span>期末购买力（元）</span><strong>${r?money(r.realEndValue):'不适用'}</strong></div></div><p>风险指标使用所加载产品的完整历史；账户回放使用你选择的区间。回撤不等于你的账户本金亏损。</p>${r?`<p>费用反事实估算：${money(r.feeDrag)} 元。已反映在调整价格中的费用不会重复扣除。</p>`:''}</div><div class="panel"><h3>自然年度表现</h3>${m.annualReturns.length?`<table><tbody>${m.annualReturns.map(y=>`<tr><td>${escape(y.year)}${y.partial?'（截至数据末日）':''}</td><td>${percent(y.value)}</td></tr>`).join('')}</tbody></table>`:'<p>尚无跨年度比较数据。</p>'}</div><div class="notice"><ul>${out.warnings.map(w=>`<li>${escape(warnings[w]||w)}</li>`).join('')}</ul></div><div class="panel source"><h3>数据与方法</h3><p>${escape(out.source.source)}<br>抓取日期：${escape(out.source.retrieved||'未提供')}<br>最近历史日期：${escape(out.source.lastDate)}<br>序列：${escape(out.source.seriesType||'未提供')}<br>MoonBit 引擎：${escape(out.engineVersion)}</p><p>使用供应商历史序列，非实时行情，不承诺未来收益。统计不包含未明确建模的交易佣金和税费。</p></div>`;
}
$('plan').onsubmit=async event=>{
  event.preventDefault();if(!history)return;$('calculate').disabled=true;$('calculate').textContent='MoonBit 计算中…';
  try{
    let options;
    if(selected.instrumentKind==='etf'){
      if(($('fx-mode').value==='historical'||$('cpi-mode').value==='historical')&&!macro)macro=await getJson('data/macro-history.json');
      options={frequency:$('frequency').value,payment:+$('payment').value,initial:+$('initial').value,inflation:+$('inflation').value,contributionGrowth:$('growth').checked,fxRate:+$('fx').value,fxMode:$('fx-mode').value,fxPoints:macro?.fx?.[selected.market==='HK'?'HKD_CNY':'USD_CNY']?.points,inflationMode:$('cpi-mode').value,cpiPoints:macro?.cpiCny?.points,unitMode:$('unit').value,lotSize:+$('lot').value,feeRate:$('fee').value===''?null:+$('fee').value,scheduleDay:Number($('start').value.slice(-2))};
      if(selected.market==='CN'){options.fxMode='fixed';options.fxRate=1;delete options.fxPoints;}
    }
    const req={schemaVersion:1,history,instrumentKind:selected.instrumentKind,...(options?{options,startDate:$('start').value,requestedYears:+$('years').value,mode:$('mode').value}:{mode:'index-context'})};
    const out=await call('analyze',req);if(!out.ok)throw Error(out.error.message);render(out);
  }catch(error){$('results').innerHTML=`<div class="error" role="alert">未能完成计算：${escape(error.message)}</div>`;}
  finally{$('calculate').disabled=false;$('calculate').textContent='计算这段历史 →';}
};
try{const smoke=await call('smoke');if(smoke.sum!==5||smoke.echo.label!=='简投学堂 😀')throw Error('自检不通过');$('engine-status').textContent='MoonBit · Wasm 已就绪';}catch(error){$('engine-status').textContent=`引擎不可用：${error.message}`;}
try{manifest=await getJson('data/etf-pack-manifest.json');populate();$('data-state').textContent=`目录：${manifest.entries.length} 只ETF / ${manifest.indices.length} 个指数，历史按需加载。`;}catch(error){$('data-state').textContent=`目录加载失败：${error.message}。你可以主动使用人工教学示例。`;}
