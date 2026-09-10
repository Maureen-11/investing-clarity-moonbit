# Execution tasks

Each task reads AGENTS.md and progress.md first. Review the actual upstream engine and tests before porting a behavior. Do not copy assumptions from an outdated plan without checking them.

| Task | Prerequisite / read | Allowed work | Acceptance / stop condition |
| --- | --- | --- | --- |
| A1 | Official installation instructions | Local toolchain outside repository | Record moon/moonc versions; check executable runs |
| A2 | Official Wasm FFI documentation | Minimal package, bridge and smoke test | Browser adds two numbers and round-trips Chinese JSON; errors visible |
| B1 | A1; remote repository status | Git initialization, README, license, CI | Public standalone repo with truthful scope; authentication requires owner login |
| C1 | Original engine.ts and engine tests | Contract and synthetic fixture definitions | Units, dates, nullable rates, errors documented |
| C2 | C1 | Golden generator and comparison tests | Hand-check flat price, FX and CPI; retain upstream hash |
| D1 | C1 | MoonBit models and validation | Reject empty/invalid/duplicate/unsorted history and invalid options |
| D2 | D1 | Gregorian dates and schedules | Month end, leap year, next available history date, daily/monthly/yearly |
| D3 | D2 | Purchase and cash handling | Initial amount, fractional/whole lots and carried cash |
| D4 | D3 | Replay and path | Exact principal/counts; ending value within tolerance |
| D5 | D4 | Requested/available window handling | Short history remains usable; no invented observations |
| D6 | D5 | Annual/cumulative metrics | No annualization under one calendar year; partial-year status |
| D7 | D6 | Drawdown and recovery | Recovered and unresolved examples, definitions explicit |
| D8 | D7 | Rolling analysis | Monthly starting anchors; same ranking and lower median as upstream |
| D9 | D4 | FX lookup | Date-specific conversion; disclose fixed fallback |
| D10 | D9 | CPI/scenario purchasing power | Nominal value unchanged unless contribution growth is enabled |
| D11 | D10 | Fee counterfactual | Historical value unchanged; missing fee stays unknown |
| D12 | D8-D11 | JSON API | Structured success/error envelopes; index context only |
| E1 | D12 | Remote data loader and offline fixture | Per-symbol fetch; provenance retained; no silent fallback |
| E2 | E1 | Responsive demo | Inputs, result hierarchy, chart, risks, engine version visible |
| F1 | E2 | Batch/golden/browser tests | 300 ETF and 15 index checks, meaningful failure report |
| F2 | F1 | Docs, exact staging and candidate | Owner sees local result before release/integration |

## Numerical acceptance

Dates, counts and statuses must match exactly. Money tolerance: max(0.01 currency units, abs(expected)*1e-9). Rate tolerance: 1e-8 in the original percentage-point units. Compare raw values, not formatted strings. Each discrepancy needs a recorded explanation. Upstream code is a regression reference, not proof of correctness.

## Delivery boundaries

Independent Git repository, no submodule. Upstream supplies selected history JSON. Keep only synthetic fixtures here. Engine output schema version 1. Frontend APIs: validateHistory(request), analyze(request). Internal Wasm string ABI must be verified before freezing it. No current-site changes before separate integration approval. Later work: guided planning, backend and PDF.
