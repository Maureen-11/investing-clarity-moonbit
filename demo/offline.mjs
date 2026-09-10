// Artificial weekday observations for education and testing. Not a real security.
export function offlineHistory() {
  const points=[];
  for(let day=0;day<1500;day++) {
    const date=new Date(Date.UTC(2020,0,1+day));
    if(date.getUTCDay()===0||date.getUTCDay()===6)continue;
    points.push([date.toISOString().slice(0,10),100+day*.025+15*Math.sin(day/110)]);
  }
  return {points,firstDate:points[0][0],lastDate:points.at(-1)[0],source:'人工构造的教学数据；不代表任何真实证券',retrieved:'2026-09-10',licenseStatus:'verified',seriesType:'price-only',provider:'synthetic',adjustment:'none'};
}
