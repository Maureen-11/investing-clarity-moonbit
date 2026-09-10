# Methodology and deliberate differences

Reference: investing-clarity-lab `app/plan/engine.ts`, commit `0d07e0dd212bcd942de366e9650d05042bf0099e`. Original MIT copyright is retained. This is a new MoonBit implementation with algorithms adapted from the existing project; it does not claim independent invention of those algorithms.

- Purchases, cash, CPI, historical FX, feeDrag and rolling ranking are compared against the original engine using fixed synthetic fixtures and local real-history checks.
- The final observation values the account without another installment. Duplicate shifted monthly dates collapse to one contribution, matching the original behavior. Missing market sessions cannot be inferred from the series: only observed dates are available.
- Metrics below 252 observations were hidden by the old engine. Here cumulative return and drawdown remain available; annualized metrics require at least one calendar year. Volatility additionally needs three observations and uses the legacy 252-session annualization convention across markets.
- Annual returns compare consecutive observed year ends. The first partial year is omitted; the last observed year is conservatively marked partial because a complete exchange-year calendar is not supplied.
- `replay.recoveryDays` retains the legacy maximum time between product highs including the open last period. For risk interpretation, `metrics.recoveryDays` is trough-to-recovery/end, `peakToRecoveryDays` is peak-to-recovery/end, and `recovered` distinguishes an unresolved drawdown.
- The old estimatedDirectFee treats every observation as one day's fee. It is not exported here. `feeDrag` retains the separate exponential counterfactual, and actual historical balance is never reduced again. Unknown fee is null.
- Comparisons exclude points after the common end; the original slicing could include one extra point.
- Full historical data is supplied by the original repository. No issuer official total-return claim, future probability claim, or third-party redistribution permission is inferred from a vendor-adjusted series.

The application form's project classification is not a legal or organizer determination. Repository documentation discloses prior code and algorithm reuse; any organizer question about classification should be resolved truthfully with the organizer.
