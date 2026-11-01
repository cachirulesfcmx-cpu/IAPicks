// Browser test for the local Bankroll tool. Usage: BASE_URL=https://<url> [VERCEL_SHARE_TOKEN=…] node apps/web/e2e/bankroll.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const BASE = (process.env.BASE_URL ?? 'http://127.0.0.1:3123').replace(/\/$/, '');
const KEY = 'iapicks.bankroll.v1';
const results = [];
const check = async (name, fn) => {
  try { await fn(); results.push({ name, ok: true }); } catch (e) { results.push({ name, ok: false, error: e.message.split('\n')[0] }); }
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
if (process.env.VERCEL_SHARE_TOKEN) {
  const p = await ctx.newPage();
  await p.goto(`${BASE}/?_vercel_share=${process.env.VERCEL_SHARE_TOKEN}`, { waitUntil: 'networkidle' });
  await p.close();
}
const page = await ctx.newPage();
const errors = [];
const posts = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('request', (r) => { if (r.method() !== 'GET' && r.method() !== 'HEAD') posts.push(`${r.method()} ${r.url()}`); });

await check('corrupted localStorage does not crash the page', async () => {
  await page.goto(`${BASE}/bankroll`, { waitUntil: 'networkidle' });
  await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ bankroll: 'x', entries: [{ id: 1, label: 'bad', units: '1', odds: null }, { id: 'ok', label: 'Válida', units: 1, odds: 2, result: 'ganada', at: '2026-11-01T00:00:00Z' }] })), KEY);
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByText('Válida').waitFor();
  assert.equal(await page.getByText('bad', { exact: true }).count(), 0);
  assert.equal(await page.locator('.bank-amount input').inputValue(), '5000');
});

await check('decimal odds can be typed naturally (1.5)', async () => {
  const odds = page.getByLabel('Cuota decimal');
  await odds.fill('');
  await odds.pressSequentially('1.5');
  assert.equal(await odds.inputValue(), '1.5');
});

await check('Kelly stake: p=60 %, cuota 2.0, conservador → 5 % × ¼ = $250 on $5,000', async () => {
  await page.getByLabel('Tu probabilidad (%)').fill('60');
  await page.getByLabel('Cuota decimal').fill('2');
  const out = await page.locator('.calc-out').innerText();
  assert.match(out, /20\.0\s*%/);
  assert.match(out, /\$250/);
});

await check('no edge → "No apostar"', async () => {
  await page.getByLabel('Tu probabilidad (%)').fill('40');
  assert.match(await page.locator('.calc-out').innerText(), /No apostar/);
});

await check('invalid input shows an inline error instead of coercing', async () => {
  await page.getByLabel('Tu probabilidad (%)').fill('150');
  await page.getByText('Entre 1 y 99').waitFor();
});

await check('adding and settling a position persists locally and updates ROI', async () => {
  await page.getByLabel('Descripción').fill('Prueba local');
  await page.getByLabel('Unidades').fill('2');
  await page.getByLabel('Cuota', { exact: true }).fill('1.5');
  await page.getByRole('button', { name: 'Añadir' }).click();
  await page.getByLabel('Resultado de Prueba local').selectOption('ganada');
  const stored = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
  assert.equal(stored.entries[0].label, 'Prueba local');
  assert.equal(stored.entries[0].result, 'ganada');
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByText('Prueba local').waitFor();
  // ganada 2u @1.5 = +1u; ganada 1u @2 = +1u → +2u on 3u staked = 66.7 %
  assert.match(await page.locator('section[aria-labelledby="h-perf"]').innerText(), /66\.7\s*%/);
});

await check('no data leaves the browser (no POST/PUT requests)', async () => {
  assert.deepEqual(posts, []);
});
await check('no console or page errors', async () => { assert.deepEqual(errors, []); });

await browser.close();
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}${r.ok ? '' : ` — ${r.error}`}`);
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} bankroll checks passed against ${BASE}`);
process.exit(failed ? 1 : 0);
