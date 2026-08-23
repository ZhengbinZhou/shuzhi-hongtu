import Link from "next/link";

export function Brand({inverse=false}:{inverse?:boolean}) {
  return <Link className={`brand ${inverse?"inverse":""}`} href="/"><span><b>数智-红途</b>{inverse?<small>让红色历史在行走中被理解</small>:null}</span></Link>;
}

export function SiteHeader() {
  return <header className="site-header">
    <div className="topbar">
      <Brand/>
      <nav aria-label="主导航"><Link href="/">首页</Link><Link href="/planner">智能规划</Link><Link href="/routes">推荐路线</Link><Link href="/history">历史专题</Link><Link href="/landmarks">点位图鉴</Link><Link href="/my-routes">我的路线</Link></nav>
      <Link className="nav-cta" href="/planner">开始规划</Link>
    </div>
  </header>;
}

export function SiteFooter() {
  return <footer><div><Brand inverse/><p>青年红色实践智导平台 · 江西全省</p></div><nav aria-label="页脚导航"><Link href="/planner">智能规划</Link><Link href="/routes">推荐路线</Link><Link href="/history">历史专题</Link><Link href="/landmarks">点位图鉴</Link></nav></footer>;
}
