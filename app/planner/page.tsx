import type { Metadata } from "next";
import Link from "next/link";
import { counties, experiences, purposes, themeOptions, travelModes } from "@/lib/platform-data";
import { historyStages } from "@/lib/history-data";
import { parsePlannerCriteria } from "@/lib/planner-query";

export const metadata: Metadata = {
  title: "智能规划｜数智-红途",
  description: "选择起始县区、日期、主题与体验偏好，生成江西红色文旅差异化路线。",
};

type Props={searchParams:Promise<Record<string,string|string[]|undefined>>};
export default async function PlannerPage({searchParams}:Props) {
  const rawParams=await searchParams;
  const defaults=parsePlannerCriteria(rawParams);
  const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
  const historyStage=historyStages.find(stage=>stage.id===first(rawParams.historyStage));
  return <main className="page-main planner-main">
    <section className="page-hero"><div><p className="kicker">01 / ROUTE PLANNER</p><h1>告诉我们，你想怎样理解这段历史</h1><p>从出发的那一天起，让历史在行程中徐徐展开。</p></div></section>
    <section className="section planner-page">
      {historyStage&&<aside className="history-transfer">
        <div><small>历史专题 · 第{historyStage.number}章</small><strong>{historyStage.shortTitle}</strong><p>{historyStage.period} · {historyStage.spotIds.length} 个专题点位将随表单带入路线页。</p></div>
        <Link href={`/history#${historyStage.id}`}>返回专题</Link>
      </aside>}
      <form className="planner" action="/routes" method="get">
        {historyStage&&<>
          <input type="hidden" name="historyStage" value={historyStage.id}/>
          <input type="hidden" name="historySpots" value={historyStage.spotIds.join(",")}/>
        </>}
        <div className="form-grid">
          <label><span>起始县区</span><select name="county" defaultValue={defaults.county}>{counties.map(item=><option key={item}>{item}</option>)}</select></label>
          <label><span>出发日期</span><input name="startDate" type="date" defaultValue={defaults.startDate}/></label>
          <label><span>游览天数</span><select name="days" defaultValue={defaults.days}>{[1,2,3,4,5].map(day=><option key={day} value={day}>{day}天</option>)}</select></label>
          <label><span>实践目的</span><select name="purpose" defaultValue={defaults.purpose}>{purposes.map(item=><option key={item}>{item}</option>)}</select></label>
        </div>
        <div className="choice-row">
          <fieldset><legend>优先内容</legend>{themeOptions.map(item=><label className="choice-chip" key={item}><input type="radio" name="theme1" value={item} defaultChecked={item===defaults.theme1}/><span>{item}</span></label>)}</fieldset>
          <fieldset><legend>补充内容</legend>{themeOptions.map(item=><label className="choice-chip" key={item}><input type="radio" name="theme2" value={item} defaultChecked={item===defaults.theme2}/><span>{item}</span></label>)}</fieldset>
          <fieldset><legend>体验偏好</legend>{experiences.map(item=><label className="choice-chip" key={item}><input type="radio" name="experience" value={item} defaultChecked={item===defaults.experience}/><span>{item}</span></label>)}</fieldset>
        </div>
        <fieldset className="travel-row">
          <legend>交通方式</legend>
          <div className="travel-options">
            {travelModes.map(item=><label className="travel-chip" key={item.value}><input type="radio" name="travelMode" value={item.value} defaultChecked={item.value===defaults.travelMode}/><span><b>{item.label}</b><small>{item.note}</small></span></label>)}
          </div>
        </fieldset>
        <button className="generate" type="submit"><span>开始生成路线</span><i>→</i></button>
      </form>
    </section>
  </main>;
}
