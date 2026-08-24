import { useEffect, useMemo, useState } from "react";
import { HeroMap, MiniMap } from "../components/platform-maps";
import { counties, experiences, purposes, regions, spots, themeOptions, type Plan, type Spot, type Theme } from "../lib/platform-data";
import { buildRouteServices, dateAt, generatePlans, pointFit, splitDays } from "../lib/planner";

export default function OfflineApp(){
  const [county,setCounty]=useState("于都县");
  const [startDate,setStartDate]=useState(new Date().toISOString().slice(0,10));
  const [days,setDays]=useState(2);
  const [theme1,setTheme1]=useState<Theme>("长征文化");
  const [theme2,setTheme2]=useState<Theme>("群众支前");
  const [experience,setExperience]=useState("现场观察");
  const [purpose,setPurpose]=useState("社会实践");
  const [plans,setPlans]=useState<Plan[]>([]);
  const [active,setActive]=useState<Plan|null>(null);
  const [selectedSpot,setSelectedSpot]=useState<Spot|null>(null);
  const [saved,setSaved]=useState<Plan[]>([]);
  const [atlasRegion,setAtlasRegion]=useState("全部");
  useEffect(()=>{const timer=window.setTimeout(()=>{try{setSaved(JSON.parse(localStorage.getItem("shujing-routes")||"[]"))}catch{}},0);return()=>window.clearTimeout(timer)},[]);
  const preset=useMemo(()=>generatePlans("于都县",startDate,1,"长征文化","群众支前","现场观察","思政学习")[0],[startDate]);
  const run=()=>{const next=generatePlans(county,startDate,days,theme1,theme2,experience,purpose);setPlans(next);setActive(next[0]||null);setTimeout(()=>document.querySelector("#results")?.scrollIntoView({behavior:"smooth"}),50)};
  const save=()=>{if(!active)return;const next=[{...active,id:`saved-${Date.now()}`},...saved].slice(0,12);setSaved(next);localStorage.setItem("shujing-routes",JSON.stringify(next));};
  const updateSpots=(next:Spot[])=>setActive(active?{...active,spots:next,days:splitDays(next,days,startDate),services:buildRouteServices(next),score:Math.max(60,active.score-1)}:null);
  const move=(i:number,dir:number)=>{if(!active)return;const next=[...active.spots],j=i+dir;if(j<0||j>=next.length)return;[next[i],next[j]]=[next[j],next[i]];updateSpots(next)};
  const swap=(i:number)=>{if(!active)return;const old=active.spots[i];const candidate=spots.filter(s=>s.region===old.region&&!active.spots.some(x=>x.id===s.id)&&!s.core).sort((a,b)=>pointFit(b,theme1,theme2,experience)-pointFit(a,theme1,theme2,experience))[0];if(candidate){const next=[...active.spots];next[i]=candidate;updateSpots(next)}};
  const activeServices=active ? active.services ?? buildRouteServices(active.spots) : null;
  return <main className="offline-app">
    <header className="topbar"><a className="brand" href="#top"><span className="seal">智</span><span><b>数智-红途</b><small>红色文旅智能导览平台</small></span></a><nav><a href="#planner">智能规划</a><a href="#results">推荐路线</a><a href="#atlas">点位图鉴</a><a href="#saved">我的路线</a></nav><button className="nav-cta print-button" onClick={()=>window.print()}>打印导览</button></header>
    <section className="hero" id="top">
      <div className="hero-copy"><p className="kicker">赣鄱热土 · 红色摇篮 · 数智新途</p><h1><span className="hero-line">寻历史脉络，走一条真正</span><span className="hero-line accent">适合你的红色路线</span></h1><p className="lead">基于江西全省44个红色点位的内容评分与公开资料，将游客目的、内容偏好、开放时间和预设通行时间转化为可解释、可调整的路线方案。</p><div className="hero-actions"><a className="primary" href="#planner">生成个性化路线 <i>→</i></a><a className="secondary" href="#atlas">浏览红色点位</a></div><div className="hero-stats"><span><b>44</b> 个点位</span><span><b>10</b> 个红色区域</span><span><b>5</b> 条差异方案</span></div></div>
      <div className="hero-art"><HeroMap/></div>
    </section>
    <section className="mobile-only mobile-guide"><p>手机端完整模式</p><h2>规划、浏览与打印均可使用</h2><p>离线版已开放个性化生成、路线编辑和点位浏览；建议使用电脑打印 A4 导览。</p>{preset&&<button className="primary" onClick={()=>{setPlans([preset]);setActive(preset)}}>查看预置路线</button>}</section>
    <section className="section" id="planner">
      <div className="section-head"><div><small>01 / ROUTE PLANNER</small><h2>告诉我们，你想怎样理解这段历史</h2></div><p>先判断行程是否可完成，再从可行方案中选择需求匹配度最高的路线。</p></div>
      <div className="planner">
        <div className="form-grid">
          <label><span>起始县区</span><select value={county} onChange={e=>setCounty(e.target.value)}>{counties.map(x=><option key={x}>{x}</option>)}</select><small>覆盖全省已收录点位县区，用于优先确定首站</small></label>
          <label><span>出发日期</span><input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}/><small>用于识别固定闭馆日</small></label>
          <label><span>游览天数</span><select value={days} onChange={e=>setDays(+e.target.value)}><option value={1}>1天</option><option value={2}>2天</option><option value={3}>3天</option><option value={4}>4天</option><option value={5}>5天</option></select><small>跨市路线建议选择3—5天；每日预设 08:30—17:30</small></label>
          <label><span>实践目的</span><select value={purpose} onChange={e=>setPurpose(e.target.value)}>{purposes.map(x=><option key={x}>{x}</option>)}</select><small>影响路线推荐理由与任务设计</small></label>
        </div>
        <div className="choice-row"><div><b>优先内容</b>{themeOptions.map(x=><button key={x} className={theme1===x?"active":""} onClick={()=>setTheme1(x)}>{x}</button>)}</div><div><b>补充内容</b>{themeOptions.map(x=><button key={x} className={theme2===x?"active":""} onClick={()=>setTheme2(x)}>{x}</button>)}</div><div><b>体验偏好</b>{experiences.map(x=><button key={x} className={experience===x?"active":""} onClick={()=>setExperience(x)}>{x}</button>)}</div></div>
        <button className="generate" onClick={run}><span>开始生成路线</span><small>综合需求权重 · 点位评分 · 通行时间 · 开放约束</small><i>→</i></button>
      </div>
    </section>
    <section className={`results ${plans.length?"show":""} `} id="results">
      <div className="section results-inner"><div className="section-head light"><div><small>02 / RECOMMENDATIONS</small><h2>{plans.length?`为你生成 ${plans.length} 条差异化路线`:"个性化推荐将在这里呈现"}</h2></div><p>{plans.length?"按综合得分排序；若约束过严，只展示实际可行方案。":"完成上方选择后生成路线。"}</p></div>
        {plans.length>0&&<div className="result-layout"><div className="plan-tabs">{plans.map((p,i)=><button key={p.id} className={active?.id===p.id?"active":""} onClick={()=>setActive(p)}><span>0{i+1}</span><div><small>{p.angle}</small><b>{p.name}</b></div><strong>{p.score}<em>分</em></strong></button>)}</div>
        {active&&<article className="plan-detail"><div className="plan-title"><div><small>综合推荐方案</small><h3>{active.name}</h3><p>{active.reason}</p></div><div className="score"><b>{active.score}</b><span>综合匹配</span></div></div><div className="bars">{active.dimensions.map(d=><div key={d.label}><span>{d.label}</span><i><b style={{width:`${d.value}%`}}/></i><em>{d.value}%</em></div>)}</div><section className="route-context"><div><small>BACKGROUND</small><h2>路线背景</h2></div><p>{active.background}</p></section><MiniMap plan={active}/>
          <div className="days">{active.days.map((day,di)=><section key={di}><header><b>DAY {di+1}</b><span>{dateAt(startDate,di).toLocaleDateString("zh-CN",{month:"long",day:"numeric",weekday:"short"})}</span></header>{day.map(s=>{const index=active.spots.findIndex(x=>x.id===s.id);return <div className="stop" key={s.id}><button className="spot-open" onClick={()=>setSelectedSpot(s)}><img src={s.image} alt=""/><span><small>{s.region} · 建议{s.minutes}分钟</small><b>{s.name}</b><em>{s.core?"核心历史节点":"辅助体验点位"}</em></span></button><div className="edit-actions"><button onClick={()=>move(index,-1)} aria-label="上移">↑</button><button onClick={()=>move(index,1)} aria-label="下移">↓</button>{!s.core&&<><button onClick={()=>swap(index)}>替换</button><button onClick={()=>updateSpots(active.spots.filter(x=>x.id!==s.id))}>删除</button></>}</div></div>})}</section>)}</div>
          {activeServices&&<section className="route-services"><div className="service-column"><small>STAY</small><h2>住宿参考</h2>{activeServices.hotels.map(link=><a key={link.href} href={link.href} target="_blank" rel="noreferrer"><b>{link.label}</b><span>{link.note}</span></a>)}</div><div className="service-column"><small>TRANSFER</small><h2>包车与接驳</h2>{activeServices.charters.map(link=><a key={link.href} href={link.href} target="_blank" rel="noreferrer"><b>{link.label}</b><span>{link.note}</span></a>)}</div></section>}
          <div className="plan-actions"><button onClick={save}>保存到“我的路线”</button><button onClick={()=>window.print()}>打印 / 导出 PDF</button><span>路线修改后会重新校验日期与时间；核心历史节点不可删除。</span></div>
        </article>}</div>}</div>
    </section>
    <section className="section atlas" id="atlas"><div className="section-head"><div><small>03 / RED LANDMARKS</small><h2>44个红色点位，构成全省路线的数据底座</h2></div><p>覆盖井冈山、于都、瑞金、南昌、安源、上饶等区域；点开查看主题、停留时间与简介。</p></div><div className="atlas-filters">{regions.map(x=><button key={x} className={atlasRegion===x?"active":""} onClick={()=>setAtlasRegion(x)}>{x}</button>)}</div><div className="spot-grid">{spots.filter(s=>atlasRegion==="全部"||s.region===atlasRegion).map(s=><button key={s.id} onClick={()=>setSelectedSpot(s)}><img src={s.image} alt=""/><span><small>{s.region} · {s.county} · {s.core?"核心节点":"辅助点位"}</small><b>{s.name}</b><em>{Object.entries(s.themes).sort((a,b)=>b[1]-a[1]).slice(0,2).map(x=>x[0]).join(" · ")}</em></span></button>)}</div></section>
    <section className="saved-band" id="saved"><div className="section"><div className="section-head light"><div><small>04 / MY ROUTES</small><h2>保存在当前浏览器中的路线</h2></div><p>无需登录；刷新或下次打开仍可继续查看。</p></div>{saved.length?<div className="saved-list">{saved.map((p,i)=><article key={p.id}><span>0{i+1}</span><div><small>{p.spots.length}个点位 · {p.days.length}天</small><b>{p.name}</b></div><button onClick={()=>{setActive(p);setPlans([p]);location.hash="results"}}>继续查看</button><button onClick={()=>{const n=saved.filter(x=>x.id!==p.id);setSaved(n);localStorage.setItem("shujing-routes",JSON.stringify(n))}}>删除</button></article>)}</div>:<p className="empty">尚未保存路线。生成并确认方案后，可在路线详情底部保存。</p>}</div></section>
    <section className="method"><div><small>我们的匹配逻辑</small><h2>不是“热门榜单”，而是需求与红色内容的双向匹配</h2><div className="method-grid"><span><b>01</b>可行性过滤<em>日期、开放时间、参观时长与预设通行时间</em></span><span><b>02</b>内容匹配<em>7类红色文化主题评分与游客偏好权重</em></span><span><b>03</b>历史校验<em>保留主题核心节点与基本叙事顺序</em></span><span><b>04</b>差异化去重<em>避免5条路线只有少量点位变化</em></span></div><p>当前为社会实践成果演示网页。开放时间与通行时间采用预设资料，临时闭馆、节假日调整及实时路况请在出行前以官方通知为准。</p></div></section>
    <footer><div className="brand inverse"><span className="seal">智</span><span><b>数智-红途</b><small>让红色历史在行走中被理解</small></span></div><p>青年红色实践智导平台 · 江西全省</p></footer>
    {selectedSpot&&<div className="drawer-backdrop" onClick={()=>setSelectedSpot(null)}><aside className="drawer" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setSelectedSpot(null)}>×</button><img src={selectedSpot.image} alt={selectedSpot.name}/><div><small>{selectedSpot.region} · {selectedSpot.county}</small><h2>{selectedSpot.name}</h2><p>{selectedSpot.intro}</p><dl><div><dt>建议停留</dt><dd>{selectedSpot.minutes}分钟</dd></div><div><dt>节点属性</dt><dd>{selectedSpot.core?"核心历史节点":"辅助体验点位"}</dd></div></dl><h3>内容维度</h3>{Object.entries(selectedSpot.themes).map(([k,v])=><span className="theme-chip" key={k}>{k} {v}/5</span>)}<p className="notice">开放信息为演示期静态资料，出行前请核验官方通知。</p></div></aside></div>}
  </main>
}
