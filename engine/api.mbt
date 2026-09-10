///|
pub fn add(a : Double, b : Double) -> Double { a + b }

///|
pub fn echo_json(input : String) -> String {
  try { @json.parse(input).stringify() } catch {
    _ => "{\"ok\":false,\"error\":\"invalid JSON\"}"
  }
}

///|
pub fn analyze_json(input : String) -> String {
  try { let result = analyze(@json.parse(input)); finite_json(result); result.stringify() } catch {
    Invalid(message) => error_json(message).stringify()
    _ => error_json("Invalid JSON or incompatible input structure").stringify()
  }
}

///|
pub fn validate_history_json(input : String) -> String {
  try {
    let j = @json.parse(input)
    let points = checked_history(j)
    let result : Json = { "ok": true, "schemaVersion": 1, "observations": points.length(), "firstDate": points[0].date, "lastDate": points[points.length()-1].date }
    result.stringify()
  } catch {
    Invalid(message) => error_json(message).stringify()
    _ => error_json("Invalid JSON or incompatible history structure").stringify()
  }
}

///|
fn error_json(message : String) -> Json {
  { "ok": false, "schemaVersion": 1, "error": { "code": "INVALID_INPUT", "message": message } }
}

///|
fn finite_json(j : Json) -> Unit raise {
  match j {
    Number(n, ..) if n.is_nan() || n.is_inf() => raise Invalid("Calculation exceeds supported numeric range")
    Array(items) => for item in items { finite_json(item) }
    Object(m) => for _, value in m { finite_json(value) }
    _ => ()
  }
}

///|
fn checked_history(j : Json) -> Array[Point] raise {
  if number(j, "schemaVersion", 0.0) != 1.0 { raise Invalid("schemaVersion must be 1") }
  let history = field(j, "history")
  let points = read_points(field(history, "points"), false)
  if text(history, "firstDate", points[0].date) != points[0].date || text(history, "lastDate", points[points.length()-1].date) != points[points.length()-1].date { raise Invalid("History endpoints disagree with observations") }
  points
}

