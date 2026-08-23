import type { Metadata } from "next";
import { SavedRoutesClient } from "@/features/saved-routes-client";

export const metadata:Metadata={title:"我的路线｜数智-红途",description:"查看、管理和打印保存在当前浏览器中的江西红色文旅路线。"};

export default function MyRoutesPage(){
  return <main className="page-main"><section className="page-hero compact"><div><p className="kicker">04 / MY ROUTES</p><h1>我的路线</h1><p>路线保存在当前浏览器中，无需登录；可继续查看、删除或导出为 PDF。</p></div></section><section className="section my-routes-page"><SavedRoutesClient/></section></main>;
}
