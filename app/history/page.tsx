import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { historyStages, type HistoryStage } from "@/lib/history-data";

export const metadata: Metadata = {
  title: "历史专题路线｜数智-红途",
  description: "按江西红色历史进程组织工运与起义、井冈山道路、中央苏区、长征出发四个专题路线。",
};

const plannerPresets: Record<string, { county: string; days: string; theme1: string; theme2: string; experience: string; purpose: string }> = {
  "stage-01": { county: "安源区", days: "1", theme1: "重大事件", theme2: "群众支前", experience: "现场观察", purpose: "思政学习" },
  "stage-02": { county: "井冈山市", days: "2", theme1: "军事斗争", theme2: "革命精神", experience: "深度讲解", purpose: "社会实践" },
  "stage-03": { county: "瑞金市", days: "3", theme1: "政权建设", theme2: "群众支前", experience: "深度讲解", purpose: "专题调研" },
  "stage-04": { county: "于都县", days: "3", theme1: "长征文化", theme2: "革命精神", experience: "现场观察", purpose: "思政学习" },
};

function imagePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

function plannerHref(stage: HistoryStage) {
  const preset = plannerPresets[stage.id] ?? plannerPresets["stage-04"];
  const params = new URLSearchParams({
    county: preset.county,
    days: preset.days,
    theme1: preset.theme1,
    theme2: preset.theme2,
    experience: preset.experience,
    purpose: preset.purpose,
    travelMode: "charter",
    historyStage: stage.id,
    historySpots: stage.spotIds.join(","),
  });
  return `/planner?${params.toString()}`;
}

export default function HistoryPage() {
  return <main className="page-main history-page">
    <section className="history-hero" id="top">
      <div>
        <p className="kicker">HISTORY TRAIL</p>
        <h1>历史专题路线</h1>
        <p>把江西红色资源按历史进程组织为四个专题：从工人运动与武装起义，到井冈山道路、中央苏区政权建设，再到长征出发与赣南游击战争。每个专题都可以进入现有智能规划继续细化行程。</p>
      </div>
      <div className="history-hero-index">
        {historyStages.map(stage => <a href={`#${stage.id}`} key={stage.id}><b>{stage.number}</b><span>{stage.shortTitle}</span></a>)}
      </div>
    </section>

    <section className="section history-overview">
      <div className="section-head">
        <div><small>04 / SPECIAL TOPICS</small><h2>循着历史的足迹</h2></div>
        <p>章节顺序对应历史线索，点位链接复用当前 44 个景区详情页。</p>
      </div>
      <div className="history-stage-grid">
        {historyStages.map(stage => <a className="history-stage-card" href={`#${stage.id}`} key={stage.id}>
          <img src={imagePath(stage.artwork)} alt={stage.artworkCaption}/>
          <span><small>{stage.period}</small><b>{stage.shortTitle}</b><em>{stage.representative}</em></span>
        </a>)}
      </div>
    </section>

    {historyStages.map(stage => <article className="history-chapter" id={stage.id} key={stage.id}>
      <section className="section history-chapter-inner">
        <header className="chapter-masthead">
          <span>{stage.number}</span>
          <div>
            <small>{stage.period} · {stage.mapStyle}</small>
            <h2>{stage.title}</h2>
            <p className="chapter-title-source">{stage.titleSource}</p>
            <p>{stage.intro}</p>
            <blockquote>“{stage.stageQuote}”<cite>{stage.stageQuoteSource}</cite></blockquote>
            <div className="chapter-actions">
              <Link className="primary" href={plannerHref(stage)}>规划本章路线 <i>→</i></Link>
              <a className="secondary" href="#top">返回顶部</a>
            </div>
          </div>
        </header>

        <div className="chapter-core">
          <section className={`history-map history-map--${stage.mapTheme}`} aria-label={`${stage.shortTitle}景点相对位置`}>
            <div className="history-map-head"><small>{stage.mapStyle}</small><strong>{stage.shortTitle} · 景点相对位置</strong></div>
            <div className="history-map-canvas">
              <img src={imagePath(stage.mapImage)} alt={`${stage.shortTitle}景点相对位置图`}/>
              {stage.mapNodes.map((node, index) => <Link className="history-map-pin" href={`/landmarks/${node.id}`} style={{"--x": `${node.x}%`, "--y": `${node.y}%`} as CSSProperties} title={node.name} key={node.id}><i>{index + 1}</i></Link>)}
              <span className="history-map-north">N</span>
            </div>
            <ol className="history-map-legend">
              {stage.mapNodes.map((node, index) => <li key={node.id}><Link href={`/landmarks/${node.id}`}><i>{index + 1}</i><span><b>{node.name}</b><small>{node.note}</small></span></Link></li>)}
            </ol>
            <p className="history-map-quote">“{stage.mapQuote}”<cite>{stage.mapQuoteSource}</cite></p>
          </section>

          <section className="event-ledger">
            <div className="section-title"><small>HISTORICAL EVENTS</small><h3>阶段事件</h3></div>
            <ol>{stage.events.map(event => <li key={`${stage.id}-${event.year}-${event.title}`}><time>{event.year}</time><div><h4>{event.title}</h4><p>{event.text}</p></div></li>)}</ol>
          </section>
        </div>

        <section className="chapter-spots">
          <div className="section-title"><small>REPRESENTATIVE SITES</small><h3>代表景点</h3></div>
          <div className="history-spot-grid">
            {stage.featuredSpots.map(spot => <Link className="history-spot-card" href={`/landmarks/${spot.id}`} key={spot.id}>
              <img src={imagePath(spot.image)} alt={spot.name}/>
              <span><small>{spot.region}</small><strong>{spot.name}</strong><em>查看景点介绍</em></span>
            </Link>)}
          </div>
        </section>

        <section className="history-qa">
          <div className="section-title"><small>STUDY QUESTIONS</small><h3>研学问答</h3></div>
          <div className="history-qa-grid">
            {stage.qa.slice(0, 4).map(item => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
          </div>
        </section>

        <section className="chapter-sources">
          <small>RELATED READING</small>
          <h3>相关文章与资料</h3>
          <ul>{stage.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}</a></li>)}</ul>
        </section>
      </section>
    </article>)}
  </main>;
}
