import Link from "next/link";
import { JIANGXI_BOUNDS } from "@/app/jiangxi-map";
import { JIANGXI_COUNTIES } from "@/app/jiangxi-counties";
import { TdtHeroMap, type CountyPoint, type ScenicPoint } from "@/components/map/tdt-hero-map";
import { HeroMap } from "@/components/platform-maps";
import { getMapEngine, getTiandituTk } from "@/lib/map/engine";
import { spots } from "@/lib/platform-data";

const featured = ["Y01","J01","R01","N01"].map(id=>spots.find(spot=>spot.id===id)!).filter(Boolean);
const mapEngine = getMapEngine();
const tiandituTk = getTiandituTk();
function svgPointToLngLat(x: number, y: number): [number, number] {
  const { minLng, maxLng, minLat, maxLat, width, height } = JIANGXI_BOUNDS;
  return [
    minLng + (x / width) * (maxLng - minLng),
    maxLat - (y / height) * (maxLat - minLat),
  ];
}
function pathToRings(path: string): [number, number][][] {
  const tokens = path.match(/[MLZ]|-?\d+(?:\.\d+)?/g) ?? [];
  const rings: [number, number][][] = [];
  let ring: [number, number][] = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === "M") {
      if (ring.length >= 3) rings.push(ring);
      ring = [];
      const x = Number(tokens[++i]);
      const y = Number(tokens[++i]);
      if (Number.isFinite(x) && Number.isFinite(y)) ring.push(svgPointToLngLat(x, y));
      continue;
    }
    if (token === "L") {
      const x = Number(tokens[++i]);
      const y = Number(tokens[++i]);
      if (Number.isFinite(x) && Number.isFinite(y)) ring.push(svgPointToLngLat(x, y));
      continue;
    }
    if (token === "Z") {
      if (ring.length >= 3) rings.push(ring);
      ring = [];
    }
  }
  if (ring.length >= 3) rings.push(ring);
  return rings;
}

const countyPoints: CountyPoint[] = Array.from(
  spots.reduce((map, spot) => {
    if (map.has(spot.county)) {
      const existing = map.get(spot.county)!;
      existing.count += 1;
      return map;
    }
    const county = JIANGXI_COUNTIES.find(item => item.name === spot.county);
    const [lng, lat] = county ? svgPointToLngLat(county.x, county.y) : [spot.lng, spot.lat];
    map.set(spot.county, { name: spot.county, lng, lat, rings: county ? pathToRings(county.d) : [], count: 1 });
    return map;
  }, new Map<string, CountyPoint>()).values(),
);
const scenicPoints: ScenicPoint[] = spots.map(spot => ({
  id: spot.id,
  name: spot.name,
  short: spot.short,
  county: spot.county,
  lng: spot.lng,
  lat: spot.lat,
  core: spot.core,
}));

export default function Home() {
  const renderHeroMap = () => mapEngine==="tdt"?<TdtHeroMap tk={tiandituTk} counties={countyPoints} spots={scenicPoints}/>:<HeroMap/>;

  return <main className="home-fullpage">
    <section className="home-panel landing-panel">
      <div className="landing-bg" aria-hidden="true">
        <span className="gold-thread thread-a"/>
        <span className="gold-thread thread-b"/>
        <span className="gold-thread thread-c"/>
        <span className="star-glow"/>
        <span className="star-emblem"/>
      </div>
      <div className="landing-copy">
        <p className="kicker">JIANGXI RED CULTURE ROUTE PLATFORM</p>
        <h1>让革命史诗，跃然纸上</h1>
        <p>面向政府文旅、红色文旅企业与培训基地的江西省红色文旅路线规划平台</p>
        <div className="hero-actions"><Link className="primary" href="/planner">生成路线方案 <i>→</i></Link><Link className="secondary" href="/history">查看历史专题</Link></div>
      </div>
      <div className="scroll-cue" aria-hidden="true"><span/>向下翻页</div>
    </section>
    <section className="home-panel hero">
      <div className="hero-copy">
        <p className="kicker">江西红色记忆，循迹而行</p>
        <h1><span className="hero-line">寻历史脉络，走一条真正</span><span className="hero-line accent">适合你的红色路线</span></h1>
        <div className="hero-art hero-art-mobile">{renderHeroMap()}</div>
        <p className="lead">从井冈山到于都，从安源到瑞金。平台梳理江西 44 处红色地标的史料、预约方式、开放时间等信息，结合你的出发时间和关注主题，为你规划恰如其分的行程。</p>
        <div className="hero-actions"><Link className="primary" href="/planner">生成个性化路线 <i>→</i></Link><Link className="secondary" href="/landmarks">浏览红色点位</Link></div>
        <div className="hero-stats"><span><b>44</b> 个点位</span><span><b>10</b> 个红色区域</span><span><b>5</b> 条差异方案</span></div>
      </div>
      <div className="hero-art hero-art-desktop">{renderHeroMap()}</div>
    </section>
    <section className="home-panel section home-intro">
      <div className="section-head"><div><small>01 / SMART JOURNEY</small><h2>既抵达一处旧址，也读懂它所见证的年代</h2></div></div>
      <div className="entry-grid">
        <Link href="/planner"><span>01</span><h3>智能规划</h3><p>根据你的需求，安排一段从容可行的行程。</p><b>开始规划 →</b></Link>
        <Link href="/routes"><span>02</span><h3>推荐路线</h3><p>差异化路线中，选择最适合此行的方案。</p><b>查看路线 →</b></Link>
        <Link href="/history"><span>03</span><h3>历史专题</h3><p>循着时间回望四个专题，不只有专题路线。</p><b>进入专题 →</b></Link>
        <Link href="/landmarks"><span>04</span><h3>点位图鉴</h3><p>按地域分类的 44 处红色地标，了解它们各具特色的信息。</p><b>浏览图鉴 →</b></Link>
      </div>
    </section>
    <section className="home-panel section featured-section">
      <div className="section-head"><div><small>02 / FEATURED LANDMARKS</small><h2>从几处旧址，走进江西红色历史</h2></div><p>每个点位都有独立详情页，可直接分享、返回和打印。</p></div>
      <div className="spot-grid">{featured.map(spot=><Link className="spot-card" key={spot.id} href={`/landmarks/${spot.id}`}><img src={spot.image} alt=""/><span><small>{spot.region} · {spot.county}</small><b>{spot.name}</b><em>{spot.intro.slice(0,42)}……</em></span></Link>)}</div>
    </section>
    <section className="home-panel method"><div><small>我们的匹配逻辑</small><h2>不以热度决定，让行程回应你的需求。</h2><div className="method-grid"><span><b>01</b>可行性过滤<em>先看行程可行性，再综合纳入考虑多种因素。</em></span><span><b>02</b>内容匹配<em>优先呈现你最想深入的内容。</em></span><span><b>03</b>历史校验<em>保留主题下的核心景区，确保基本叙事体验</em></span><span><b>04</b>差异化去重<em>每一条路线都有其独特的观察重点</em></span></div><Link className="text-link" href="/methodology">查看完整方法说明 →</Link></div></section>
  </main>;
}
