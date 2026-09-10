# Investing Clarity MoonBit / 简投学堂

[简体中文](README.md) · [Prior prototype and data](https://github.com/Maureen-11/investing-clarity-lab) · [API](docs/api.md) · [Verification](docs/verification.md)

A MoonBit engine for understanding contributions, historical volatility, currency effects, fees and purchasing power. It is an educational research tool, not a security recommendation or a promise of future returns.

This repository is independent of the original TypeScript website. The earlier project supplies product validation, historical data and regression references. Financial calculations here run in MoonBit compiled to WebAssembly. Algorithm attribution and deliberate differences are documented in [methodology](docs/methodology.md).

## Implemented capabilities

- Daily, monthly and yearly schedules with month-end, leap-year and next-observation handling.
- Initial investments, fractional shares, whole lots and carried quote-currency cash.
- Historical replay, rolling paths, annual performance, drawdowns and recovery periods.
- Historical FX and CPI, fixed scenarios and a separate fee counterfactual without double deduction.
- Explicit available-history windows; factual statistics remain visible below one year while annualization is disabled.
- Index-only market statistics, plus a common-calendar-interval comparison API.
- On-demand data loading from the original project and an explicitly selected synthetic offline example.

Local validation covers the original dataset's 300 ETFs and 15 indices. Full histories remain in the original repository. The current version is a public `0.1.0-candidate`; [GitHub Actions CI](https://github.com/Maureen-11/investing-clarity-moonbit/actions) and the [Pages demo](https://maureen-11.github.io/investing-clarity-moonbit/) are deployed. See [progress](docs/progress.md) for release and integration status.

## Requirements and setup

Node.js 24+ and the MoonBit toolchain are required. Tested with compiler `v0.10.12+1634b282e` and moon `0.1.20260904`. Follow the [official installation instructions](https://www.moonbitlang.com/download). `MOON_HOME` can point to an isolated installation.

```sh
git clone https://github.com/Maureen-11/investing-clarity-moonbit.git
cd investing-clarity-moonbit
node scripts/moon.mjs check
node scripts/moon.mjs test
node scripts/build.mjs
node --test tests/*.test.mjs
node scripts/serve.mjs
```

You can open the [Pages demo](https://maureen-11.github.io/investing-clarity-moonbit/), or run the Node commands locally and open `http://127.0.0.1:4188/`. Core builds and tests require no npm dependencies. The browser must support Wasm GC, JS String Builtins and module workers. Local Chrome has been tested; other browsers have not been individually verified.

Select a security or the artificial teaching example, then choose dates, frequency, amount and duration. Advanced settings control FX, CPI, fee scenarios and trading units. Ending value includes principal; real value is expressed in starting-date CNY purchasing power.

## Input and output example

This artificial history is not a real ETF:

```json
{
  "schemaVersion": 1,
  "instrumentKind": "etf",
  "requestedYears": 20,
  "history": {"points": [["2020-01-01",10],["2020-01-02",10],["2020-01-03",15]]},
  "options": {"frequency":"daily","payment":100,"initial":0,"inflation":0,"fxRate":1,"feeRate":0}
}
```

The actual engine test confirms 2 contributions, CNY 200 principal, CNY 300 ending value and CNY 300 real ending value. The terminal observation is valuation-only. Only two calendar days are available, so no 20-year annualized conclusion is produced.

## Data, rights and limitations

- Histories are saved snapshots from the original project, not live quotes. Retrieval and final observation dates are displayed separately.
- Vendor-adjusted prices are not represented as official issuer total-return series. Price-only history, total returns and indices remain distinct.
- Public display and redistribution permission for the original market data remains unconfirmed. MIT covers the software only and does not grant rights to third-party data. Disclosure does not replace permission.
- Commissions, taxes, spreads and actual execution constraints are not fully modeled. Fee drag is counterfactual.
- Charts sample the path; calculations use the complete loaded series. Overlapping rolling windows are not independent samples or future probabilities.
- The demo does not save personal plans. External data hosting receives ordinary network requests. See [security](SECURITY.md).

## Development and competition

Read [AGENTS.md](AGENTS.md), the [task packages](docs/implementation-plan.md) and [progress](docs/progress.md). AI assists implementation, tests and documentation; the project owner remains responsible for understanding and explaining the algorithms and design. The existing website and its 300 ETFs are prior work, not new competition deliverables.

Guided educational planning, backend services and PDF reporting are future extensions. See [LICENSE](LICENSE) for MIT terms and original algorithm attribution.
