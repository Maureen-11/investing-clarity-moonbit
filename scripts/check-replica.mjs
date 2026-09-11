import {chromium} from 'playwright';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const target=process.env.REPLICA_URL||'http://127.0.0.1:4189';
const reference=process.env.REFERENCE_URL||'http://127.0.0.1:4190/investing-clarity-lab';
const upstream=resolve('../maintenance-investing-clarity-lab/public');
const browser=await chromium.launch({channel:'chrome',headless:true});
const report={viewports:[],errors:[],referenceErrors:[],cases:[],interactions:[]};
await mkdir('artifacts/replica',{recursive:true});
try{
  const page=await browser.newPage();let activeName='replica';page.on('pageerror',e=>(activeName==='reference'?report.referenceErrors:report.errors).push(e.message));
  await page.route('https://maureen-11.github.io/investing-clarity-lab/**',async route=>{
    const path=new URL(route.request().url()).pathname.split('/investing-clarity-lab/')[1];
    if(path.includes('..'))return route.abort();
    try{await route.fulfill({contentType:'application/json',body:await readFile(resolve(upstream,path))})}catch{return route.abort()}
  });
  for(const width of [1440,1280,1024,768,390]){
    await page.setViewportSize({width,height:1000});
    for(const [name,base] of [['reference',reference],['replica',target]]){
      activeName=name;
      for(const route of ['/','/plan/']){
        await page.goto(base+route,{waitUntil:'networkidle'});
        if(route==='/plan/')await page.locator('#main-security').waitFor({timeout:30000});
        const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
        const file=`artifacts/replica/${name}-${route==='/plan/'?'plan':'home'}-${width}.png`;
        await page.screenshot({path:file,fullPage:true});
        report.viewports.push({name,route,width,overflow,file});
      }
    }
  }
  await page.setViewportSize({width:1440,height:1000});
  activeName='replica';
  await page.goto(target+'/plan/',{waitUntil:'networkidle'});
  await page.locator('.teaching-example button').click();
  await page.locator('.outcome-focus strong').waitFor({timeout:60000});
  const teachingValue=await page.locator('.outcome-focus strong').innerText();
  if(!teachingValue.includes('300'))throw Error(`Unexpected teaching example result: ${teachingValue}`);
  report.interactions.push({offlineTeachingExample:true,result:teachingValue});
  for(const symbol of ['159919','510300','510880','512890','VOO','QQQ','SCHX','BND','02800','03033']){
    const market = ['VOO','QQQ','SCHX','BND'].includes(symbol) ? 'US' : ['02800','03033'].includes(symbol) ? 'HK' : 'CN';
    await page.locator('#calculator select').first().selectOption(market);
    // Market changes can rerender the controlled search field; reacquire it.
    const search=page.locator('#calculator .search-box input');
    await search.waitFor({state:'visible',timeout:60000});
    await search.fill(symbol);
    await page.locator('#calculator .search-menu button').filter({hasText:symbol}).first().click();
    await page.locator('.outcome-focus strong').waitFor({timeout:60000});
    report.cases.push({symbol,value:await page.locator('.outcome-focus strong').innerText(),charts:await page.locator('svg').count()});
  }
  // Verify keyboard selection and the shared-history comparison workbench.
  const compareA=page.locator('#security-a');
  await compareA.fill('QQQ');
  await page.locator('.search-menu button').first().press('Enter');
  await page.waitForTimeout(2000);
  const compareB=page.locator('#security-b');
  await compareB.fill('VOO');
  await page.locator('.search-menu button').first().press('Enter');
  await page.locator('.compare-result .compare-table').waitFor({state:'visible',timeout:60000});
  report.interactions.push({keyboardSelection:true,commonHistoryComparison:true});
  await page.screenshot({path:'artifacts/replica/replica-results-1440.png',fullPage:true});
}catch(error){report.errors.push(error.stack);process.exitCode=1}
finally{await browser.close();await writeFile('artifacts/replica/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.errors.length||report.viewports.some(v=>v.name==='replica'&&v.overflow))process.exitCode=1}
