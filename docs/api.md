# JSON contract v1

`createEngine(wasmBytes)` exposes `validateHistory(request)`, `analyze(request)` and `compare({first,second})`. All financial computations run in MoonBit. Numeric inputs/outputs are JSON numbers, dates are valid `YYYY-MM-DD` strings in 1900..2200. Non-finite values cannot be encoded. History arrays contain at most 50,000 positive observations in strictly increasing date order.

## Request

- `schemaVersion`: required, exactly 1.
- `instrumentKind`: `etf` or `index`; defaults to history's kind then `etf`; conflicting kinds fail.
- `history`: `points: [date,price][]`, optional firstDate/lastDate which must match observations; source/sourceUrl/retrieved/seriesType/licenseStatus/adjustment/provider are preserved.
- `mode`: ETF `replay` (default) or `rolling`; index `index-context` only.
- `requestedYears`: ETF integer 1..100, default 20.
- `startDate`: ETF valid anchor date, default first observation. Starts after history fail; earlier starts shift with a warning.
- `options`: ETF only. An index rejects investment options.

| Option | Unit/default |
| --- | --- |
| frequency | daily / monthly / yearly; monthly |
| payment / initial | CNY; 100 / 0; nonnegative, at most 1e12 |
| fxRate | CNY per quote-currency unit; positive, default 1 |
| fxMode / fxPoints | fixed / historical; fixed; date-specific rate pairs |
| inflation | percent per year; 2.5; greater than -100, at most 100 |
| inflationMode / cpiPoints | scenario / historical; scenario; CPI level pairs, not year-on-year rates |
| contributionGrowth | false; true grows payments using purchasing-power factor |
| unitMode / lotSize | fractional / whole; fractional; positive integer lot size, default 1 |
| feeRate | percent per year; null/absent means unknown |
| scheduleDay | integer 1..31; rolling anchors default 1. Single-path schedule uses startDate's day |

Terminal observation is valuation-only. Requested end moves to the first available observation on/after its anniversary, or the final available observation if shorter. The API returns actual dates. Historical rate lookup uses the last observation on/before the date; fixed FX fills the gap before history and the last historical FX is carried forward afterward. CPI gaps use the explicit inflation scenario.

## Response

Success: `ok`, `schemaVersion`, `engineVersion`, `mode`, `source`, `warnings`, `metrics`, nullable `replay` and `rolling`. ETF results also return requestedYears and availableYears. Money is CNY except `cashQuote`. CAGR/drawdown/volatility/annual returns use percentage points; `multiple`, `inflationFactor` and `lossShare` are ratios. Missing estimates are explicit null.

Replay returns actual start/end, anchor, indices, ending value, real ending value, principal, installment count, cash, product drawdown, account value-to-principal worst return, legacy high-gap recoveryDays, feeDrag, FX values and sampled path. `metrics` covers the full loaded history; replay covers the requested window. `rolling` contains samples, worst/lower-median/best replay paths, lossShare and limited flag. No complete requested window returns null plus an explicit warning and available-history replay.

Errors: `{ "ok": false, "schemaVersion": 1, "error": { "code": "INVALID_INPUT", "message": "..." } }`. Bridge instantiation/runtime failures throw a JavaScript Error; demo displays the failure.

Comparison clips both requests to their shared calendar interval without including any observation after commonEnd. Markets may have different actual first/last observations inside that interval. Caller must supply comparable assumptions; the API does not silently replace differing fees/FX settings.

Wasm exports `analyze_json`, `validate_history_json`, `compare_json`, plus tiny numeric/JSON diagnostic exports. The tested instantiation settings are `builtins: ['js-string']` and `importedStringConstants: '_'`. Both JSON parsing and financial calculations are inside MoonBit. Workers prevent long rolling analyses from blocking page interaction.
