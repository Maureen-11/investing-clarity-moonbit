///|
priv suberror InputError { Invalid(String) }

///|
fn field(j : Json, name : String) -> Json {
  match j { Object(m) => m.get(name).unwrap_or(null); _ => null }
}

///|
fn number(j : Json, name : String, default : Double) -> Double raise {
  match field(j, name) {
    Null => default
    Number(n, ..) if !n.is_nan() && !n.is_inf() => n
    _ => raise Invalid("Invalid number: " + name)
  }
}

///|
fn text(j : Json, name : String, default : String) -> String raise {
  match field(j, name) { Null => default; String(s) => s; _ => raise Invalid("Invalid string: " + name) }
}

///|
fn flag(j : Json, name : String) -> Bool raise {
  match field(j, name) { Null => false; True => true; False => false; _ => raise Invalid("Invalid boolean: " + name) }
}

///|
struct Point { date : String; price : Double } derive(ToJson)

///|
fn read_points(j : Json, allow_empty : Bool) -> Array[Point] raise {
  let rows : Array[Json] = match j { Array(a) => a; Null if allow_empty => []; _ => raise Invalid("History points must be an array") }
  if (!allow_empty && rows.is_empty()) || rows.length() > 50000 { raise Invalid("History must contain 1..50000 observations") }
  let result : Array[Point] = []
  let mut previous = ""
  for row in rows {
    let (date, price) : (String, Double) = @json.from_json(row)
    let _ = date_parts(date)
    if date <= previous || price <= 0.0 || price.is_nan() || price.is_inf() { raise Invalid("History dates must increase and prices must be positive") }
    result.push({ date, price })
    previous = date
  }
  result
}

///|
priv struct Options {
  frequency : String
  payment : Double
  initial : Double
  inflation : Double
  growth : Bool
  fx : Double
  historical_fx : Bool
  fx_points : Array[Point]
  historical_cpi : Bool
  cpi_points : Array[Point]
  whole : Bool
  lot : Double
  fee : Double?
  schedule_day : Int
}

///|
fn read_options(j : Json) -> Options raise {
  match j { Object(_) | Null => (); _ => raise Invalid("options must be an object") }
  let frequency = text(j, "frequency", "monthly")
  let payment = number(j, "payment", 100.0)
  let initial = number(j, "initial", 0.0)
  let inflation = number(j, "inflation", 2.5)
  let fx = number(j, "fxRate", 1.0)
  let lot = number(j, "lotSize", 1.0)
  let day = number(j, "scheduleDay", 1.0)
  let mode = text(j, "unitMode", "fractional")
  let fx_mode = text(j, "fxMode", "fixed")
  let cpi_mode = text(j, "inflationMode", "scenario")
  let fee = match field(j, "feeRate") { Null => None; _ => Some(number(j, "feeRate", 0.0)) }
  if !(frequency == "daily" || frequency == "monthly" || frequency == "yearly") || !(mode == "fractional" || mode == "whole") || !(fx_mode == "fixed" || fx_mode == "historical") || !(cpi_mode == "scenario" || cpi_mode == "historical") { raise Invalid("Unsupported calculation mode") }
  if payment < 0.0 || payment > 1.0e12 || initial < 0.0 || initial > 1.0e12 || inflation <= -100.0 || inflation > 100.0 || fx <= 0.0 || lot < 1.0 || lot != @math.floor(lot) || day < 1.0 || day > 31.0 || day != @math.floor(day) { raise Invalid("Option out of supported range") }
  match fee { Some(f) if f < 0.0 || f > 100.0 => raise Invalid("Fee rate out of range"); _ => () }
  { frequency, payment, initial, inflation, growth: flag(j, "contributionGrowth"), fx, historical_fx: fx_mode == "historical", fx_points: read_points(field(j, "fxPoints"), true), historical_cpi: cpi_mode == "historical", cpi_points: read_points(field(j, "cpiPoints"), true), whole: mode == "whole", lot, fee, schedule_day: day.to_int() }
}
