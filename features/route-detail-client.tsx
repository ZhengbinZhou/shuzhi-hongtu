"use client";

import Link from "next/link";
import { useState } from "react";
import { TdtMiniMap } from "@/components/map/tdt-mini-map";
import { MiniMap } from "@/components/platform-maps";
import { RouteSummary } from "@/components/route/route-summary";
import { getMapEngine, getTiandituTk } from "@/lib/map/engine";
import { buildRouteServices, dateAt, pointFit, splitDays } from "@/lib/planner";
import { plannerQuery } from "@/lib/planner-query";
import { spots, type Plan, type Spot } from "@/lib/platform-data";

const STORAGE_KEY = "shujing-routes-v2";
const mapEngine = getMapEngine();
const tiandituTk = getTiandituTk();
function displayRouteName(name:string){return name.replace(/·/g,"—");}

function readSaved(): Plan[] {
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(current)) return current;
    return [];
  } catch {
    return [];
  }
}

export function RouteDetailClient({initialPlan}:{initialPlan:Plan}) {
  const [plan,setPlan] = useState(initialPlan);
  const [savedMessage,setSavedMessage] = useState("");
  const updateSpots = (next:Spot[]) => setPlan(current => ({
    ...current,
    spots: next,
    days: splitDays(next,current.criteria.days,current.criteria.startDate,current.criteria.travelMode ?? "self"),
    services: buildRouteServices(next),
    score: Math.max(60,current.score-1),
  }));
  const move = (index:number,direction:number) => {
    const target=index+direction;
    if(target<0||target>=plan.spots.length)return;
    const next=[...plan.spots];
    [next[index],next[target]]=[next[target],next[index]];
    updateSpots(next);
  };
  const swap = (index:number) => {
    const old=plan.spots[index];
    const candidate=spots
      .filter(spot=>spot.region===old.region&&!plan.spots.some(item=>item.id===spot.id)&&!spot.core)
      .sort((a,b)=>pointFit(b,plan.criteria.theme1,plan.criteria.theme2,plan.criteria.experience)-pointFit(a,plan.criteria.theme1,plan.criteria.theme2,plan.criteria.experience))[0];
    if(!candidate)return;
    const next=[...plan.spots];
    next[index]=candidate;
    updateSpots(next);
  };
  const save = () => {
    const saved=readSaved();
    const record={...plan,id:`saved-${Date.now()}`};
    localStorage.setItem(STORAGE_KEY,JSON.stringify([record,...saved].slice(0,12)));
    setSavedMessage("路线已保存到“我的路线”");
  };
  return <main className="page-main">
    <section className="page-hero compact">
      <div><p className="kicker">ROUTE DETAIL</p><h1>{displayRouteName(plan.name)}</h1></div>
      <div className="score"><b>{plan.score}</b><span>综合匹配</span></div>
    </section>
    <section className="section route-detail-page">
      <div className="route-toolbar no-print"><Link href={`/routes?${plannerQuery(plan.criteria)}`}>← 返回推荐结果</Link><div><button onClick={save}>保存路线</button><button onClick={()=>window.print()}>打印 / 导出 PDF</button></div></div>
      {savedMessage&&<p className="success-message" role="status">{savedMessage}</p>}
      <div className="bars">{plan.dimensions.map(item=><div key={item.label}><span>{item.label}</span><i><b style={{width:`${item.value}%`}}/></i><em>{item.value}%</em></div>)}</div>
      <section className="route-context" aria-label="路线背景介绍">
        <div><small>BACKGROUND</small><h2>路线背景</h2></div>
        <p>{plan.background}</p>
        <p>{plan.reason}</p>
      </section>
      {mapEngine==="tdt"?<TdtMiniMap tk={tiandituTk} spots={plan.spots} onSelect={spot=>{window.location.href=`/landmarks/${spot.id}`}}/>:<MiniMap plan={plan}/>}
      <RouteSummary spots={plan.spots} mode={plan.criteria.travelMode ?? "self"}/>
      <div className="days printable-days">{plan.days.map((day,dayIndex)=><section key={dayIndex}>
        <header><b>DAY {dayIndex+1}</b><span>{dateAt(plan.criteria.startDate,dayIndex).toLocaleDateString("zh-CN",{month:"long",day:"numeric",weekday:"short"})}</span></header>
        {day.map(spot=>{const index=plan.spots.findIndex(item=>item.id===spot.id);return <div className="stop" key={spot.id}>
          <Link className="spot-open" href={`/landmarks/${spot.id}`}><img src={spot.image} alt=""/><span><small>{spot.region} · 建议{spot.minutes}分钟</small><b>{spot.name}</b></span></Link>
          <div className="edit-actions no-print"><button onClick={()=>move(index,-1)} aria-label={`上移${spot.name}`}>↑</button><button onClick={()=>move(index,1)} aria-label={`下移${spot.name}`}>↓</button>{!spot.core&&<><button onClick={()=>swap(index)}>替换</button><button onClick={()=>updateSpots(plan.spots.filter(item=>item.id!==spot.id))}>删除</button></>}</div>
        </div>})}
      </section>)}</div>
      <section className="route-services" aria-label="住宿与出行推荐链接">
        <div className="service-column">
          <small>STAY</small>
          <h2>携程住宿</h2>
          {plan.services.hotels.map(link=><a key={link.href} href={link.href} target="_blank" rel="noreferrer"><b>{link.label}</b><span>{link.note}</span></a>)}
        </div>
        <div className="service-column">
          <small>TRANSFER</small>
          <h2>包车与接驳</h2>
          {plan.services.charters.map(link=><a key={link.href} href={link.href} target="_blank" rel="noreferrer"><b>{link.label}</b><span>{link.note}</span></a>)}
        </div>
      </section>
      <p className="print-note">开放时间与通行时间采用预设资料，出行前请以官方通知和实时路况为准。</p>
    </section>
  </main>;
}
