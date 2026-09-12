import { chromium } from 'playwright';

const base = process.env.WEB_URL ?? 'http://127.0.0.1:4188';
const browser = await chromium.launch(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL, headless: true } : { headless: true });
const errors = [];
const baseOrigin = new URL(base).origin;
let context;
let wasmContext;
try {
  // Prove that the teaching route does not depend on the market-data host.
  // Keep the local static bundle available while every other HTTP request
  // fails before the page is opened.
  const blockedExternal = [];
  context = await browser.newContext({ serviceWorkers: 'block' });
  await context.route('**/*', async (route) => {
    const url = route.request().url();
    if (/^https?:/i.test(url) && new URL(url).origin !== baseOrigin) {
      blockedExternal.push(url);
      // Leave the initial request pending long enough for the user to select
      // the teaching fixture first. This exercises the async state race.
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return route.abort('failed');
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  for (const route of ['/', '/plan/']) {
    const response = await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' });
    if (!response || response.status() !== 200) throw new Error(`${route} returned ${response?.status() ?? 'no response'}`);
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error(`${route} has horizontal overflow`);
  }
  await page.locator('#main-security').waitFor({ timeout: 30000 });
  await page.locator('.teaching-example button').click();
  await page.locator('.outcome-focus strong').waitFor({ timeout: 30000 });
  const teachingValue = await page.locator('.outcome-focus strong').innerText();
  if (!teachingValue.includes('300')) throw new Error(`offline teaching example returned ${teachingValue}`);
  if (blockedExternal.length === 0) throw new Error('offline check did not observe a blocked external request');
  await page.waitForTimeout(1200);
  const teachingValueAfterFailure = await page.locator('.outcome-focus strong').innerText();
  if (!teachingValueAfterFailure.includes('300')) throw new Error(`teaching result was cleared by a late data failure: ${teachingValueAfterFailure}`);
  for (const asset of ['/worker.mjs', '/wasm/engine.wasm']) {
    const response = await page.request.get(`${base}${asset}`);
    if (!response.ok()) throw new Error(`${asset} returned ${response.status()}`);
  }
  await context.close();
  context = undefined;

  // Separately block the Wasm module. The page must surface an engine error
  // instead of leaving the initial loading message on screen forever.
  wasmContext = await browser.newContext({ serviceWorkers: 'block' });
  await wasmContext.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.includes('/wasm/engine.wasm')) return route.abort('failed');
    if (/^https?:/i.test(url) && new URL(url).origin !== baseOrigin) return route.abort('failed');
    return route.continue();
  });
  const wasmPage = await wasmContext.newPage();
  await wasmPage.goto(`${base}/plan/`, { waitUntil: 'domcontentloaded' });
  await wasmPage.locator('main p').first().waitFor({ timeout: 10000 });
  await wasmPage.waitForFunction(() => !document.body.innerText.includes('正在初始化 MoonBit 计算引擎'), { timeout: 10000 });
  const wasmText = await wasmPage.locator('main').innerText();
  if (!/Failed to fetch|引擎|网络|计算/.test(wasmText)) throw new Error(`Wasm failure was not surfaced: ${wasmText}`);
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(JSON.stringify({ routes: ['/', '/plan/'], offlineTeachingExample: teachingValue, teachingAfterLateFailure: teachingValueAfterFailure, blockedExternal: blockedExternal.length, wasmFailureSurfaced: true, assets: ['worker.mjs', 'engine.wasm'], errors }));
} finally {
  await context?.close();
  await wasmContext?.close();
  await browser.close();
}
