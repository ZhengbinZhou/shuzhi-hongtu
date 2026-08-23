import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RouteDetailClient } from "@/features/route-detail-client";
import { generatePlans } from "@/lib/planner";
import { parsePlannerCriteria } from "@/lib/planner-query";

type Props={
  params:Promise<{planId:string}>;
  searchParams:Promise<Record<string,string|string[]|undefined>>;
};

export async function generateMetadata({params}:Props):Promise<Metadata> {
  const {planId}=await params;
  return {title:`${decodeURIComponent(planId)}｜推荐路线｜数智-红途`,description:"江西红色文旅智能推荐路线详情、每日安排与全域地图。"};
}

export default async function RouteDetailPage({params,searchParams}:Props) {
  const [{planId},raw]=await Promise.all([params,searchParams]);
  const decodedPlanId=decodeURIComponent(planId);
  let criteria=parsePlannerCriteria(raw);
  let plans=generatePlans(criteria.county,criteria.startDate,criteria.days,criteria.theme1,criteria.theme2,criteria.experience,criteria.purpose,criteria.travelMode);
  let plan=plans.find(item=>item.id===decodedPlanId);
  const dateFromPlanId=decodedPlanId.match(/(\d{4}-\d{2}-\d{2})$/)?.[1];
  if(!plan&&dateFromPlanId&&dateFromPlanId!==criteria.startDate){
    criteria={...criteria,startDate:dateFromPlanId};
    plans=generatePlans(criteria.county,criteria.startDate,criteria.days,criteria.theme1,criteria.theme2,criteria.experience,criteria.purpose,criteria.travelMode);
    plan=plans.find(item=>item.id===decodedPlanId);
  }
  if(!plan)notFound();
  return <RouteDetailClient initialPlan={plan}/>;
}
