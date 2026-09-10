import { createRequire } from 'node:module';
import { mkdir,writeFile,readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const browser=await chromium.launch(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL,headless:true}:{headless:true});
const results=[];
try{
  await mkdir('artifacts',{recursive:true});
  const page=await browser.newPage();
  // Optional local source interception verifies integration without relying on live hosting.
  if(process.env.UPSTREAM_ROOT) await page.route('https://maureen-11.github.io/investing-clarity-lab/**',async route=>{
    const rel=new URL(route.request().url()).pathname.replace('/investing-clarity-lab/','');
    if(!/^data\/[a-zA-Z0-9_./:-]+\.json$/.test(rel)||rel.includes('..'))return route.abort();
    try{await route.fulfill({contentType:'application/json',body:await readFile(resolve(process.env.UPSTREAM_ROOT,'public',rel))})}catch{await route.abort()}
  });
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const width of [1440,1280,1024,768,390]){
    await page.setViewportSize({width,height:960});await page.goto('http://127.0.0.1:4188/');
    await page.getByText('MoonBit · Wasm 已就绪',{exact:true}).waitFor({timeout:20000});
    await page.locator('#offline').click();await page.locator('#calculate').click();
    await page.locator('#results .amount').waitFor();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    if(overflow)throw Error(`Horizontal overflow at ${width}`);
    const actual=await page.locator('#results .amount').textContent();
    if(width===1440||width===390)await page.screenshot({path:`artifacts/demo-${width}.png`,fullPage:true});
    results.push({width,overflow,amount:actual});
  }
  if(process.env.UPSTREAM_ROOT || process.env.LIVE_SOURCE){
    await page.waitForFunction(()=>document.querySelector('#data-state').textContent.includes('目录：')||document.querySelector('#security').options.length>100,{},{timeout:30000});
    await page.setViewportSize({width:1440,height:960});
    for(const symbol of ['159919','VOO','02800']){
      await page.locator('#search').fill(symbol);
      const options=await page.locator('#security option').evaluateAll(nodes=>nodes.map(n=>({value:n.value,text:n.textContent})));
      const entry=options.find(o=>o.value&&!o.text.includes('[指数]'));if(!entry)throw Error(`Missing ${symbol}`);
      await page.locator('#security').selectOption(entry.value);
      await page.locator('#calculate:not([disabled])').waitFor();await page.locator('#calculate').click();await page.locator('#calculate:not([disabled])').waitFor();
      if(await page.locator('#results .error').count())throw Error(await page.locator('#results .error').textContent());
      results.push({symbol,amount:await page.locator('#results .amount').textContent()});
    }
    await page.screenshot({path:'artifacts/demo-real-etf.png',fullPage:true});
    await page.locator('#search').fill('恒生指数');
    const option=await page.locator('#security option').evaluateAll(nodes=>nodes.find(n=>n.value&&n.textContent.includes('[指数]'))?.value);
    if(!option)throw Error('Index entry missing');await page.locator('#security').selectOption(option);await page.locator('#calculate:not([disabled])').waitFor();
    if(await page.locator('#investment-inputs').isVisible())throw Error('Index investment form should be hidden');
    await page.locator('#calculate').click();await page.locator('#calculate:not([disabled])').waitFor();
    if(!(await page.locator('#results').textContent()).includes('不能直接购买'))throw Error('Index context not shown');
    results.push({index:true,investmentFormHidden:true});
  }
  if(errors.length)throw Error(errors.join('\n'));
  await writeFile('artifacts/browser-verification.json',JSON.stringify({localDataIntercepted:!!process.env.UPSTREAM_ROOT,results,errors},null,2));console.log(JSON.stringify({results,errors}));
}finally{await browser.close()}
