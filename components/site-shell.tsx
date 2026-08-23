import Link from "next/link";

export function Brand({inverse=false}:{inverse?:boolean}) {
  return <Link className={`brand ${inverse?"inverse":""}`} href="/"><span className="seal">智</span><span><b>数智-红途</b><small>{inverse?"让红色历史在行走中被理解":"红色文旅智能导览平台"}</small></span></Link>;
}

export function SiteHeader() {
  return <header className="topbar"><Brand/><nav aria-label="主导航"><Link href="/">首页</Link><Link href="/planner">智能规划</Link><Link href="/routes">推荐路线</Link><Link href="/history">历史专题</Link><Link href="/landmarks">点位图鉴</Link><Link href="/my-routes">我的路线</Link></nav><Link className="nav-cta" href="/planner">开始规划</Link></header>;
}

export function SiteFooter() {
  return <footer><Brand inverse/><p>青年红色实践智导平台 · 江西全省</p></footer>;
}
