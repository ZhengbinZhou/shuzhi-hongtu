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
function displayRouteName(name:string){return name.replace(/·/g,"—");}
function formatDate(date:string){
  const [year,month,day]=date.split("-").map(Number);
  if(!year||!month||!day)return `${date}启程`;
  return `${year} 年 ${month} 月 ${day} 日启程`;
}
function dayText(days:number){return ["","一日","两日","三日","四日","五日"][days]??`${days}日`;}
function themeTrail(theme:string){
  const map:Record<string,string>={
    长征文化:"循长征记忆而行",
    重要人物:"循人物故事而行",
    重大事件:"循重大事件而行",
    军事斗争:"循烽火战事而行",
    群众支前:"循群众记忆而行",
    政权建设:"循苏区政权足迹而行",
    革命精神:"循革命精神而行",
  };
  return map[theme]??`循${theme}而行`;
}
function experienceText(experience:string){
  const map:Record<string,string>={
    现场观察:"重在现场体察",
    深度讲解:"重在深入理解",
    互动体验:"重在参与体验",
    轻松参观:"重在从容参观",
  };
  return map[experience]??`重在${experience}`;
}
export default async function RoutesPage({searchParams}:Props) {
  const rawParams=await searchParams;
  const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
  const criteria=parsePlannerCriteria(rawParams);
  const historyStage=historyStages.find(stage=>stage.id===first(rawParams.historyStage));
  const historySpotIds=(first(rawParams.historySpots)||"").split(",").filter(Boolean);
  const historyRouteSpots=(historySpotIds.length?historySpotIds:historyStage?.spotIds??[]).map(id=>spots.find(spot=>spot.id===id)).filter(Boolean);
  const plans=generatePlans(criteria.county,criteria.startDate,criteria.days,criteria.theme1,criteria.theme2,criteria.experience,criteria.purpose,criteria.travelMode);
  const travelModeLabel=travelModes.find(item=>item.value===criteria.travelMode)?.label ?? "自驾";
  const criteriaText=`${formatDate(criteria.startDate)} · ${dayText(criteria.days)}${travelModeLabel} · ${themeTrail(criteria.theme1)} · ${experienceText(criteria.experience)}`;
  return <main className="page-main">
    <section className="page-hero compact"><div><p className="kicker">02 / RECOMMENDATIONS</p><h1>为你生成了 {plans.length} 条差异化路线</h1><p>{criteriaText}</p></div><Link className="secondary light-link" href={`/planner?${plannerQuery(criteria)}`}>重新规划</Link></section>
    <section className="section routes-page">
      {historyStage&&<div className="history-route-summary">
        <span className="route-number">{historyStage.number}</span>
        <div><small>历史专题</small><h2>{historyStage.shortTitle}</h2><p>{historyStage.intro}</p><div className="route-meta"><span>{criteria.days}天</span><span>{historyRouteSpots.length}个专题点位</span><span>{historyStage.period}</span></div></div>
        <div className="route-score"><b>{historyRouteSpots.length}</b><small>专题点位</small><Link href={`/history#${historyStage.id}`}>查看专题 →</Link></div>
      </div>}
      <div className="route-list">{plans.map((plan,index)=><article key={plan.id}>
        <span className="route-number">0{index+1}</span>
        <div><small>{plan.angle}</small><h2>{displayRouteName(plan.name)}</h2><div className="route-meta"><span>{plan.days.length}天</span><span>{plan.spots.length}个点位</span><span>{plan.spots.map(spot=>spot.region).filter((item,i,list)=>list.indexOf(item)===i).join(" · ")}</span></div></div>
        <div className="route-score"><b>{plan.score}</b><small>综合匹配</small><Link href={planHref(plan.id,criteria)}>查看详情 →</Link></div>
      </article>)}</div>
      {!plans.length&&<div className="empty"><p>当前条件下没有满足约束的路线。</p><Link href="/planner">调整规划条件</Link></div>}
    </section>
  </main>;
}
