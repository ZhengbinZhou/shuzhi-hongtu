"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TdtMiniMap } from "@/components/map/tdt-mini-map";
import { MiniMap } from "@/components/platform-maps";
import { RouteSummary } from "@/components/route/route-summary";
import { getMapEngine, getTiandituTk } from "@/lib/map/engine";
import { dateAt } from "@/lib/planner";
import { plannerDefaults } from "@/lib/planner-query";
import type { Plan } from "@/lib/platform-data";

const STORAGE_KEY="shujing-routes-v2";
const LEGACY_KEY="shujing-routes";
const mapEngine=getMapEngine();
const tiandituTk=getTiandituTk();

function loadRoutes():Plan[]{
  try{
    const current=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");
    if(Array.isArray(current)&&current.length)return current.map((plan:Plan)=>({...plan,criteria:{...plannerDefaults(),...(plan.criteria||{})}}));
    const legacy=JSON.parse(localStorage.getItem(LEGACY_KEY)||"[]");
    if(!Array.isArray(legacy))return [];
    const migrated=legacy.map((plan:Plan)=>({...plan,criteria:{...plannerDefaults(),...(plan.criteria||{})}}));
    if(migrated.length)localStorage.setItem(STORAGE_KEY,JSON.stringify(migrated));
    return migrated;
  }catch{return []}
}

export function SavedRoutesClient(){
  const [routes,setRoutes]=useState<Plan[]>([]);
  const [active,setActive]=useState<Plan|null>(null);
  useEffect(()=>{const timer=window.setTimeout(()=>{const loaded=loadRoutes();setRoutes(loaded);setActive(loaded[0]||null)},0);return()=>window.clearTimeout(timer)},[]);
  const remove=(id:string)=>{
    const next=routes.filter(route=>route.id!==id);
    setRoutes(next);setActive(current=>current?.id===id?(next[0]||null):current);
    localStorage.setItem(STORAGE_KEY,JSON.stringify(next));
  };
  if(!routes.length)return <div className="empty saved-empty"><h2>尚未保存路线</h2><p>在路线详情页确认方案后，可以保存到当前浏览器。</p><Link href="/planner">开始规划路线</Link></div>;
  return <div className="saved-workspace">
    <aside className="saved-sidebar no-print">{routes.map((route,index)=><article className={active?.id===route.id?"active":""} key={route.id}><button onClick={()=>setActive(route)}><small>0{index+1} · {route.spots.length}个点位</small><b>{route.name}</b></button><button className="delete" onClick={()=>remove(route.id)}>删除</button></article>)}</aside>
    {active&&<article className="saved-detail"><div className="plan-title"><div><small>SAVED ROUTE</small><h2>{active.name}</h2><p>{active.reason}</p></div><div className="score"><b>{active.score}</b><span>综合匹配</span></div></div><div className="route-toolbar no-print"><span>{active.criteria.startDate} · {active.criteria.days}天</span><button onClick={()=>window.print()}>打印 / 导出 PDF</button></div>{mapEngine==="tdt"&&tiandituTk?<TdtMiniMap tk={tiandituTk} spots={active.spots} onSelect={spot=>{window.location.href=`/landmarks/${spot.id}`}}/>:<MiniMap plan={active}/>}<RouteSummary spots={active.spots} mode={active.criteria.travelMode ?? "self"}/><div className="days">{active.days.map((day,dayIndex)=><section key={dayIndex}><header><b>DAY {dayIndex+1}</b><span>{dateAt(active.criteria.startDate,dayIndex).toLocaleDateString("zh-CN",{month:"long",day:"numeric",weekday:"short"})}</span></header>{day.map(spot=><Link className="stop saved-stop" key={spot.id} href={`/landmarks/${spot.id}`}><img src={spot.image} alt=""/><span><small>{spot.region} · 建议{spot.minutes}分钟</small><b>{spot.name}</b></span></Link>)}</section>)}</div></article>}
  </div>;
}
