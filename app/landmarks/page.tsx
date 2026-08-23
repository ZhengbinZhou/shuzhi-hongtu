import type { Metadata } from "next";
import Link from "next/link";
import { regions, spots } from "@/lib/platform-data";

export const metadata: Metadata = {
  title: "红色点位图鉴｜数智-红途",
  description: "浏览江西全省44个红色文化点位的区域、主题、参观时长与简介。",
};

type Props={searchParams:Promise<{region?:string|string[]}>};
export default async function LandmarksPage({searchParams}:Props) {
  const value=(await searchParams).region;
  const region=Array.isArray(value)?value[0]:value||"全部";
  const filtered=spots.filter(spot=>region==="全部"||spot.region===region);
  return <main className="page-main">
    <section className="page-hero compact"><div><p className="kicker">03 / RED LANDMARKS</p><h1>44个红色点位，构成全省路线的数据底座</h1><p>按区域浏览点位，每个点位均有独立详情、内容维度和参观提示。</p></div></section>
    <section className="section atlas-page">
      <nav className="atlas-filters" aria-label="点位地区筛选">{regions.map(item=><Link key={item} className={region===item?"active":""} href={item==="全部"?"/landmarks":`/landmarks?region=${encodeURIComponent(item)}`}>{item}</Link>)}</nav>
      <p className="result-count">当前展示 {filtered.length} 个点位</p>
      <div className="spot-grid">{filtered.map(spot=><Link className="spot-card" key={spot.id} href={`/landmarks/${spot.id}`}><img src={spot.image} alt=""/><span><small>{spot.region} · {spot.county} · {spot.core?"核心节点":"辅助点位"}</small><b>{spot.name}</b><em>{Object.entries(spot.themes).sort((a,b)=>b[1]-a[1]).slice(0,2).map(item=>item[0]).join(" · ")}</em></span></Link>)}</div>
    </section>
  </main>;
}
