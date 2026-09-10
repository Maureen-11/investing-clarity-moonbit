///|
fn fixture_options(extra : Json) -> Options raise { read_options(extra) }

///|
fn flat_points() -> Array[Point] {
  [{ date: "2020-01-31", price: 10.0 }, { date: "2020-03-02", price: 10.0 }, { date: "2020-03-31", price: 10.0 }, { date: "2020-04-30", price: 10.0 }, { date: "2020-05-01", price: 10.0 }]
}

///|
fn assert_close(actual : Double, expected : Double) -> Unit raise {
  assert_true((actual - expected).abs() <= 0.00000001)
}

///|
test "Gregorian leap years and year-end dates" {
  assert_true(leap(2000))
  assert_false(leap(1900))
  assert_true(leap(2024))
  assert_eq(distance("2020-02-28", "2020-03-01"), 2)
  assert_eq(distance("2021-02-28", "2021-03-01"), 1)
  assert_eq(distance("2020-12-31", "2021-01-01"), 1)
}

///|
test "monthly anchor is clamped from the original date, not drifted" {
  assert_eq(month_later("2020-01-31", 1), "2020-02-29")
  assert_eq(month_later("2020-01-31", 2), "2020-03-31")
  assert_eq(month_later("2020-02-29", 12), "2021-02-28")
  assert_eq(month_later("2020-02-29", 48), "2024-02-29")
}

///|
test "invalid dates fail, not silently normalized" {
  for value in ["2020-02-30", "2021-02-29", "2020-13-01", "2020-00-01", "2020-1-01", "abcd-01-01", "2020-01-00"] {
    let rejected = try { let _ = date_parts(value); false } catch { _ => true }
    assert_true(rejected)
  }
}

///|
test "empty duplicate unsorted and zero-price history rejected" {
  let inputs : Array[Json] = [[], [["2020-01-01", 10], ["2020-01-01", 20]], [["2020-01-02", 10], ["2020-01-01", 10]], [["2020-01-01", 0]], [["2020-01-01", -1]]]
  for input in inputs {
    let rejected = try { let _ = read_points(input, false); false } catch { _ => true }
    assert_true(rejected)
  }
}

///|
test "lower bound uses the next available observation without lookahead for rates" {
  let points = flat_points()
  assert_eq(lower_bound(points, "2020-02-29"), 1)
  assert_eq(lower_bound(points, "2020-01-01"), 0)
  assert_eq(lower_bound(points, "2020-06-01"), 5)
  assert_eq(series_value(points, "2020-01-01"), None)
  assert_eq(series_value(points, "2020-02-01"), Some(10.0))
}

///|
test "daily schedules exclude terminal valuation date" {
  let flags = scheduled(flat_points(), 0, 4, fixture_options({ "frequency": "daily" }), "2020-01-31")
  assert_eq(flags, [true, true, true, true, false])
}

///|
test "monthly schedules shift closures and preserve anchors" {
  let flags = scheduled(flat_points(), 0, 4, fixture_options({ "frequency": "monthly" }), "2020-01-31")
  assert_eq(flags, [true, true, true, true, false])
}

///|
test "annual leap-day schedule shifts to the first available observation" {
  let points : Array[Point] = [{ date: "2020-03-02", price: 10.0 }, { date: "2021-03-01", price: 10.0 }, { date: "2022-03-01", price: 10.0 }, { date: "2023-03-01", price: 10.0 }]
  let r = replay(points, 0, 3, fixture_options({ "frequency": "yearly", "payment": 100 }), true, "2020-02-29")
  assert_eq(r.contributions, 3)
  assert_close(r.principal, 300.0)
  assert_close(r.endValue, 300.0)
}

///|
test "flat market hand calculation: four monthly installments" {
  let r = replay(flat_points(), 0, 4, fixture_options({ "payment": 100, "initial": 50 }), true, "2020-01-31")
  assert_eq(r.contributions, 4)
  assert_close(r.principal, 450.0)
  assert_close(r.endValue, 450.0)
  assert_close(r.multiple, 1.0)
}

