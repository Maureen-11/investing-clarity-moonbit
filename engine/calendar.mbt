///|
fn leap(y : Int) -> Bool { y % 4 == 0 && (y % 100 != 0 || y % 400 == 0) }

///|
fn month_days(y : Int, m : Int) -> Int {
  if m == 2 { if leap(y) { 29 } else { 28 } } else if m == 4 || m == 6 || m == 9 || m == 11 { 30 } else { 31 }
}

///|
fn digits(s : String, start : Int, end : Int) -> Int raise {
  let mut n = 0
  for i = start; i < end; i = i + 1 {
    let d = s[i].to_int() - 48
    if d < 0 || d > 9 { raise Invalid("Invalid ISO date") }
    n = n * 10 + d
  }
  n
}

///|
fn date_parts(s : String) -> (Int, Int, Int) raise {
  if s.length() != 10 || s[4].to_int() != 45 || s[7].to_int() != 45 { raise Invalid("Date must be YYYY-MM-DD") }
  let y = digits(s, 0, 4)
  let m = digits(s, 5, 7)
  let d = digits(s, 8, 10)
  if y < 1900 || y > 2200 || m < 1 || m > 12 || d < 1 || d > month_days(y, m) { raise Invalid("Date outside valid calendar range") }
  (y, m, d)
}

///|
fn serial(s : String) -> Int raise {
  let (y, m, d) = date_parts(s)
  let prior = y - 1
  let mut days = prior * 365 + prior / 4 - prior / 100 + prior / 400 + d
  for month = 1; month < m; month = month + 1 { days = days + month_days(y, month) }
  days
}

///|
fn distance(a : String, b : String) -> Int raise { Int::max(0, serial(b) - serial(a)) }

///|
fn padded(n : Int) -> String { if n < 10 { "0" + n.to_string() } else { n.to_string() } }

///|
fn month_later(s : String, months : Int) -> String raise {
  let (y, m, d) = date_parts(s)
  let total = y * 12 + m - 1 + months
  let year = total / 12
  let month = total % 12 + 1
  year.to_string() + "-" + padded(month) + "-" + padded(Int::min(d, month_days(year, month)))
}

///|
fn lower_bound(points : Array[Point], date : String) -> Int {
  let mut lo = 0
  let mut hi = points.length()
  while lo < hi { let mid = (lo + hi) / 2; if points[mid].date < date { lo = mid + 1 } else { hi = mid } }
  lo
}

///|
fn series_value(points : Array[Point], date : String) -> Double? {
  let i = lower_bound(points, date)
  if i < points.length() && points[i].date == date { Some(points[i].price) } else if i > 0 { Some(points[i-1].price) } else { None }
}

///|
fn scheduled(points : Array[Point], start : Int, end : Int, o : Options, anchor : String) -> Array[Bool] raise {
  let flags = Array::make(points.length(), false)
  if o.frequency == "daily" {
    for i = start; i < end; i = i + 1 { flags[i] = true }
  } else {
    for offset = 0; offset < 1200; offset = offset + 1 {
      let planned = month_later(anchor, offset * (if o.frequency == "monthly" { 1 } else { 12 }))
      let index = lower_bound(points, planned)
      if index >= end { break }
      if index >= start { flags[index] = true }
    }
  }
  flags
}
