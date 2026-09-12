///|
fn fx_at(o : Options, date : String) -> Double {
  if o.historical_fx { series_value(o.fx_points, date).unwrap_or(o.fx) } else { o.fx }
}

///|
fn scenario(o : Options, a : String, b : String) -> Double raise {
  @math.pow(1.0 + o.inflation / 100.0, distance(a, b).to_double() / 365.25)
}

///|
fn power_factor(o : Options, start : String, end : String) -> Double raise {
  let points = o.cpi_points
  if !o.historical_cpi || points.is_empty() || end <= start { return scenario(o, start, end) }
  let first = points[0].date
  let last = points[points.length()-1].date
  if end < first || start > last { return scenario(o, start, end) }
  let a = if start < first { first } else { start }
  let b = if end > last { last } else { end }
  let mut factor = series_value(points, b).unwrap_or(1.0) / series_value(points, a).unwrap_or(1.0)
  if start < first { factor = factor * scenario(o, start, first) }
  if end > last { factor = factor * scenario(o, last, end) }
  factor
}

///|
fn buy(amount : Double, cash : Double, price : Double, fx : Double, o : Options) -> (Double, Double) {
  let available = amount / fx + cash
  let raw = available / price
  let shares = if o.whole { @math.floor(raw / o.lot) * o.lot } else { raw }
  (shares, available - shares * price)
}

///|
struct PathPoint {
  date : String
  value : Double
  principal : Double
  realValue : Double
  realPrincipal : Double
} derive(ToJson)

///|
struct Replay {
  anchorDate : String
  start : String
  end : String
  startIndex : Int
  endIndex : Int
  endValue : Double
  realEndValue : Double
  principal : Double
  contributions : Int
  multiple : Double
  productMaxDrawdown : Double
  accountWorstReturn : Double
  recoveryDays : Int
  feeDrag : Double?
  estimatedDirectFee : Double?
  feeRateKnown : Bool
  inflationFactor : Double
  startFx : Double
  endFx : Double
  cashQuote : Double
  path : Array[PathPoint]
} derive(ToJson)

///|
fn replay(points : Array[Point], start : Int, end : Int, o : Options, capture : Bool, anchor : String) -> Replay raise {
  let start_date = points[start].date
  let start_fx = fx_at(o, start_date)
  let (first_shares, first_cash) = buy(o.initial, 0.0, points[start].price, start_fx, o)
  let mut shares = first_shares
  let mut cash = first_cash
  let mut no_fee_shares = first_shares
  let mut no_fee_cash = first_cash
  let mut principal = o.initial
  let mut real_principal = o.initial
  let mut count = 0
  let mut peak = points[start].price
  let mut peak_date = start_date
  let mut drawdown = 0.0
  let mut recovery = 0
  let mut account_worst = 0.0
  let fee = o.fee.unwrap_or(0.0)
  let mut direct_fee = 0.0
  let mut previous_value = o.initial
  let path : Array[PathPoint] = []
  let contributions = scheduled(points, start, end, o, anchor)
  for i = start; i <= end; i = i + 1 {
    let p = points[i]
    let elapsed = distance(start_date, p.date).to_double() / 365.25
    let no_fee_price = p.price * @math.exp(fee / 100.0 * elapsed)
    let fx = fx_at(o, p.date)
    if contributions[i] {
      let payment = o.payment * (if o.growth { power_factor(o, anchor, p.date) } else { 1.0 })
      let (bought, remaining) = buy(payment, cash, p.price, fx, o)
      shares = shares + bought
      cash = remaining
      let (other, other_cash) = buy(payment, no_fee_cash, no_fee_price, fx, o)
      no_fee_shares = no_fee_shares + other
      no_fee_cash = other_cash
      principal = principal + payment
      real_principal = real_principal + payment / power_factor(o, anchor, p.date)
      count = count + 1
    }
    if p.price >= peak {
      recovery = Int::max(recovery, distance(peak_date, p.date))
      peak = p.price
      peak_date = p.date
    } else { drawdown = Double::min(drawdown, p.price / peak - 1.0) }
    let value = (shares * p.price + cash) * fx
    if i > start { direct_fee = direct_fee + previous_value * fee / 100.0 * distance(points[i-1].date,p.date).to_double() / 365.25 }
    previous_value = value
    if principal > 0.0 { account_worst = Double::min(account_worst, value / principal - 1.0) }
    if capture && (i == start || i == end || i % 21 == 0) {
      path.push({ date: p.date, value, principal, realValue: value / power_factor(o, anchor, p.date), realPrincipal: real_principal })
    }
  }
  let terminal = points[end]
  recovery = Int::max(recovery, distance(peak_date, terminal.date))
  let end_fx = fx_at(o, terminal.date)
  let end_value = (shares * terminal.price + cash) * end_fx
  let elapsed = distance(start_date, terminal.date).to_double() / 365.25
  let no_fee_value = (no_fee_shares * terminal.price * @math.exp(fee / 100.0 * elapsed) + no_fee_cash) * end_fx
  let factor = power_factor(o, anchor, terminal.date)
  { anchorDate: anchor, start: start_date, end: terminal.date, startIndex: start, endIndex: end, endValue: end_value, realEndValue: end_value / factor, principal, contributions: count, multiple: if principal > 0.0 { end_value / principal } else { 0.0 }, productMaxDrawdown: drawdown * 100.0, accountWorstReturn: account_worst * 100.0, recoveryDays: recovery, feeDrag: if o.fee is Some(_) { Some(Double::max(0.0, no_fee_value - end_value)) } else { None }, estimatedDirectFee: if o.fee is Some(_) {Some(direct_fee)}else{None}, feeRateKnown: o.fee is Some(_), inflationFactor: factor, startFx: start_fx, endFx: end_fx, cashQuote: cash, path }
}
