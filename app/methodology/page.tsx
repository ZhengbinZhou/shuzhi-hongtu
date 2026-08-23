import type { Metadata } from "next";
import Link from "next/link";

export const metadata:Metadata={title:"匹配方法｜数智-红途",description:"了解数智-红途如何综合主题评分、开放时间、参观时长和通行约束生成路线。"};

export default function MethodologyPage(){
  return <main className="page-main methodology-page"><section className="page-hero"><div><p className="kicker">METHOD & DATA</p><h1>让路线推荐有依据，也有边界</h1><p>平台以公开资料和演示期静态数据为基础，将内容相关性与行程可行性分开计算，再生成具备差异化叙事角度的路线。</p></div></section><section className="section">
    <div className="method-steps">
      <article><span>01</span><div><h2>可行性过滤</h2><p>依据出发日期、固定闭馆日、建议参观时长和预设通行时间，将每天可用时间控制在约480分钟以内。</p></div></article>
      <article><span>02</span><div><h2>内容匹配</h2><p>对重要人物、重大事件、军事斗争、群众支前、政权建设、长征文化和革命精神七个维度设置内容评分。</p></div></article>
      <article><span>03</span><div><h2>历史叙事校验</h2><p>每条主题路线保留必要的核心历史节点，并结合起始县区与空间距离调整参观顺序。</p></div></article>
      <article><span>04</span><div><h2>差异化输出</h2><p>不同路线使用不同叙事主轴，避免推荐结果只更换少量辅助点位而缺乏实质差异。</p></div></article>
    </div>
    <aside className="data-notice"><h2>使用边界</h2><p>当前开放日期、闭馆安排和通行时间均为演示期静态资料，不包含节假日临时调整、预约余量和实时路况。实际出行前应再次核验各场馆官方通知。</p></aside>
    <Link className="primary inline-cta" href="/planner">开始生成路线 →</Link>
  </section></main>;
}
