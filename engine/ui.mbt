///| Next calendar day, preserving the engine's validated ISO convention.
fn next_day(s : String) -> String raise {
  let (y,m,d) = date_parts(s)
  if d < month_days(y,m) { y.to_string()+"-"+padded(m)+"-"+padded(d+1) }
  else if m < 12 { y.to_string()+"-"+padded(m+1)+"-01" }
  else { (y+1).to_string()+"-01-01" }
}

///|
fn includes_string(j : Json, s : String) -> Bool {
  match j { Array(a) => a.any(x => x == @json.to_json(s)); _ => false }
}

///|
fn plan_summary(j : Json) -> Json raise {
  let start = text(j,"startDate","")
  let (start_year,_,_) = date_parts(start)
  let n = number(j,"years",20.0)
  if n < 1.0 || n > 100.0 || n != @math.floor(n) { raise Invalid("Plan years must be an integer in 1..100") }
  let years = n.to_int()
  let end_exclusive = month_later(start, years*12)
  let _ = date_parts(end_exclusive)
  let o = read_options(field(j,"options"))
  let market = text(j,"market","US")
  if market != "US" && market != "HK" && market != "CN" { raise Invalid("Invalid market") }
  let rule = field(field(j,"calendarRules"),market)
  if rule == null { raise Invalid("Missing calendar source") }
  let annual_days = number(rule,"days",0.0)
  if annual_days <= 0.0 || annual_days > 366.0 { raise Invalid("Invalid calendar estimate") }
  let known = field(rule,"knownYears")
  let holidays = field(rule,"holidays")
  let state = fn(date : String) -> Int raise {
    let (y,_,_) = date_parts(date)
    if !includes_string(known,y.to_string()) { return -1 }
    let weekday = serial(date) % 7
    if weekday == 0 || weekday == 6 || includes_string(holidays,date) { 0 } else { 1 }
  }
  let counts = Array::make(years,0)
  let trading : Array[String] = []
  let unknown_years : Array[Int] = []
  let unknown_days : Array[Int] = []
  let unknown_weekdays : Array[Int] = []
  let mut days = 0
  let mut weekends = 0
  let mut exact_holidays = 0
  let mut cursor = start
  let mut end = start
  while cursor < end_exclusive {
    let (year,_,_) = date_parts(cursor)
    let weekend = serial(cursor)%7 == 0 || serial(cursor)%7 == 6
    days = days+1
    if weekend { weekends=weekends+1 }
    if !includes_string(known,year.to_string()) {
      if unknown_years.is_empty() || unknown_years[unknown_years.length()-1] != year {
        unknown_years.push(year); unknown_days.push(0); unknown_weekdays.push(0)
      }
      let i=unknown_years.length()-1
      unknown_days[i]=unknown_days[i]+1
      if !weekend { unknown_weekdays[i]=unknown_weekdays[i]+1 }
    } else if !weekend {
      if state(cursor)==1 {
        trading.push(cursor)
        let index=Int::min(years-1,year-start_year)
        if o.frequency=="daily" { counts[index]=counts[index]+1 }
      } else { exact_holidays=exact_holidays+1 }
    }
    end=cursor
    cursor=next_day(cursor)
  }
  let mut estimated=0
  let mut unknown_weekday_count=0
  for i=0; i<unknown_years.length(); i=i+1 {
    let year=unknown_years[i]
    let estimate=@math.floor(annual_days*unknown_days[i].to_double()/(if leap(year){366.0}else{365.0})+0.5).to_int()
    estimated=estimated+estimate
    unknown_weekday_count=unknown_weekday_count+unknown_weekdays[i]
    if o.frequency=="daily" { let index=Int::min(years-1,year-start_year); counts[index]=counts[index]+estimate }
  }
  let preview : Array[String] = []
  if o.frequency=="daily" {
    for i=0;i<Int::min(8,trading.length());i=i+1 {preview.push(trading[i])}
  } else {
    for offset=0;offset<(if o.frequency=="monthly"{years*12}else{years});offset=offset+1 {
      let mut planned=month_later(start,offset*(if o.frequency=="monthly"{1}else{12}))
      for attempt=0;attempt<14;attempt=attempt+1 {
        let st=state(planned)
        if st == -1 || planned>=end_exclusive {break}
        if st==1 {if preview.length()<8{preview.push(planned)};break}
        planned=next_day(planned)
      }
    }
    for i=0;i<years;i=i+1 {counts[i]=if o.frequency=="monthly"{12}else{1}}
  }
  let trading_days=trading.length()+estimated
  let contributions=if o.frequency=="daily"{trading_days}else if o.frequency=="monthly"{years*12}else{years}
  let mut principal=o.initial
  for i=0;i<years;i=i+1 {principal=principal+counts[i].to_double()*o.payment*(if o.growth{@math.pow(1.0+o.inflation/100.0,i.to_double())}else{1.0})}
  {"start":start,"end":end,"totalDays":days,"weekends":weekends,"exactHolidays":exact_holidays,"estimatedHolidays":Int::max(0,unknown_weekday_count-estimated),"tradingDays":trading_days,"contributions":contributions,"nonContribution":days-contributions,"tradableNonContribution":Int::max(0,trading_days-contributions),"exact":unknown_years.is_empty(),"estimatedYears":@json.to_json(unknown_years),"previewDates":@json.to_json(preview),"contributionCountsByYear":@json.to_json(counts),"principal":principal,"periodicPrincipal":principal-o.initial}
}

