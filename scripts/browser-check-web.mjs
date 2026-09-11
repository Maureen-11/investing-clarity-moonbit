import { chromium } from 'playwright';

const base = process.env.WEB_URL ?? 'http://127.0.0.1:4188';
const browser = await chromium.launch(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL, headless: true } : { headless: true });
const errors = [];
try {
  const page = await browser.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  for (const route of ['/', '/plan/']) {
    const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
    if (!response || response.status() !== 200) throw new Error(`${route} returned ${response?.status() ?? 'no response'}`);
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error(`${route} has horizontal overflow`);
  }
  await page.locator('#main-security').waitFor({ timeout: 30000 });
  await page.locator('.teaching-example button').click();
  await page.locator('.outcome-focus strong').waitFor({ timeout: 30000 });
  const teachingValue = await page.locator('.outcome-focus strong').innerText();
  if (!teachingValue.includes('300')) throw new Error(`offline teaching example returned ${teachingValue}`);
  for (const asset of ['/worker.mjs', '/wasm/engine.wasm']) {
    const response = await page.request.get(`${base}${asset}`);
    if (!response.ok()) throw new Error(`${asset} returned ${response.status()}`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(JSON.stringify({ routes: ['/', '/plan/'], offlineTeachingExample: teachingValue, assets: ['worker.mjs', 'engine.wasm'], errors }));
} finally {
  await browser.close();
}
