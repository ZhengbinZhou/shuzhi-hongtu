import type { Metadata } from "next";
import Link from "next/link";
import { generatePlans } from "@/lib/planner";
import { historyStages } from "@/lib/history-data";
import { parsePlannerCriteria, planHref, plannerQuery } from "@/lib/planner-query";
import { spots, travelModes } from "@/lib/platform-data";

export const metadata: Metadata = {
  title: "推荐路线｜数智-红途",
  description: "查看根据日期、主题、体验偏好和通行约束生成的江西红色文旅推荐路线。",
};

type Props={searchParams:Promise<Record<string,string|string[]|undefined>>};
export default async function RoutesPage({searchParams}:Props) {
  const rawParams=await searchParams;
  const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
  const criteria=parsePlannerCriteria(rawParams);
  const historyStage=historyStages.find(stage=>stage.id===first(rawParams.historyStage));
  const historySpotIds=(first(rawParams.historySpots)||"").split(",").filter(Boolean);
  const historyRouteSpots=(historySpotIds.length?historySpotIds:historyStage?.spotIds??[]).map(id=>spots.find(spot=>spot.id===id)).filter(Boolean);
  const plans=generatePlans(criteria.county,criteria.startDate,criteria.days,criteria.theme1,criteria.theme2,criteria.experience,criteria.purpose,criteria.travelMode);
  const travelModeLabel=travelModes.find(item=>item.value===criteria.travelMode)?.label ?? "自驾";
  return <main className="page-main">
    <section className="page-hero compact"><div><p className="kicker">02 / RECOMMENDATIONS</p><h1>为你生成 {plans.length} 条差异化路线</h1><p>{criteria.startDate} 出发 · {criteria.days}天 · {travelModeLabel} · {criteria.theme1}优先 · {criteria.experience}</p></div><Link className="secondary light-link" href={`/planner?${plannerQuery(criteria)}`}>重新规划</Link></section>
    <section className="section routes-page">
      {historyStage&&<div className="history-route-summary">
        <span className="route-number">{historyStage.number}</span>
        <div><small>历史专题路线</small><h2>{historyStage.shortTitle}</h2><p>{historyStage.intro}</p><div className="route-meta"><span>{criteria.days}天</span><span>{historyRouteSpots.length}个专题点位</span><span>{historyStage.period}</span></div></div>
        <div className="route-score"><b>{historyRouteSpots.length}</b><small>专题点位</small><Link href={`/history#${historyStage.id}`}>查看专题 →</Link></div>
      </div>}
      <div className="route-list">{plans.map((plan,index)=><article key={plan.id}>
        <span className="route-number">0{index+1}</span>
        <div><small>{plan.angle}</small><h2>{plan.name}</h2><p>{plan.reason}</p><div className="route-meta"><span>{plan.days.length}天</span><span>{plan.spots.length}个点位</span><span>{plan.spots.map(spot=>spot.region).filter((item,i,list)=>list.indexOf(item)===i).join(" · ")}</span></div></div>
        <div className="route-score"><b>{plan.score}</b><small>综合匹配</small><Link href={planHref(plan.id,criteria)}>查看详情 →</Link></div>
      </article>)}</div>
      {!plans.length&&<div className="empty"><p>当前条件下没有满足约束的路线。</p><Link href="/planner">调整规划条件</Link></div>}
    </section>
  </main>;
}
