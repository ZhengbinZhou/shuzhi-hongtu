import { JIANGXI_BOUNDS } from "@/app/jiangxi-map";
import { travelEngine, type TravelMode } from "@/lib/route/travel";
import { skeletons, spots, type Plan, type Spot, type Theme } from "@/lib/platform-data";

export function travel(a: Spot, b: Spot, mode: TravelMode = "self") {
  return travelEngine.travel(a, b, mode).minutes;
}
export function dateAt(start:string, offset:number) { const d = new Date(`${start}T12:00:00`); d.setDate(d.getDate()+offset); return d; }
export function isOpen(s:Spot, start:string, day:number) { return !s.closed.includes(dateAt(start,day).getDay()); }
export function pointFit(s:Spot, t1:Theme, t2:Theme, exp:string) { return s.themes[t1]*.5+s.themes[t2]*.25+(s.experience[exp]||0)*.25; }
export function arrange(list:Spot[], mode: TravelMode = "self") {
  if (list.length < 2) return list;
  const remaining=[...list.slice(1)], out=[list[0]];
  while(remaining.length){ const last=out[out.length-1]; remaining.sort((a,b)=>travel(last,a,mode)-travel(last,b,mode)); out.push(remaining.shift()!); }
  return out;
}
export function splitDays(list:Spot[], days:number, start:string, mode: TravelMode = "self") {
  const result:Spot[][]=Array.from({length:days},()=>[]); let day=0, used=0;
  for(const s of list){
    const prev=result[day].at(-1); const need=s.minutes+(prev?travel(prev,s,mode):0);
    if(day<days-1 && used+need>480){day++;used=0;}
    if(isOpen(s,start,day)){result[day].push(s);used+=need;}
  }
  return result.filter(x=>x.length);
}
export function dayMinutes(day:Spot[], mode: TravelMode = "self") {
  return day.reduce((sum,s,i)=>sum+s.minutes+(i?travel(day[i-1],s,mode):0),0);
}
export function generateAllPlans(startCounty:string,startDate:string,days:number,t1:Theme,t2:Theme,exp:string,purpose:string,mode: TravelMode = "self"):Plan[]{
  const capacity=days*480;
  return skeletons.map((sk,idx)=>{
    let selected=sk.core.map(id=>spots.find(s=>s.id===id)!).filter(Boolean);
    const startBonus=(s:Spot)=>s.county===startCounty?1.3:0;
    const pool=spots.filter(s=>!selected.some(x=>x.id===s.id))
      .sort((a,b)=>(pointFit(b,t1,t2,exp)+startBonus(b))-(pointFit(a,t1,t2,exp)+startBonus(a)));
    let total=selected.reduce((n,s,i)=>n+s.minutes+(i?travel(selected[i-1],s,mode):0),0);
    for(const s of pool){
      const nearest=Math.min(...selected.map(x=>travel(x,s,mode))); const add=s.minutes+nearest;
      if(total+add<=capacity-40 && selected.length<days*4){selected.push(s);total+=add;}
    }
    const firstLocal=selected.findIndex(s=>s.county===startCounty);
    if(firstLocal>0 && pointFit(selected[firstLocal],t1,t2,exp)+1>=pointFit(selected[0],t1,t2,exp)){
      const [local]=selected.splice(firstLocal,1);selected.unshift(local);
    }
    selected=arrange(selected,mode);
    const daily=splitDays(selected,days,startDate,mode); const flat=daily.flat();
    const match=flat.reduce((n,s)=>n+pointFit(s,t1,t2,exp),0)/Math.max(1,flat.length)/5*100;
    const feasible=daily.length>0 && flat.length>=sk.core.length && daily.every(day=>dayMinutes(day,mode)<=480);
    const score=Math.round(Math.min(98,match*.82+(feasible?12:0)+(flat[0]?.county===startCounty?4:0)-(idx*.35)));
    return {id:`plan-${idx}-${startDate}`,name:sk.name,angle:sk.angle,score,spots:flat,days:daily,
      reason:"",
      dimensions:[{label:t1,value:Math.round(match)},{label:t2,value:Math.round(flat.reduce((n,s)=>n+s.themes[t2],0)/Math.max(1,flat.length)/5*100)},{label:exp,value:Math.round(flat.reduce((n,s)=>n+(s.experience[exp]||0),0)/Math.max(1,flat.length)/5*100)},{label:"行程可行性",value:feasible?94:58}],criteria:{county:startCounty,startDate,days,theme1:t1,theme2:t2,experience:exp,purpose,travelMode:mode},feasible
    };
  }).filter(p=>p.feasible&&p.days.length&&p.spots.length>=3).sort((a,b)=>b.score-a.score);
}

export function generatePlans(startCounty:string,startDate:string,days:number,t1:Theme,t2:Theme,exp:string,purpose:string,mode: TravelMode = "self"):Plan[]{
  return generateAllPlans(startCounty,startDate,days,t1,t2,exp,purpose,mode).slice(0,5);
}

export function baseMapPoint(lng:number,lat:number) {
  const {minLng,maxLng,minLat,maxLat,width,height}=JIANGXI_BOUNDS;
  return {x:(lng-minLng)/(maxLng-minLng)*width,y:(maxLat-lat)/(maxLat-minLat)*height};
}
