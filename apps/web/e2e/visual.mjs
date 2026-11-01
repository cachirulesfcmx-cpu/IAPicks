// Visual review: full-page screenshots of every main screen at 4 viewports, plus console/HTTP/overflow checks.
// Usage: BASE_URL=https://<url> OUT=/tmp/shots node apps/web/e2e/visual.mjs
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const BASE = (process.env.BASE_URL ?? 'http://127.0.0.1:3123').replace(/\/$/, '');
const OUT = process.env.OUT ?? '/tmp/iapicks-visual';
const PAGES = (process.env.PAGES ?? '/,/games,/games/demo-nfl-7,/picks,/picks/demo-pick-1,/performance,/bankroll,/follows,/responsible').split(',');
const VIEWPORTS = [
  ['iphone-390', { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
  ['phone-430', { width: 430, height: 932, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
  ['tablet-768', { width: 768, height: 1024, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }],
  ['desktop-1366', { width: 1366, height: 900, deviceScaleFactor: 1 }],
];
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const report = [];
for (const [label, opts] of VIEWPORTS) {
  const { width, height, ...rest } = opts;
  const ctx = await browser.newContext({ viewport: { width, height }, ...rest });
  for (const path of PAGES) {
    const page = await ctx.newPage();
    const issues = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') issues.push(`${m.type()}: ${m.text().slice(0, 180)}`); });
    page.on('pageerror', (e) => issues.push(`pageerror: ${e.message.slice(0, 180)}`));
    page.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(BASE)) issues.push(`HTTP ${r.status()} ${r.url().replace(BASE, '')}`); });
    let status = 0;
    try {
      const res = await page.goto(BASE + path, { waitUntil: 'networkidle' });
      status = res?.status() ?? 0;
      await page.waitForTimeout(400);
      const m = await page.evaluate((vw) => {
        // Mobile emulation widens the layout viewport to fit overflowing content, so compare against the device width.
        const overflow = Math.max(document.documentElement.scrollWidth, window.innerWidth) - vw;
        const imgs = [...document.images];
        const broken = imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src);
        const nav = document.querySelector('[data-tabbar]');
        const navH = nav ? nav.getBoundingClientRect().height : 0;
        const main = document.querySelector('main');
        const padBottom = main ? parseFloat(getComputedStyle(main).paddingBottom) : 0;
        return { overflow, broken, navH, padBottom, h1: document.querySelector('h1')?.textContent?.trim().slice(0, 60) ?? '' };
      }, width);
      if (m.overflow > 1) issues.push(`horizontal overflow ${m.overflow}px`);
      if (m.broken.length) issues.push(`broken images: ${m.broken.join(', ')}`);
      if (m.navH && m.padBottom < m.navH) issues.push(`content may hide under tab bar (pad ${m.padBottom} < nav ${m.navH})`);
      const file = `${OUT}/${label}${path.replace(/[/?=&]+/g, '_') || '_home'}.png`;
      await page.screenshot({ path: file, fullPage: true });
      report.push({ viewport: label, path, status, h1: m.h1, issues });
    } catch (e) {
      report.push({ viewport: label, path, status, issues: [`error: ${e.message.split('\n')[0]}`] });
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
let bad = 0;
for (const r of report) {
  const ok = r.status === 200 && r.issues.length === 0;
  if (!ok) bad++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${r.viewport.padEnd(13)} ${r.path.padEnd(22)} ${r.status} ${r.h1 ?? ''}${r.issues.length ? ' — ' + r.issues.join(' | ') : ''}`);
}
console.log(`\n${report.length - bad}/${report.length} visual checks clean against ${BASE}`);
process.exit(bad ? 1 : 0);
