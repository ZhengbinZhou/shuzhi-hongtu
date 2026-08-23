import { JIANGXI_BOUNDS, JIANGXI_PREFECTURES, RIVERS } from "@/app/jiangxi-map";
import { JIANGXI_COUNTIES } from "@/app/jiangxi-counties";
import { platformCountyNames, type Plan } from "@/lib/platform-data";
import { baseMapPoint } from "@/lib/planner";

export function HeroMap(){
  const highlighted = new Set(platformCountyNames);
  const activeCounties = JIANGXI_COUNTIES.filter(county=>highlighted.has(county.name));
  const labelPositions = activeCounties.reduce<{name:string;x:number;y:number;trueX:number;trueY:number}[]>((out,county)=>{
    let x=county.x,y=county.y,ring=0;
    while(out.some(label=>Math.hypot(label.x-x,label.y-y)<58)){
      ring++;
      const angle=ring*2.35;
      x=county.x+Math.cos(angle)*42*(.7+ring*.22);
      y=county.y+Math.sin(angle)*30*(.7+ring*.22);
    }
    out.push({name:county.name,x,y,trueX:county.x,trueY:county.y});
    return out;
  },[]);

  return <div className="hero-map" aria-label="江西省地图，高亮平台红色点位涉及的十二个县级行政区">
    <svg viewBox="0 0 1000 560" role="img">
      <defs>
        <filter id="hero-map-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="14" floodColor="#5b1117" floodOpacity=".14"/>
        </filter>
      </defs>
      <g className="hero-map-shape" filter="url(#hero-map-shadow)">
        {JIANGXI_COUNTIES.map(county=><path key={county.name} className={highlighted.has(county.name)?"active":""} d={county.d}/>)}
      </g>
      <text className="hero-province-label" x="515" y="286">江西省</text>
      <g className="hero-county-labels">{labelPositions.map(label=><g key={label.name}>
        {(label.x!==label.trueX||label.y!==label.trueY)&&<line x1={label.trueX} y1={label.trueY} x2={label.x} y2={label.y}/>}
        <circle cx={label.trueX} cy={label.trueY} r="3.5"/>
        <text x={label.x} y={label.y}>{label.name}</text>
      </g>)}</g>
    </svg>
    <div className="hero-map-note"><i/><span>平台点位覆盖县区</span><b>12</b></div>
  </div>
}
export function MiniMap({plan}:{plan:Plan}){
  const raw=plan.spots.map(s=>baseMapPoint(s.lng,s.lat));
  const width=1000,height=560,x=0,y=0;
  const minGap=35;
  const placed=raw.reduce<{x:number;y:number;trueX:number;trueY:number}[]>((out,p)=>{
    let px=p.x,py=p.y,ring=0;
    while(out.some(marker=>Math.hypot(marker.x-px,marker.y-py)<minGap)){
      ring++; const angle=ring*2.18; px=p.x+Math.cos(angle)*minGap*(.8+ring*.34); py=p.y+Math.sin(angle)*minGap*(.8+ring*.34);
    }
    out.push({x:px,y:py,trueX:p.x,trueY:p.y}); return out;
  },[]);
  const activeCountyNames=Array.from(new Set(plan.spots.map(s=>s.county)));
  const activeCounties=JIANGXI_COUNTIES.filter(county=>activeCountyNames.includes(county.name));
  const labelPositions=activeCounties.reduce<{name:string;x:number;y:number;trueX:number;trueY:number}[]>((out,county)=>{
    let lx=county.x,ly=county.y,ring=0;
    while(out.some(label=>Math.hypot(label.x-lx,label.y-ly)<52)){
      ring++; const angle=ring*2.35; lx=county.x+Math.cos(angle)*42*(.7+ring*.25); ly=county.y+Math.sin(angle)*30*(.7+ring*.25);
    }
    out.push({name:county.name,x:lx,y:ly,trueX:county.x,trueY:county.y}); return out;
  },[]);
  const centerLat=27.25;
  const kmPerUnit=(JIANGXI_BOUNDS.maxLng-JIANGXI_BOUNDS.minLng)/1000*111*Math.cos(centerLat*Math.PI/180);
  const scaleKm=100;
  const scaleWidth=scaleKm/kmPerUnit;
  return <div className="route-map" aria-label="江西省全域路线地图，高亮路线涉及的县级行政区">
    <svg viewBox={`${x} ${y} ${width} ${height}`} role="img">
      <defs><pattern id="terrain" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(28)"><line x1="0" y1="0" x2="0" y2="22" stroke="#bca98c" strokeOpacity=".10" strokeWidth="4"/></pattern></defs>
      <rect x={x} y={y} width={width} height={height} fill="#efe5d5"/>
      <g className="geo-grid">{[114,115,116,117,118].map(lng=>{const p=baseMapPoint(lng,26);return <line key={`lng-${lng}`} x1={p.x} y1="0" x2={p.x} y2="560"/>})}{[25,26,27,28,29,30].map(lat=>{const p=baseMapPoint(116,lat);return <line key={`lat-${lat}`} x1="0" y1={p.y} x2="1000" y2={p.y}/>})}</g>
      <g className="prefectures">{JIANGXI_PREFECTURES.map(area=><path key={area.name} d={area.path}/>)}</g>
      <g className="counties">{JIANGXI_COUNTIES.map(county=><path key={county.name} className={activeCountyNames.includes(county.name)?"active":""} d={county.d}/>)}</g>
      <rect x={x} y={y} width={width} height={height} fill="url(#terrain)"/>
      <g className="rivers">{RIVERS.map((river,i)=><polyline key={i} points={river.map(([lng,lat])=>{const p=baseMapPoint(lng,lat);return `${p.x},${p.y}`}).join(" ")}/>)}</g>
      <text className="province-label" x="510" y="286">江西省</text>
      <g className="county-labels">{labelPositions.map(label=><g key={label.name}>
        {(label.x!==label.trueX||label.y!==label.trueY)&&<line x1={label.trueX} y1={label.trueY} x2={label.x} y2={label.y}/>}
        <text x={label.x} y={label.y}>{label.name}</text>
      </g>)}</g>
      <polyline className="route-line" points={placed.map(p=>`${p.x},${p.y}`).join(" ")}/>
      {placed.map((p,i)=><g className="map-marker" key={plan.spots[i].id}>
        {(p.x!==p.trueX||p.y!==p.trueY)&&<><line className="marker-leader" x1={p.trueX} y1={p.trueY} x2={p.x} y2={p.y}/><circle className="true-point" cx={p.trueX} cy={p.trueY} r={Math.max(1.5,width/330)}/></>}
        <circle cx={p.x} cy={p.y} r={Math.max(9,width/42)}/><text x={p.x} y={p.y+Math.max(3.2,width/125)}>{i+1}</text>
      </g>)}
      <g className="north-arrow" transform={`translate(${x+width-35} ${y+34})`}><path d="M0 16L8 -12L16 16L8 11Z"/><text x="8" y="-18">N</text></g>
      <g className="scale-bar" transform={`translate(${x+24} ${y+height-25})`}><line x1="0" y1="0" x2={scaleWidth} y2="0"/><line x1="0" y1="-4" x2="0" y2="4"/><line x1={scaleWidth} y1="-4" x2={scaleWidth} y2="4"/><text x={scaleWidth/2} y="-8">{scaleKm} km</text></g>
    </svg>
    <div className="map-caption"><span>江西省全域 · 县级行政边界 · 主要河流 · 经纬网</span><span>深红区域为本路线涉及县区，近距离点位采用引线错位标注</span></div>
  </div>
}
