import { readFile } from 'node:fs/promises';
import { createEngine } from '../demo/bridge.mjs';
export const engine = await createEngine(await readFile(new URL('../_build/wasm-gc/release/build/engine/engine.wasm', import.meta.url)));
export const base = { frequency: 'monthly', payment: 100, initial: 0, inflation: 2.5, contributionGrowth: false, fxRate: 1, fxMode: 'fixed', inflationMode: 'scenario', unitMode: 'fractional', lotSize: 1, feeRate: 0, scheduleDay: 1 };
export function request(points, options = {}, extra = {}) {
  return { schemaVersion: 1, instrumentKind: 'etf', requestedYears: 20,
    history: { points, firstDate: points[0]?.[0], lastDate: points.at(-1)?.[0], source: 'Synthetic educational fixture', licenseStatus: 'verified', seriesType: 'vendor-adjusted-price' },
    options: { ...base, ...options }, ...extra };
}
export function syntheticPoints() {
  return Array.from({length: 1200}, (_, i) => [new Date(Date.UTC(2020,0,1+i)).toISOString().slice(0,10), 100 + i * 0.03 + 15*Math.sin(i/90)]);
}
