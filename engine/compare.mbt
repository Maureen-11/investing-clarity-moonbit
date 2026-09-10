///|
pub fn compare_json(input : String) -> String {
  try {
    let j = @json.parse(input)
    let a = field(j, "first")
    let b = field(j, "second")
    let first = checked_history(a)
    let second = checked_history(b)
    let start = if first[0].date > second[0].date { first[0].date } else { second[0].date }
    let ae = first[first.length()-1].date
    let be = second[second.length()-1].date
    let end = if ae < be { ae } else { be }
    if start > end { raise Invalid("No common history interval") }
    let trim = fn(req : Json, points : Array[Point]) -> Json raise {
      let selected = points.filter(p => p.date >= start && p.date <= end)
      if selected.is_empty() { raise Invalid("No observations within common interval") }
      let history = field(req, "history")
      match history {
        Object(m) => {
          m["points"] = @json.to_json(selected.map(p => (p.date, p.price)))
          m["firstDate"] = @json.to_json(selected[0].date)
          m["lastDate"] = @json.to_json(selected[selected.length()-1].date)
        }
        _ => raise Invalid("History must be an object")
      }
      match req { Object(m) => m["startDate"] = @json.to_json(start); _ => () }
      analyze(req)
    }
    let result : Json = { "ok": true, "schemaVersion": 1, "commonStart": start, "commonEnd": end, "first": trim(a, first), "second": trim(b, second), "note": "Calendar overlap; market observations can differ. No observations beyond commonEnd are included." }
    finite_json(result)
    result.stringify()
  } catch {
    Invalid(message) => error_json(message).stringify()
    _ => error_json("Invalid comparison request").stringify()
  }
}
