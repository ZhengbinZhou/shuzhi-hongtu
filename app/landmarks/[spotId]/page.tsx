import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { spots } from "@/lib/platform-data";
import { spotDetails } from "@/lib/spot-details";

type Props={params:Promise<{spotId:string}>};
export function generateStaticParams(){return spots.map(spot=>({spotId:spot.id}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {spotId}=await params;
  const spot=spots.find(item=>item.id===spotId);
  if(!spot)return {title:"点位未找到｜数智-红途"};
  const detail=spotDetails[spot.id];
  const description=detail?.description??spot.intro;
  return {title:`${spot.name}｜数智-红途`,description,openGraph:{title:spot.name,description,images:[]},twitter:{title:spot.name,description,images:[]}};
}

export default async function LandmarkDetailPage({params}:Props){
  const {spotId}=await params;
  const spot=spots.find(item=>item.id===spotId);
  if(!spot)notFound();
  const detail=spotDetails[spot.id];
  const related=spots.filter(item=>item.id!==spot.id&&item.region===spot.region).slice(0,3);
  return <main className="page-main landmark-detail">
    <section className="landmark-cover"><img src={spot.image} alt={spot.name}/><div><p className="kicker">{spot.region} · {spot.county}</p><h1>{spot.name}</h1><p>{spot.intro}</p><dl><div><dt>建议停留</dt><dd>{spot.minutes}分钟</dd></div><div><dt>节点属性</dt><dd>{spot.core?"核心历史节点":"辅助体验点位"}</dd></div><div><dt>固定闭馆</dt><dd>{spot.closed.length?"星期一":"暂无固定闭馆日"}</dd></div></dl></div></section>
    <section className="section landmark-body">
      <Link className="back-link no-print" href={`/landmarks?region=${encodeURIComponent(spot.region)}`}>← 返回{spot.region}点位</Link>
      {detail&&<div className="visit-panel">
        <div className="visit-summary">
          <small>VISIT INFO</small>
          <h2>参观信息</h2>
          <p>{detail.description}</p>
          <em>资料核验：{detail.verificationLevel} · {detail.verifiedAt}</em>
        </div>
        <div className="visit-list">
          <div><span>详细地址</span><b>{detail.address}</b></div>
          <div><span>开放时间</span><b>{detail.openingHours}</b></div>
          <div><span>开放性质</span><b>{detail.openNote}</b></div>
          <div><span>预约要求</span><b>{detail.reservationRequired}</b></div>
          <div><span>预约方式</span><b>{detail.reservationMethod}</b>{detail.reservationUrl&&<a className="visit-link" href={detail.reservationUrl} target="_blank" rel="noreferrer">打开预约入口</a>}</div>
          {detail.officialUrl&&<div><span>官方信息</span><a className="visit-link" href={detail.officialUrl} target="_blank" rel="noreferrer">查看官方页面</a></div>}
          {detail.sourceUrl&&<div><span>补充来源</span><a className="visit-link" href={detail.sourceUrl} target="_blank" rel="noreferrer">查看补充来源</a></div>}
          <div className="visit-note"><span>核验备注</span><b>{detail.verificationNote}</b></div>
        </div>
      </div>}
      <div className="dimension-panel"><div><small>CONTENT DIMENSIONS</small><h2>内容维度</h2><p>评分用于路线匹配，不代表点位的历史价值排序。</p></div><div className="dimension-list">{Object.entries(spot.themes).map(([label,value])=><div key={label}><span>{label}</span><i><b style={{width:`${value*20}%`}}/></i><em>{value}/5</em></div>)}</div></div>
      {related.length>0&&<div className="related"><h2>同区域点位</h2><div className="spot-grid">{related.map(item=><Link className="spot-card" href={`/landmarks/${item.id}`} key={item.id}><img src={item.image} alt=""/><span><small>{item.county}</small><b>{item.name}</b><em>建议停留 {item.minutes} 分钟</em></span></Link>)}</div></div>}
      <p className="print-note">开放信息为演示期静态资料，出行前请核验官方通知。</p>
    </section>
  </main>;
}