///|
test "fractional buying and whole lots have distinct carried cash" {
  let fractional = fixture_options({ "unitMode": "fractional" })
  let whole = fixture_options({ "unitMode": "whole", "lotSize": 2 })
  let (shares, cash) = buy(15.0, 0.0, 10.0, 1.0, fractional)
  assert_close(shares, 1.5)
  assert_close(cash, 0.0)
  let (first, remaining) = buy(15.0, 0.0, 10.0, 1.0, whole)
  assert_close(first, 0.0)
  assert_close(remaining, 15.0)
  let (second, remainder) = buy(15.0, remaining, 10.0, 1.0, whole)
  assert_close(second, 2.0)
  assert_close(remainder, 10.0)
}

///|
test "whole-lot replay values leftover quote cash" {
  let points : Array[Point] = [{ date: "2020-01-01", price: 10.0 }, { date: "2020-01-02", price: 10.0 }, { date: "2020-01-03", price: 10.0 }, { date: "2020-01-04", price: 20.0 }]
  let r = replay(points, 0, 3, fixture_options({ "frequency": "daily", "payment": 15, "unitMode": "whole", "lotSize": 2 }), true, points[0].date)
  assert_close(r.principal, 45.0)
  assert_close(r.cashQuote, 5.0)
  assert_close(r.endValue, 85.0)
}

///|
test "historical FX purchase and ending conversions differ" {
  let points : Array[Point] = [{ date: "2020-01-02", price: 10.0 }, { date: "2021-01-04", price: 10.0 }]
  let o = fixture_options({ "payment": 0, "initial": 100, "fxRate": 7, "fxMode": "historical", "fxPoints": [["2020-01-02", 7], ["2021-01-04", 6]] })
  let r = replay(points, 0, 1, o, true, points[0].date)
  assert_close(r.endValue, 600.0 / 7.0)
  assert_close(r.startFx, 7.0)
  assert_close(r.endFx, 6.0)
}

///|
test "historical rate gaps use previous observations, never future rates" {
  let o = fixture_options({ "fxMode": "historical", "fxRate": 8, "fxPoints": [["2020-02-01", 7], ["2020-03-01", 6]] })
  assert_close(fx_at(o, "2020-01-01"), 8.0)
  assert_close(fx_at(o, "2020-02-15"), 7.0)
  assert_close(fx_at(o, "2020-04-01"), 6.0)
}

///|
test "CPI changes purchasing power, not nominal account value" {
  let points : Array[Point] = [{ date: "2020-01-01", price: 10.0 }, { date: "2021-01-01", price: 10.0 }]
  let o = fixture_options({ "payment": 0, "initial": 110, "inflationMode": "historical", "cpiPoints": [["2020-01-01", 100], ["2021-01-01", 110]] })
  let r = replay(points, 0, 1, o, true, points[0].date)
  assert_close(r.endValue, 110.0)
  assert_close(r.realEndValue, 100.0)
  assert_close(r.inflationFactor, 1.1)
}

///|
test "CPI coverage gaps compose scenario factors around actual CPI" {
  let o = fixture_options({ "inflation": 10, "inflationMode": "historical", "cpiPoints": [["2020-01-01", 100], ["2021-01-01", 110]] })
  let factor = power_factor(o, "2019-01-01", "2022-01-01")
  let expected = scenario(o, "2019-01-01", "2020-01-01") * 1.1 * scenario(o, "2021-01-01", "2022-01-01")
  assert_close(factor, expected)
}

///|
test "growing contributions increase actual deposited principal" {
  let points : Array[Point] = [{ date: "2020-01-01", price: 10.0 }, { date: "2021-01-01", price: 10.0 }, { date: "2022-01-01", price: 10.0 }]
  let o = fixture_options({ "frequency": "yearly", "payment": 100, "contributionGrowth": true, "inflationMode": "historical", "cpiPoints": [["2020-01-01", 100], ["2021-01-01", 110], ["2022-01-01", 120]] })
  let r = replay(points, 0, 2, o, true, points[0].date)
  assert_close(r.principal, 210.0)
  assert_close(r.endValue, 210.0)
  assert_close(r.path[r.path.length()-1].realPrincipal, 200.0)
}

