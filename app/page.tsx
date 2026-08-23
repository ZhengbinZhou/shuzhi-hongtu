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
  const renderHeroMap = () => mapEngine==="tdt"&&tiandituTk?<TdtHeroMap tk={tiandituTk} counties={countyPoints} spots={scenicPoints}/>:<HeroMap/>;

  return <main>
    <section className="hero">
      <div className="hero-copy">
        <p className="kicker">赣鄱热土 · 红色摇篮 · 数智新途</p>
        <h1><span className="hero-line">寻历史脉络，走一条真正</span><span className="hero-line accent">适合你的红色路线</span></h1>
        <div className="hero-art hero-art-mobile">{renderHeroMap()}</div>
        <p className="lead">基于江西全省44个红色点位的内容评分与公开资料，将实践目的、内容偏好、开放时间和预设通行时间转化为可解释、可调整的路线方案。</p>
        <div className="hero-actions"><Link className="primary" href="/planner">生成个性化路线 <i>→</i></Link><Link className="secondary" href="/landmarks">浏览红色点位</Link></div>
        <div className="hero-stats"><span><b>44</b> 个点位</span><span><b>10</b> 个红色区域</span><span><b>5</b> 条差异方案</span></div>
      </div>
      <div className="hero-art hero-art-desktop">{renderHeroMap()}</div>
    </section>
    <section className="section home-intro">
      <div className="section-head"><div><small>01 / SMART JOURNEY</small><h2>从“看景点”升级为“读懂一段历史”</h2></div><p>路线生成、点位图鉴和个人收藏现在拥有独立页面，浏览、刷新和打印都更加清晰。</p></div>
      <div className="entry-grid">
        <Link href="/planner"><span>01</span><h3>智能规划</h3><p>用日期、主题和体验偏好生成可行路线。</p><b>开始规划 →</b></Link>
        <Link href="/routes"><span>02</span><h3>推荐路线</h3><p>查看默认推荐，理解不同历史叙事角度。</p><b>查看路线 →</b></Link>
        <Link href="/history"><span>03</span><h3>历史专题</h3><p>按历史阶段浏览四条专题路线与研学问答。</p><b>进入专题 →</b></Link>
        <Link href="/landmarks"><span>04</span><h3>点位图鉴</h3><p>按区域浏览44个红色文化点位及其资料。</p><b>浏览图鉴 →</b></Link>
      </div>
    </section>
    <section className="section featured-section">
      <div className="section-head"><div><small>02 / FEATURED LANDMARKS</small><h2>从代表性节点进入江西红色历史</h2></div><p>每个点位都有独立详情页，可直接分享、返回和打印。</p></div>
      <div className="spot-grid">{featured.map(spot=><Link className="spot-card" key={spot.id} href={`/landmarks/${spot.id}`}><img src={spot.image} alt=""/><span><small>{spot.region} · {spot.county}</small><b>{spot.name}</b><em>{spot.intro.slice(0,42)}……</em></span></Link>)}</div>
    </section>
    <section className="method"><div><small>我们的匹配逻辑</small><h2>不是“热门榜单”，而是需求与红色内容的双向匹配</h2><div className="method-grid"><span><b>01</b>可行性过滤<em>日期、开放时间、参观时长与预设通行时间</em></span><span><b>02</b>内容匹配<em>7类红色文化主题评分与游客偏好权重</em></span><span><b>03</b>历史校验<em>保留主题核心节点与基本叙事顺序</em></span><span><b>04</b>差异化去重<em>避免推荐路线只有少量点位变化</em></span></div><Link className="text-link" href="/methodology">查看完整方法说明 →</Link></div></section>
  </main>;
}