///| Aggregation belongs in the engine rather than React render code.
fn enriched_metrics(points : Array[Point]) -> Json raise {
  let result=metrics_json(metrics(points))
  let m=metrics(points)
  let mut worst : Json=null
  let mut best : Json=null
  for row in m.annualReturns {
    if worst==null || row.value<number(worst,"value",0.0) {worst=@json.to_json(row)}
    if best==null || row.value>number(best,"value",0.0) {best=@json.to_json(row)}
  }
  let mut positive=0
  let mut samples=0
  let mut previous=""
  for i=0;i<points.length();i=i+1 {
    let month=points[i].date[0:7].to_owned()
    if month==previous {continue}
    previous=month
    let end=lower_bound(points,month_later(points[i].date,12))
    if end<points.length(){samples=samples+1;if points[end].price>=points[i].price{positive=positive+1}}
  }
  match result { Object(fields) => {fields["worstYear"]=worst;fields["bestYear"]=best;fields["positiveOneYear"]=if samples>0{@json.to_json(positive.to_double()/samples.to_double()*100.0)}else{null}}; _=>() }
  result
}

///|
pub fn ui_json(input : String) -> String {
  try {
    let j=@json.parse(input)
    if number(j,"schemaVersion",0.0)!=1.0 {raise Invalid("schemaVersion must be 1")}
    let action=text(j,"action","")
    let result=if action=="plan" {plan_summary(j)}
    else if action=="metrics" {enriched_metrics(checked_history(j))}
    else if action=="compare" {
      let first = checked_history(field(j,"first"))
      let second = checked_history(field(j,"second"))
      let first_start = first[0].date
      let second_start = second[0].date
      let start = if first_start > second_start { first_start } else { second_start }
      let first_end = first[first.length()-1].date
      let second_end = second[second.length()-1].date
      let end = if first_end < second_end { first_end } else { second_end }
      if start > end { raise Invalid("No common history interval") }
      let trim = fn(points : Array[Point]) -> Array[Point] raise {
        let selected = points.filter(p => p.date >= start && p.date <= end)
        if selected.is_empty() { raise Invalid("No observations within common interval") }
        selected
      }
      let a = trim(first)
      let b = trim(second)
      let history_json = fn(points : Array[Point], original : Json) -> Json raise {
        {
          "firstDate": points[0].date,
          "lastDate": points[points.length()-1].date,
          "points": @json.to_json(points.map(p => (p.date,p.price))),
          "seriesType": text(original,"seriesType","price-only"),
          "instrumentKind": text(original,"instrumentKind","etf"),
        }
      }
      {
        "commonStart": start,
        "commonEnd": end,
        "first": {"metrics": enriched_metrics(a), "history": history_json(a,field(field(j,"first"),"history"))},
        "second": {"metrics": enriched_metrics(b), "history": history_json(b,field(field(j,"second"),"history"))},
        "note": "ETF only; metrics are calculated over the shared observation interval."
      }
    }
    else if action=="channels" {
      let points=checked_history(j)
      let o=read_options(field(j,"options"))
      let start=number(j,"startIndex",0.0).to_int()
      let end=number(j,"endIndex",(points.length()-1).to_double()).to_int()
      if start<0 || end<start || end>=points.length(){raise Invalid("Invalid fee path interval")}
      let anchor=text(j,"anchorDate",points[start].date)
      let base=replay(points,start,end,o,false,anchor)
      let rows : Array[Json]=[]
      match field(j,"rates") {
        Object(rates)=>for key,value in rates {
          match value {Number(rate,..) if rate>=0.0 && rate<=100.0 => {
            let adjusted_options : Options = {..o, payment:o.payment*(1.0-rate/100.0),initial:o.initial*(1.0-rate/100.0)}
            let adjusted=replay(points,start,end,adjusted_options,false,anchor)
            rows.push({"key":key,"paid":base.principal-adjusted.principal,"opportunity":Double::max(0.0,base.endValue-adjusted.endValue)})
          }; _=>()}
        }
        _=>()
      }
      for i=0;i<rows.length();i=i+1 {
        let paid=number(rows[i],"paid",0.0)
        let mut lowest=paid
        let mut rank=1
        for k=0;k<rows.length();k=k+1 {
          let other=number(rows[k],"paid",0.0)
          lowest=Double::min(lowest,other)
          if other<paid || (other==paid && k<i) {rank=rank+1}
        }
        match rows[i] {Object(m)=>{m["rank"]=@json.to_json(rank);m["gap"]=@json.to_json(paid-lowest)};_=>()}
      }
      @json.to_json(rows)
    } else {raise Invalid("Unknown UI operation")}
    finite_json(result)
    let response : Json={"ok":true,"schemaVersion":1,"result":result}
    response.stringify()
  } catch {Invalid(message)=>error_json(message).stringify(); _=>error_json("Invalid UI request").stringify()}
}