///|
fn analyze(j : Json) -> Json raise {
  let points = checked_history(j)
  let history = field(j, "history")
  let instrument = text(j, "instrumentKind", text(history, "instrumentKind", "etf"))
  if instrument != "etf" && instrument != "index" { raise Invalid("Only ETF and index histories are accepted") }
  let embedded_kind = text(history, "instrumentKind", instrument)
  if embedded_kind != instrument { raise Invalid("Conflicting instrument kinds") }
  let mode = text(j, "mode", if instrument == "index" { "index-context" } else { "replay" })
  if (instrument == "index" && mode != "index-context") || (instrument == "etf" && mode != "replay" && mode != "rolling") { raise Invalid("Index histories only support index-context; ETFs support replay or rolling") }
  let warnings : Array[String] = []
  if text(history, "licenseStatus", "not-confirmed") != "verified" { warnings.push("PUBLIC_DISPLAY_PERMISSION_UNCONFIRMED") }
  if text(history, "seriesType", "price-only") == "price-only" { warnings.push("PRICE_ONLY_NOT_TOTAL_RETURN") }
  let first = points[0].date
  let last = points[points.length()-1].date
  if last < month_later(first, 12) { warnings.push("LESS_THAN_ONE_YEAR_NO_ANNUALIZATION") }
  let source : Json = { "source": field(history, "source"), "sourceUrl": field(history, "sourceUrl"), "retrieved": field(history, "retrieved"), "firstDate": first, "lastDate": last, "seriesType": field(history, "seriesType"), "licenseStatus": field(history, "licenseStatus"), "adjustment": field(history, "adjustment"), "provider": field(history, "provider") }
  if instrument == "index" {
    if field(j, "options") != null { raise Invalid("Index context does not accept investment options") }
    return { "ok": true, "schemaVersion": 1, "engineVersion": "0.1.0-candidate", "mode": mode, "source": source, "warnings": @json.to_json(warnings), "metrics": metrics_json(metrics(points)), "replay": null, "rolling": null }
  }
  let o = read_options(field(j, "options"))
  let years_number = number(j, "requestedYears", 20.0)
  if years_number < 1.0 || years_number > 100.0 || years_number != @math.floor(years_number) { raise Invalid("requestedYears must be an integer in 1..100") }
  let years = years_number.to_int()
  let anchor = text(j, "startDate", first)
  let _ = date_parts(anchor)
  let start = lower_bound(points, anchor)
  if start >= points.length() { raise Invalid("Start date is beyond available history") }
  let target = month_later(anchor, years * 12)
  let end = Int::min(points.length()-1, lower_bound(points, target))
  if target > last { warnings.push("REQUESTED_WINDOW_SHORTENED_TO_AVAILABLE_HISTORY") }
  if anchor < first { warnings.push("START_SHIFTED_TO_FIRST_AVAILABLE_OBSERVATION") }
  if o.historical_fx && (o.fx_points.is_empty() || series_value(o.fx_points, points[start].date) is None) { warnings.push("FIXED_FX_USED_BEFORE_AVAILABLE_FX_HISTORY") }
  if o.historical_fx && !o.fx_points.is_empty() && last > o.fx_points[o.fx_points.length()-1].date { warnings.push("LAST_AVAILABLE_FX_CARRIED_FORWARD") }
  if o.historical_cpi && (o.cpi_points.is_empty() || anchor < o.cpi_points[0].date || last > o.cpi_points[o.cpi_points.length()-1].date) { warnings.push("INFLATION_SCENARIO_USED_OUTSIDE_CPI_HISTORY") }
  if o.fee is None { warnings.push("FEE_RATE_UNKNOWN") } else { warnings.push("FEE_DRAG_IS_COUNTERFACTUAL_NOT_DEDUCTED_AGAIN") }
  let r = replay(points, start, end, o, true, anchor)
  let rolls = if mode == "rolling" { rolling(points, years, o) } else { None }
  if mode == "rolling" && rolls is None { warnings.push("NO_FULL_ROLLING_WINDOW_FULL_AVAILABLE_REPLAY_SHOWN") }
  { "ok": true, "schemaVersion": 1, "engineVersion": "0.1.0-candidate", "mode": mode, "source": source, "warnings": @json.to_json(warnings), "requestedYears": years, "availableYears": distance(points[start].date, points[end].date).to_double()/365.25, "replay": replay_json(r), "rolling": rolling_json(rolls), "metrics": metrics_json(metrics(points)) }
}

///|
fn[T : ToJson] nullable(value : T?) -> Json {
  match value { Some(v) => @json.to_json(v); None => null }
}

///|
fn replay_json(r : Replay) -> Json raise {
  for value in [r.endValue, r.realEndValue, r.principal, r.multiple, r.productMaxDrawdown, r.accountWorstReturn, r.inflationFactor, r.startFx, r.endFx, r.cashQuote, r.feeDrag.unwrap_or(0.0)] { require_finite(value) }
  for p in r.path { for value in [p.value, p.principal, p.realValue, p.realPrincipal] { require_finite(value) } }
  let j = @json.to_json(r)
  match j { Object(m) => m["feeDrag"] = nullable(r.feeDrag); _ => () }
  j
}

///|
fn metrics_json(v : Metrics) -> Json raise {
  for value in [v.cumulativeReturn, v.cagr.unwrap_or(0.0), v.volatility.unwrap_or(0.0), v.maxDrawdown] { require_finite(value) }
  for row in v.annualReturns { require_finite(row.value) }
  for row in v.growth { require_finite(row.value) }
  for row in v.drawdowns { require_finite(row.value) }
  let j = @json.to_json(v)
  match j {
    Object(m) => { m["cagr"] = nullable(v.cagr); m["volatility"] = nullable(v.volatility); m["recoveryDate"] = nullable(v.recoveryDate) }
    _ => ()
  }
  j
}

///|
fn rolling_json(value : Rolling?) -> Json raise {
  match value {
    None => null
    Some(r) => { "samples": r.samples, "requestedYears": r.requestedYears, "worst": replay_json(r.worst), "median": replay_json(r.median), "best": replay_json(r.best), "lossShare": r.lossShare, "limited": r.limited }
  }
}

///|
fn require_finite(value : Double) -> Unit raise {
  if value.is_inf() || value.is_nan() { raise Invalid("Calculation exceeds supported numeric range") }
}
