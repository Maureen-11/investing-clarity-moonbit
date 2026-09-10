///|
struct PlotPoint { date : String; value : Double } derive(ToJson)

///|
struct AnnualReturn { year : String; value : Double; partial : Bool } derive(ToJson)

///|
struct Metrics {
  cumulativeReturn : Double
  cagr : Double?
  volatility : Double?
  maxDrawdown : Double
  drawdownWindow : String
  recoveryDays : Int
  peakToRecoveryDays : Int
  recovered : Bool
  recoveryDate : String?
  annualReturns : Array[AnnualReturn]
  growth : Array[PlotPoint]
  drawdowns : Array[PlotPoint]
} derive(ToJson)

///|
fn metrics(points : Array[Point]) -> Metrics raise {
  let first = points[0]
  let last = points[points.length()-1]
  let long = last.date >= month_later(first.date, 12)
  let years = distance(first.date, last.date).to_double() / 365.25
  let mut peak = first.price
  let mut peak_date = first.date
  let mut deepest_peak = first.date
  let mut deepest_peak_price = first.price
  let mut trough = first.date
  let mut trough_index = 0
  let mut worst = 0.0
  let mut mean = 0.0
  let mut variance_sum = 0.0
  let mut previous_year = first.date[0:4].to_owned()
  let mut previous_year_end : Double? = None
  let mut year_end = first.price
  let annual : Array[AnnualReturn] = []
  let growth : Array[PlotPoint] = []
  let drawdowns : Array[PlotPoint] = []
  let stride = Int::max(1, points.length() / 180)
  for i = 0; i < points.length(); i = i + 1 {
    let p = points[i]
    if p.price >= peak { peak = p.price; peak_date = p.date }
    let dd = (p.price / peak - 1.0) * 100.0
    if dd < worst { worst = dd; deepest_peak = peak_date; deepest_peak_price = peak; trough = p.date; trough_index = i }
    if i > 0 {
      let change = p.price / points[i-1].price - 1.0
      let delta = change - mean
      mean = mean + delta / i.to_double()
      variance_sum = variance_sum + delta * (change - mean)
    }
    let year = p.date[0:4].to_owned()
    if year != previous_year {
      match previous_year_end { Some(base) => annual.push({ year: previous_year, value: (year_end / base - 1.0) * 100.0, partial: false }); None => () }
      previous_year_end = Some(year_end)
      previous_year = year
    }
    year_end = p.price
    if i % stride == 0 || i == points.length()-1 {
      growth.push({ date: p.date, value: p.price / first.price * 100.0 })
      drawdowns.push({ date: p.date, value: dd })
    }
  }
  match previous_year_end { Some(base) => annual.push({ year: previous_year, value: (year_end / base - 1.0) * 100.0, partial: true }); None => () }
  let mut recovery : String? = None
  for i = trough_index; i < points.length(); i = i + 1 {
    if points[i].price >= deepest_peak_price { recovery = Some(points[i].date); break }
  }
  let recovery_end = recovery.unwrap_or(last.date)
  { cumulativeReturn: (last.price / first.price - 1.0) * 100.0, cagr: if long { Some((@math.pow(last.price / first.price, 1.0 / years) - 1.0) * 100.0) } else { None }, volatility: if long && points.length() > 2 { Some((variance_sum / (points.length()-2).to_double()).sqrt() * 252.0.sqrt() * 100.0) } else { None }, maxDrawdown: worst, drawdownWindow: deepest_peak + " — " + trough, recoveryDays: distance(trough, recovery_end), peakToRecoveryDays: distance(deepest_peak, recovery_end), recovered: recovery is Some(_), recoveryDate: recovery, annualReturns: annual, growth, drawdowns }
}

///|
struct Rolling {
  samples : Int
  requestedYears : Int
  worst : Replay
  median : Replay
  best : Replay
  lossShare : Double
  limited : Bool
} derive(ToJson)

///|
fn rolling(points : Array[Point], years : Int, o : Options) -> Rolling? raise {
  let first = points[0].date
  let last = points[points.length()-1].date
  if last < month_later(first, years*12) { return None }
  let (y, m, _) = date_parts(first)
  let month_start = y.to_string() + "-" + padded(m) + "-01"
  let mut seen = -1
  let rows : Array[Replay] = []
  for offset = 0; offset < 1200; offset = offset + 1 {
    let cursor = month_later(month_start, offset)
    if cursor > last { break }
    let (cy, cm, _) = date_parts(cursor)
    let anchor = cursor[0:8].to_owned() + padded(Int::min(o.schedule_day, month_days(cy, cm)))
    let start = lower_bound(points, anchor)
    if start == seen || start >= points.length() { continue }
    seen = start
    let end = lower_bound(points, month_later(anchor, years*12))
    if end < points.length() { rows.push(replay(points, start, end, o, false, anchor)) }
  }
  if rows.is_empty() { return None }
  // Stable insertion sort keeps equal-multiple anchors in chronological order.
  for i = 1; i < rows.length(); i = i + 1 {
    let item = rows[i]
    let mut j = i
    while j > 0 && rows[j-1].multiple > item.multiple { rows[j] = rows[j-1]; j = j - 1 }
    rows[j] = item
  }
  let enrich = fn(r : Replay) -> Replay raise { replay(points, r.startIndex, r.endIndex, o, true, r.anchorDate) }
  let mut losses = 0
  for r in rows { if r.endValue < r.principal { losses = losses + 1 } }
  Some({ samples: rows.length(), requestedYears: years, worst: enrich(rows[0]), median: enrich(rows[(rows.length()-1)/2]), best: enrich(rows[rows.length()-1]), lossShare: losses.to_double()/rows.length().to_double(), limited: rows.length() < 24 })
}