///|
test "fees remain a counterfactual and do not double deduct" {
  let points : Array[Point] = [{ date: "2020-01-01", price: 10.0 }, { date: "2021-01-01", price: 12.0 }]
  let zero = replay(points, 0, 1, fixture_options({ "payment": 0, "initial": 100, "feeRate": 0 }), false, points[0].date)
  let fee = replay(points, 0, 1, fixture_options({ "payment": 0, "initial": 100, "feeRate": 1 }), false, points[0].date)
  assert_close(zero.endValue, 120.0)
  assert_close(fee.endValue, zero.endValue)
  assert_true(fee.feeDrag.unwrap_or(0.0) > 0.0)
  assert_close(zero.feeDrag.unwrap_or(-1.0), 0.0)
}

///|
test "unknown fee remains nullable" {
  let r = replay(flat_points(), 0, 4, fixture_options({ "feeRate": null }), false, "2020-01-31")
  assert_eq(r.feeDrag, None)
  assert_false(r.feeRateKnown)
  assert_eq(field(replay_json(r), "feeDrag"), Json::null())
}

///|
test "one observation retains initial money and zero installments" {
  let points : Array[Point] = [{ date: "2020-01-01", price: 10.0 }]
  let r = replay(points, 0, 0, fixture_options({ "initial": 100 }), true, points[0].date)
  assert_eq(r.contributions, 0)
  assert_close(r.endValue, 100.0)
  assert_eq(metrics(points).cagr, None)
}

///|
test "short drawdown remains visible while annualized metrics are null" {
  let m = metrics([{ date: "2020-01-01", price: 100.0 }, { date: "2020-01-02", price: 80.0 }])
  assert_close(m.maxDrawdown, -20.0)
  assert_eq(m.cagr, None)
  assert_eq(m.volatility, None)
  assert_false(m.recovered)
  assert_eq(m.recoveryDate, None)
}

///|
test "trough-to-recovery and peak-to-recovery have named definitions" {
  let m = metrics([{ date: "2020-01-01", price: 100.0 }, { date: "2020-01-02", price: 80.0 }, { date: "2020-01-03", price: 100.0 }])
  assert_true(m.recovered)
  assert_eq(m.recoveryDays, 1)
  assert_eq(m.peakToRecoveryDays, 2)
  assert_eq(m.recoveryDate, Some("2020-01-03"))
}

///|
test "natural-year returns compare consecutive year ends" {
  let m = metrics([{ date: "2020-01-01", price: 90.0 }, { date: "2020-12-31", price: 100.0 }, { date: "2021-12-31", price: 110.0 }, { date: "2022-06-30", price: 88.0 }])
  assert_eq(m.annualReturns.length(), 2)
  assert_eq(m.annualReturns[0].year, "2021")
  assert_close(m.annualReturns[0].value, 10.0)
  assert_close(m.annualReturns[1].value, -20.0)
  assert_false(m.annualReturns[0].partial)
  assert_true(m.annualReturns[1].partial)
}

///|
test "calendar-year criterion rather than arbitrary 252-observation threshold" {
  let m = metrics([{ date: "2020-01-01", price: 100.0 }, { date: "2021-01-01", price: 110.0 }])
  assert_true(m.cagr is Some(_))
  assert_eq(m.volatility, None)
}

///|
test "no complete rolling window returns None" {
  assert_true(rolling(flat_points(), 20, fixture_options({})) is None)
}

///|
test "index accepts factual analysis but rejects investment options" {
  let base : Json = { "schemaVersion": 1, "instrumentKind": "index", "history": { "points": [["2020-01-01", 100], ["2020-01-02", 90]] } }
  let out = analyze(base)
  assert_eq(field(out, "mode"), Json::string("index-context"))
  assert_eq(field(out, "replay"), Json::null())
  match base { Object(m) => m["options"] = {}; _ => () }
  let rejected = try { let _ = analyze(base); false } catch { _ => true }
  assert_true(rejected)
}

///|
test "history beyond chosen start is required" {
  let j : Json = { "schemaVersion": 1, "startDate": "2022-01-01", "history": { "points": [["2020-01-01", 100]] } }
  let rejected = try { let _ = analyze(j); false } catch { _ => true }
  assert_true(rejected)
}
