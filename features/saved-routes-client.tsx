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
function displayRouteName(name:string){return name.replace(/·/g,"—");}

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
  const [activeIndex,setActiveIndex]=useState(0);
  const [detailVersion,setDetailVersion]=useState(0);
  const active=routes[activeIndex]??routes[0]??null;
  const activeKey=active?`${active.id}-${activeIndex}-${detailVersion}`:"";
  useEffect(()=>{const timer=window.setTimeout(()=>{const loaded=loadRoutes();setRoutes(loaded);setActiveIndex(0);setDetailVersion(version=>version+1)},0);return()=>window.clearTimeout(timer)},[]);
  const select=(index:number)=>{
    setActiveIndex(index);
    setDetailVersion(version=>version+1);
  };
  const remove=(index:number)=>{
    const next=routes.filter((_,routeIndex)=>routeIndex!==index);
    setRoutes(next);setActiveIndex(current=>{
      if(!next.length)return 0;
      if(current===index)return Math.min(index,next.length-1);
      return current>index?current-1:current;
    });
    localStorage.setItem(STORAGE_KEY,JSON.stringify(next));
  };
  if(!routes.length)return <div className="empty saved-empty"><h2>尚未保存路线</h2><p>在路线详情页确认方案后，可以保存到当前浏览器。</p><Link href="/planner">开始规划路线</Link></div>;
  return <div className="saved-workspace">
    <aside className="saved-sidebar no-print">{routes.map((route,index)=><article className={activeIndex===index?"active":""} key={`${route.id}-${index}`}><button type="button" onClick={()=>select(index)}><small>0{index+1} · {route.spots.length}个点位</small><b>{route.name}</b></button><button type="button" className="delete" onClick={()=>remove(index)}>删除</button></article>)}</aside>
    {active&&<SavedRouteDetail key={activeKey} route={active} routeKey={activeKey}/>}
  </div>;
}

function SavedRouteDetail({route,routeKey}:{route:Plan;routeKey:string}){
  return <article className="saved-detail"><div className="plan-title"><div><small>SAVED ROUTE</small><h2>{displayRouteName(route.name)}</h2></div><div className="score"><b>{route.score}</b><span>综合匹配</span></div></div><div className="route-toolbar no-print"><span>{route.criteria.startDate} · {route.criteria.days}天</span><button type="button" onClick={()=>window.print()}>打印 / 导出 PDF</button></div>{mapEngine==="tdt"&&tiandituTk?<TdtMiniMap key={`map-${routeKey}`} tk={tiandituTk} spots={route.spots} onSelect={spot=>{window.location.href=`/landmarks/${spot.id}`}}/>:<MiniMap plan={route}/>}<RouteSummary key={`summary-${routeKey}`} spots={route.spots} mode={route.criteria.travelMode ?? "self"}/><div className="days">{route.days.map((day,dayIndex)=><section key={`${routeKey}-${dayIndex}`}><header><b>DAY {dayIndex+1}</b><span>{dateAt(route.criteria.startDate,dayIndex).toLocaleDateString("zh-CN",{month:"long",day:"numeric",weekday:"short"})}</span></header>{day.map(spot=><Link className="stop saved-stop" key={spot.id} href={`/landmarks/${spot.id}`}><img src={spot.image} alt=""/><span><small>{spot.region} · 建议{spot.minutes}分钟</small><b>{spot.name}</b></span></Link>)}</section>)}</div></article>;
}
