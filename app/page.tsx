"use client";

import { useEffect, useMemo, useState } from "react";
import { JIANGXI_BOUNDS, JIANGXI_PREFECTURES, RIVERS } from "./jiangxi-map";
import { JIANGXI_COUNTIES } from "./jiangxi-counties";

type Theme = "重要人物" | "重大事件" | "军事斗争" | "群众支前" | "政权建设" | "长征文化" | "革命精神";
type Spot = {
  id: string; name: string; short: string; region: string; county: string;
  image: string; minutes: number; closed: number[]; core: boolean; lat: number; lng: number;
  themes: Record<Theme, number>; experience: Record<string, number>; intro: string;
};
type Plan = {
  id: string; name: string; angle: string; score: number; spots: Spot[]; days: Spot[][];
  reason: string; dimensions: { label: string; value: number }[]; feasible: boolean;
};

const themeOptions: Theme[] = ["重要人物", "重大事件", "军事斗争", "群众支前", "政权建设", "长征文化", "革命精神"];
const experiences = ["深度讲解", "现场观察", "互动体验", "轻松参观"];
const purposes = ["思政学习", "社会实践", "党建活动", "专题调研"];
const T = (人物:number,事件:number,军事:number,群众:number,政权:number,长征:number,精神:number):Record<Theme,number> => ({
  重要人物:人物, 重大事件:事件, 军事斗争:军事, 群众支前:群众, 政权建设:政权, 长征文化:长征, 革命精神:精神
});
const E = (讲解:number,观察:number,互动:number,轻松:number) => ({深度讲解:讲解,现场观察:观察,互动体验:互动,轻松参观:轻松});

const spots: Spot[] = [
  {id:"J01",name:"井冈山革命博物馆",short:"革命博物馆",region:"井冈山",county:"井冈山市",image:"/landmarks/JGS01-museum.webp",minutes:90,closed:[1],core:true,lat:26.574,lng:114.166,themes:T(5,5,4,4,4,1,5),experience:E(5,4,3,4),intro:"系统呈现井冈山革命根据地创建、发展及其历史影响，是建立井冈山斗争完整时间线的重要起点。"},
  {id:"J02",name:"井冈山革命烈士陵园",short:"烈士陵园",region:"井冈山",county:"井冈山市",image:"/landmarks/JGS02-cemetery.webp",minutes:60,closed:[],core:true,lat:26.586,lng:114.161,themes:T(5,4,3,2,2,1,5),experience:E(4,4,2,4),intro:"以纪念革命先烈、传承井冈山精神为核心，适合开展缅怀仪式与理想信念教育。"},
  {id:"J03",name:"茨坪革命旧址群",short:"茨坪旧址群",region:"井冈山",county:"井冈山市",image:"/landmarks/JGS03-ciping.webp",minutes:90,closed:[],core:true,lat:26.575,lng:114.160,themes:T(5,4,3,4,5,1,5),experience:E(5,5,3,4),intro:"集中呈现党政军机关与革命者工作生活空间，可从日常尺度理解根据地组织运行与群众联系。"},
  {id:"J04",name:"黄洋界哨口",short:"黄洋界",region:"井冈山",county:"井冈山市",image:"/landmarks/JGS04-huangyangjie.webp",minutes:75,closed:[],core:true,lat:26.641,lng:114.129,themes:T(4,5,5,5,2,1,5),experience:E(4,5,4,3),intro:"黄洋界保卫战重要发生地，山地环境与遗址共同构成军民协作和艰苦奋斗的现场课堂。"},
  {id:"J05",name:"茅坪八角楼",short:"茅坪八角楼",region:"井冈山",county:"井冈山市",image:"/landmarks/JGS05-bajiaolou.webp",minutes:65,closed:[],core:true,lat:26.713,lng:114.047,themes:T(5,5,3,4,4,1,5),experience:E(5,5,2,3),intro:"以清油灯下的理论思考故事广为人知，是理解实事求是、敢闯新路的重要历史现场。"},
  {id:"J06",name:"小井红军医院旧址",short:"小井红军医院",region:"井冈山",county:"井冈山市",image:"/landmarks/JGS06-hospital.webp",minutes:55,closed:[],core:false,lat:26.616,lng:114.107,themes:T(3,4,2,5,3,1,5),experience:E(4,5,3,3),intro:"见证艰苦条件下的伤员救治与医疗保障，呈现有限资源下的组织协作、责任与牺牲。"},
  {id:"J07",name:"大井毛泽东同志旧居",short:"大井旧居",region:"井冈山",county:"井冈山市",image:"/landmarks/JGS07-dajing.webp",minutes:50,closed:[],core:false,lat:26.592,lng:114.119,themes:T(5,3,2,5,3,1,4),experience:E(4,5,2,4),intro:"通过工作生活空间观察革命者如何联系群众、开展工作并应对根据地的物资紧张。"},
  {id:"J08",name:"井冈山会师纪念馆",short:"会师纪念馆",region:"井冈山",county:"井冈山市",image:"/landmarks/JGS08-huishi.webp",minutes:70,closed:[1],core:false,lat:26.746,lng:114.289,themes:T(5,5,4,3,4,1,5),experience:E(5,4,3,4),intro:"围绕井冈山会师与红军队伍建设展开，呈现革命力量汇聚、组织整合及其历史影响。"},
  {id:"J09",name:"挑粮小道",short:"挑粮小道",region:"井冈山",county:"井冈山市",image:"/landmarks/JGS09-trail.webp",minutes:120,closed:[],core:false,lat:26.654,lng:114.146,themes:T(3,3,2,5,2,1,5),experience:E(3,5,5,1),intro:"以山地徒步连接物资保障历史记忆，让抽象的艰苦奋斗转化为可感知的身体体验。"},
  {id:"J10",name:"柏露红色教育区",short:"柏露教育区",region:"井冈山",county:"井冈山市",image:"/landmarks/JGS10-bailu.webp",minutes:90,closed:[],core:false,lat:26.780,lng:114.216,themes:T(3,3,2,5,3,1,4),experience:E(3,5,5,3),intro:"将革命历史学习、团队研学与乡村场景结合，适合观察红色资源的教育转化与地方发展。"},
  {id:"Y01",name:"中央红军长征集结出发地纪念园",short:"长征出发纪念园",region:"于都",county:"于都县",image:"/landmarks/YD01-park.webp",minutes:120,closed:[],core:true,lat:25.955,lng:115.409,themes:T(5,5,3,5,3,5,5),experience:E(5,5,4,4),intro:"由纪念馆、纪念碑、渡口等空间共同构成，系统呈现中央红军在于都集结、渡河和踏上长征的过程。"},
  {id:"Y02",name:"中央红军长征出发纪念馆",short:"长征出发纪念馆",region:"于都",county:"于都县",image:"/landmarks/YD02-museum.webp",minutes:90,closed:[1],core:true,lat:25.956,lng:115.410,themes:T(5,5,3,5,4,5,5),experience:E(5,4,3,4),intro:"以文物、图像、场景复原与数字展示梳理集结出发史实，是于都路线的知识中枢。"},
  {id:"Y03",name:"东门渡口",short:"东门渡口",region:"于都",county:"于都县",image:"/landmarks/YD03-ferry.webp",minutes:60,closed:[],core:true,lat:25.955,lng:115.412,themes:T(4,5,2,5,2,5,5),experience:E(4,5,4,4),intro:"中央机关和红军总部渡过于都河的重要地点，承载群众支援、架设浮桥和依依惜别的记忆。"},
  {id:"Y04",name:"中央红军长征出发纪念碑",short:"长征出发纪念碑",region:"于都",county:"于都县",image:"/landmarks/YD04-monument.webp",minutes:35,closed:[],core:true,lat:25.954,lng:115.408,themes:T(4,5,2,3,2,5,5),experience:E(3,5,2,5),intro:"以庄重的纪念空间铭记中央红军集结出发历史，是开展仪式教育与集体学习的重要节点。"},
  {id:"Y05",name:"红四军军部旧址（葛氏宗祠）",short:"葛氏宗祠",region:"于都",county:"于都县",image:"/landmarks/YD05-ancestral.webp",minutes:65,closed:[],core:false,lat:25.997,lng:115.303,themes:T(4,4,3,5,3,4,4),experience:E(4,5,5,3),intro:"革命历史与客家宗祠建筑在此交汇，可观察地方群众为红军提供物资与空间支持的具体方式。"},
  {id:"Y06",name:"中共赣南省委旧址",short:"赣南省委旧址",region:"于都",county:"于都县",image:"/landmarks/YD06-party.webp",minutes:60,closed:[],core:false,lat:26.061,lng:115.335,themes:T(4,4,2,4,5,4,4),experience:E(4,5,3,3),intro:"承载中央苏区时期赣南地方党组织开展革命工作的历史，突出组织体系与群众动员。"},
  {id:"Y07",name:"赣南省苏维埃政府旧址",short:"省苏旧址",region:"于都",county:"于都县",image:"/landmarks/YD07-soviet.webp",minutes:60,closed:[],core:false,lat:26.070,lng:115.330,themes:T(3,4,2,5,5,4,4),experience:E(4,5,3,3),intro:"反映中央苏区时期地方政权建设、社会组织与群众动员的历史实践。"},
  {id:"Y08",name:"祁禄山红军小道",short:"祁禄山红军小道",region:"于都",county:"于都县",image:"/landmarks/YD08-qilushan.webp",minutes:150,closed:[],core:false,lat:25.707,lng:115.244,themes:T(2,3,3,4,2,5,5),experience:E(3,5,5,1),intro:"以山地行走连接长征记忆，适合通过路段、坡度、环境和团队状态记录感受长征艰险。"},
  {id:"Y09",name:"长征历史步道",short:"长征历史步道",region:"于都",county:"于都县",image:"/landmarks/YD09-historytrail.webp",minutes:120,closed:[],core:false,lat:25.947,lng:115.421,themes:T(3,5,2,4,2,5,5),experience:E(3,5,5,2),intro:"以步行方式串联城市空间与长征场景，适合青年团队开展时间线式学习和城市观察。"},
  {id:"Y10",name:"潭头村",short:"潭头村",region:"于都",county:"于都县",image:"/landmarks/YD10-tantou.webp",minutes:90,closed:[],core:false,lat:25.918,lng:115.486,themes:T(2,2,1,5,3,3,4),experience:E(3,5,5,4),intro:"为观察红色文化、群众生活与乡村振兴提供当代样本，可形成面向地方发展的实践建议。"},
  {id:"R01",name:"叶坪革命旧址群",short:"叶坪旧址群",region:"瑞金",county:"瑞金市",image:"/landmarks/R01-yeping.webp",minutes:120,closed:[],core:true,lat:25.891,lng:116.067,themes:T(5,5,3,4,5,4,5),experience:E(5,5,4,3),intro:"中华苏维埃共和国临时中央政府诞生地，集中呈现中央苏区政权建设、机构运行和革命生活。"},
  {id:"R02",name:"沙洲坝红井革命旧址群",short:"红井旧址群",region:"瑞金",county:"瑞金市",image:"/landmarks/R02-hongjing.webp",minutes:100,closed:[],core:true,lat:25.887,lng:115.989,themes:T(5,4,2,5,5,3,5),experience:E(5,5,4,4),intro:"以“吃水不忘挖井人”的红井故事为核心，呈现党和苏区群众密切联系的历史实践。"},
  {id:"R03",name:"中央革命根据地历史博物馆",short:"中央苏区博物馆",region:"瑞金",county:"瑞金市",image:"/landmarks/R03-soviet-museum.webp",minutes:100,closed:[1],core:true,lat:25.873421,lng:116.014385,themes:T(5,5,4,4,5,4,5),experience:E(5,4,3,4),intro:"系统展示中央革命根据地与中华苏维埃共和国历史，是理解瑞金红色资源整体脉络的知识中枢。"},
  {id:"R04",name:"“二苏大”革命旧址群",short:"二苏大旧址",region:"瑞金",county:"瑞金市",image:"/landmarks/R04-ersuda.webp",minutes:90,closed:[],core:true,lat:25.907,lng:115.990,themes:T(4,5,2,3,5,3,5),experience:E(5,5,3,3),intro:"以中华苏维埃共和国临时中央政府大礼堂为代表，突出苏区制度建设与治国理政探索。"},
  {id:"R05",name:"中央革命军事委员会旧址",short:"中革军委旧址",region:"瑞金",county:"瑞金市",image:"/landmarks/R05-military-commission.webp",minutes:65,closed:[],core:false,lat:25.903,lng:115.977,themes:T(5,4,5,3,5,3,5),experience:E(4,5,3,3),intro:"见证中央苏区时期重要军事指挥活动，可与叶坪、沙洲坝旧址形成政权与军事两条观察线。"},
  {id:"R06",name:"中华苏维埃纪念园",short:"苏维埃纪念园",region:"瑞金",county:"瑞金市",image:"/landmarks/R06-soviet-park.webp",minutes:70,closed:[],core:false,lat:25.875,lng:116.011,themes:T(4,4,2,3,5,3,5),experience:E(4,4,3,5),intro:"以纪念景观、人物群雕和主题陈列集中呈现共和国摇篮的历史地位，适合仪式教育与总结学习。"},
  {id:"N01",name:"南昌八一起义纪念馆",short:"八一起义纪念馆",region:"南昌",county:"西湖区",image:"/landmarks/N01-bayi-museum.webp",minutes:100,closed:[1],core:true,lat:28.67445,lng:115.88927,themes:T(5,5,5,3,4,1,5),experience:E(5,4,4,4),intro:"依托南昌起义总指挥部旧址系统呈现起义决策、战斗过程与人民军队创建史。"},
  {id:"N02",name:"八一南昌起义纪念塔",short:"八一起义纪念塔",region:"南昌",county:"东湖区",image:"/landmarks/N02-bayi-tower.webp",minutes:45,closed:[],core:true,lat:28.672667,lng:115.904562,themes:T(4,5,5,2,2,1,5),experience:E(3,5,2,5),intro:"南昌英雄城的重要纪念坐标，适合开展集体仪式、城市空间观察和军旗历史主题学习。"},
  {id:"N03",name:"南昌新四军军部旧址陈列馆",short:"新四军军部旧址",region:"南昌",county:"西湖区",image:"/landmarks/N03-new-fourth-army.webp",minutes:80,closed:[1],core:false,lat:28.657,lng:115.894,themes:T(5,4,4,3,4,1,5),experience:E(5,5,3,4),intro:"新四军第一个正规军部驻地，连接南方红军游击战争与全民族抗战时期的革命历史。"},
  {id:"N04",name:"贺龙指挥部旧址",short:"贺龙指挥部旧址",region:"南昌",county:"东湖区",image:"/landmarks/N04-helong-headquarters.webp",minutes:55,closed:[],core:false,lat:28.681,lng:115.891,themes:T(5,5,5,2,3,1,5),experience:E(4,5,3,4),intro:"南昌起义旧址群的重要组成部分，可从具体指挥空间理解起义的组织准备与战斗部署。"},
  {id:"A01",name:"安源路矿工人运动纪念馆",short:"安源工运纪念馆",region:"安源",county:"安源区",image:"/landmarks/A01-anyuan-museum.webp",minutes:90,closed:[1],core:true,lat:27.646,lng:113.850,themes:T(5,5,2,5,4,1,5),experience:E(5,4,4,4),intro:"系统展示安源路矿工人运动历史，是理解中国共产党早期工运实践和群众组织的重要场馆。"},
  {id:"A02",name:"安源路矿工人俱乐部旧址",short:"工人俱乐部旧址",region:"安源",county:"安源区",image:"/landmarks/A02-workers-club.webp",minutes:65,closed:[],core:true,lat:27.641,lng:113.845,themes:T(5,5,2,5,5,1,5),experience:E(5,5,4,3),intro:"保存早期工人组织活动的历史空间，可结合罢工史实理解群众动员与基层组织建设。"},
  {id:"A03",name:"秋收起义广场",short:"秋收起义广场",region:"安源",county:"安源区",image:"/landmarks/A03-autumn-harvest-plaza.webp",minutes:50,closed:[],core:false,lat:27.622,lng:113.855,themes:T(4,5,5,4,3,1,5),experience:E(3,5,3,5),intro:"以纪念碑和广场叙事呈现秋收起义历史，适合作为安源工运路线的总结与仪式节点。"},
  {id:"S01",name:"上饶集中营革命烈士纪念馆",short:"上饶集中营纪念馆",region:"上饶",county:"信州区",image:"/landmarks/S01-shangrao-memorial.webp",minutes:90,closed:[1],core:true,lat:28.425,lng:117.956,themes:T(4,5,3,3,2,1,5),experience:E(5,4,3,4),intro:"系统展示皖南事变后被囚革命志士的斗争历史，突出信仰、气节与狱中斗争。"},
  {id:"S02",name:"茅家岭监狱旧址",short:"茅家岭监狱旧址",region:"上饶",county:"信州区",image:"/landmarks/S02-maojialing-prison.webp",minutes:65,closed:[],core:true,lat:28.421,lng:117.949,themes:T(4,5,3,3,2,1,5),experience:E(4,5,3,3),intro:"上饶集中营旧址体系中的重要现场，通过牢房、刑具和遗迹呈现革命志士坚贞不屈的斗争。"},
  {id:"S03",name:"方志敏纪念馆",short:"方志敏纪念馆",region:"上饶",county:"弋阳县",image:"/landmarks/S03-fangzhimin-memorial.webp",minutes:80,closed:[1],core:false,lat:28.407,lng:117.435,themes:T(5,4,3,4,4,1,5),experience:E(5,4,3,4),intro:"围绕方志敏生平、赣东北革命根据地和《可爱的中国》精神价值展开主题陈列。"},
  {id:"XG1",name:"兴国将军园",short:"兴国将军园",region:"兴国",county:"兴国县",image:"/landmarks/XG1-general-park.webp",minutes:90,closed:[],core:true,lat:26.332,lng:115.361,themes:T(5,4,4,5,3,4,5),experience:E(4,5,4,4),intro:"集中展示兴国籍开国将军和苏区军民参军支前历史，突出将军县的革命贡献。"},
  {id:"XG2",name:"长冈乡调查纪念馆",short:"长冈乡调查纪念馆",region:"兴国",county:"兴国县",image:"/landmarks/XG2-changgang-museum.webp",minutes:75,closed:[1],core:true,lat:26.410,lng:115.456,themes:T(5,4,2,5,5,3,5),experience:E(5,5,4,3),intro:"围绕毛泽东长冈乡调查及苏区干部作风展开，适合开展调查研究方法与群众路线教育。"},
  {id:"XG3",name:"潋江书院毛泽东旧居",short:"潋江书院旧居",region:"兴国",county:"兴国县",image:"/landmarks/XG3-lianjiang-academy.webp",minutes:60,closed:[],core:false,lat:26.338,lng:115.363,themes:T(5,4,2,5,4,3,5),experience:E(4,5,3,3),intro:"见证毛泽东在兴国开展革命实践与社会调查的历史，可与长冈乡调查形成方法论学习线。"},
  {id:"ND1",name:"宁都起义纪念馆",short:"宁都起义纪念馆",region:"宁都",county:"宁都县",image:"/landmarks/ND1-ningdu-museum.webp",minutes:85,closed:[1],core:true,lat:26.475,lng:116.013,themes:T(5,5,5,3,4,3,5),experience:E(5,4,3,4),intro:"围绕宁都起义及部队改编历程展开，呈现革命力量汇聚和人民军队发展壮大的历史。"},
  {id:"ND2",name:"小布红色旧址群",short:"小布红色旧址群",region:"宁都",county:"宁都县",image:"/landmarks/ND2-xiaobu-sites.webp",minutes:100,closed:[],core:false,lat:26.665,lng:115.912,themes:T(4,5,5,4,4,3,5),experience:E(4,5,4,3),intro:"集中保留中央苏区时期前线指挥与党政机关活动旧址，适合开展反“围剿”专题现场教学。"},
  {id:"XW1",name:"寻乌调查纪念馆",short:"寻乌调查纪念馆",region:"寻乌",county:"寻乌县",image:"/landmarks/XW1-xunwu-museum.webp",minutes:80,closed:[1],core:true,lat:24.953,lng:115.653,themes:T(5,4,2,5,5,2,5),experience:E(5,4,4,3),intro:"以《寻乌调查》为核心，呈现实事求是、深入基层的调查研究方法与思想形成过程。"},
  {id:"XW2",name:"毛泽东寻乌调查旧址",short:"寻乌调查旧址",region:"寻乌",county:"寻乌县",image:"/landmarks/XW2-xunwu-site.webp",minutes:60,closed:[],core:true,lat:24.951,lng:115.650,themes:T(5,4,2,5,5,2,5),experience:E(5,5,4,3),intro:"保存开展寻乌调查时的工作生活空间，可从现场细节理解党的思想路线和群众工作方法。"},
  {id:"LS1",name:"庐山会议旧址",short:"庐山会议旧址",region:"庐山",county:"庐山市",image:"/landmarks/LS1-lushan-meeting.webp",minutes:80,closed:[],core:true,lat:29.565,lng:115.973,themes:T(5,5,1,2,5,1,4),experience:E(5,5,2,4),intro:"重要党史会议旧址，建筑、陈列与山地空间共同构成理解新中国社会主义建设探索的现场。"},
];

const skeletons = [
  {name:"伟大出发·长征源流线",angle:"以中央红军集结出发为叙事主轴",core:["Y02","Y04","Y03"]},
  {name:"井冈星火·道路探索线",angle:"从理论探索到军事实践",core:["J01","J05","J04"]},
  {name:"信仰铸魂·初心教育线",angle:"突出重要人物与革命精神",core:["J01","J02","J03"]},
  {name:"军民同心·群众支前线",angle:"看见革命胜利背后的群众力量",core:["Y03","Y05","Y06","Y07"]},
  {name:"行走课堂·实践观察线",angle:"强调现场观察与身体体验",core:["J03","J09","J06"]},
  {name:"新长征·时代发展线",angle:"连接红色记忆与乡村振兴",core:["Y01","Y10","Y05"]},
  {name:"共和国摇篮·苏区政权线",angle:"从叶坪到沙洲坝理解治国理政探索",core:["R01","R04","R03"]},
  {name:"饮水思源·群众路线",angle:"从红井故事理解初心与群众工作",core:["R02","R01","R06"]},
  {name:"军旗升起·英雄城线",angle:"沿八一起义旧址追溯人民军队创建",core:["N01","N04","N02"]},
  {name:"工运先声·安源初心线",angle:"理解早期工人运动与群众组织",core:["A01","A02","A03"]},
  {name:"信仰如炬·上饶英烈线",angle:"在狱中斗争遗址体悟信仰与气节",core:["S01","S02","S03"]},
  {name:"调查研究·苏区作风线",angle:"以长冈乡、寻乌调查理解群众路线",core:["XG2","XG3","XW1"]},
  {name:"军民同心·将军县线",angle:"从兴国支前史理解苏区军民关系",core:["XG1","XG2","XG3"]},
  {name:"反围剿·中央苏区军事线",angle:"连接宁都起义与苏区军事斗争",core:["ND1","ND2","R05"]},
  {name:"百年征程·江西党史线",angle:"从革命年代延伸至建设时期",core:["N01","J01","LS1"]},
];
const counties = Array.from(new Set(spots.map(s=>s.county)));
const regions = ["全部", ...Array.from(new Set(spots.map(s=>s.region)))];
const platformCountyNames = counties;

function HeroMap(){
  const highlighted = new Set(platformCountyNames);
  const activeCounties = JIANGXI_COUNTIES.filter(county=>highlighted.has(county.name));
  const labelPositions = activeCounties.reduce<{name:string;x:number;y:number;trueX:number;trueY:number}[]>((out,county)=>{
    let x=county.x,y=county.y,ring=0;
    while(out.some(label=>Math.hypot(label.x-x,label.y-y)<58)){
      ring++;
      const angle=ring*2.35;
      x=county.x+Math.cos(angle)*42*(.7+ring*.22);
      y=county.y+Math.sin(angle)*30*(.7+ring*.22);
    }
    out.push({name:county.name,x,y,trueX:county.x,trueY:county.y});
    return out;
  },[]);

  return <div className="hero-map" aria-label="江西省地图，高亮平台红色点位涉及的十二个县级行政区">
    <svg viewBox="0 0 1000 560" role="img">
      <defs>
        <filter id="hero-map-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="14" floodColor="#5b1117" floodOpacity=".14"/>
        </filter>
      </defs>
      <g className="hero-map-shape" filter="url(#hero-map-shadow)">
        {JIANGXI_COUNTIES.map(county=><path key={county.name} className={highlighted.has(county.name)?"active":""} d={county.d}/>)}
      </g>
      <text className="hero-province-label" x="515" y="286">江西省</text>
      <g className="hero-county-labels">{labelPositions.map(label=><g key={label.name}>
        {(label.x!==label.trueX||label.y!==label.trueY)&&<line x1={label.trueX} y1={label.trueY} x2={label.x} y2={label.y}/>}
        <circle cx={label.trueX} cy={label.trueY} r="3.5"/>
        <text x={label.x} y={label.y}>{label.name}</text>
      </g>)}</g>
    </svg>
    <div className="hero-map-note"><i/><span>平台点位覆盖县区</span><b>12</b></div>
  </div>
}

function travel(a: Spot, b: Spot) {
  const km = Math.sqrt(Math.pow((a.lat-b.lat)*111,2)+Math.pow((a.lng-b.lng)*100,2));
  const speed = a.region === b.region ? 35 : 58;
  return Math.max(10, Math.round(km / speed * 60 * 1.18 + 8));
}
function dateAt(start:string, offset:number) { const d = new Date(`${start}T12:00:00`); d.setDate(d.getDate()+offset); return d; }
function isOpen(s:Spot, start:string, day:number) { return !s.closed.includes(dateAt(start,day).getDay()); }
function pointFit(s:Spot, t1:Theme, t2:Theme, exp:string) { return s.themes[t1]*.5+s.themes[t2]*.25+(s.experience[exp]||0)*.25; }
function arrange(list:Spot[]) {
  if (list.length < 2) return list;
  const remaining=[...list.slice(1)], out=[list[0]];
  while(remaining.length){ const last=out[out.length-1]; remaining.sort((a,b)=>travel(last,a)-travel(last,b)); out.push(remaining.shift()!); }
  return out;
}
function splitDays(list:Spot[], days:number, start:string) {
  const result:Spot[][]=Array.from({length:days},()=>[]); let day=0, used=0;
  for(const s of list){
    const prev=result[day].at(-1); const need=s.minutes+(prev?travel(prev,s):0);
    if(day<days-1 && used+need>480){day++;used=0;}
    if(isOpen(s,start,day)){result[day].push(s);used+=need;}
  }
  return result.filter(x=>x.length);
}
function dayMinutes(day:Spot[]) {
  return day.reduce((sum,s,i)=>sum+s.minutes+(i?travel(day[i-1],s):0),0);
}
function generatePlans(startCounty:string,startDate:string,days:number,t1:Theme,t2:Theme,exp:string,purpose:string):Plan[]{
  const capacity=days*480;
  return skeletons.map((sk,idx)=>{
    let selected=sk.core.map(id=>spots.find(s=>s.id===id)!).filter(Boolean);
    const startBonus=(s:Spot)=>s.county===startCounty?1.3:0;
    const pool=spots.filter(s=>!selected.some(x=>x.id===s.id))
      .sort((a,b)=>(pointFit(b,t1,t2,exp)+startBonus(b))-(pointFit(a,t1,t2,exp)+startBonus(a)));
    let total=selected.reduce((n,s,i)=>n+s.minutes+(i?travel(selected[i-1],s):0),0);
    for(const s of pool){
      const nearest=Math.min(...selected.map(x=>travel(x,s))); const add=s.minutes+nearest;
      if(total+add<=capacity-40 && selected.length<days*4){selected.push(s);total+=add;}
    }
    const firstLocal=selected.findIndex(s=>s.county===startCounty);
    if(firstLocal>0 && pointFit(selected[firstLocal],t1,t2,exp)+1>=pointFit(selected[0],t1,t2,exp)){
      const [local]=selected.splice(firstLocal,1);selected.unshift(local);
    }
    selected=arrange(selected);
    const daily=splitDays(selected,days,startDate); const flat=daily.flat();
    const match=flat.reduce((n,s)=>n+pointFit(s,t1,t2,exp),0)/Math.max(1,flat.length)/5*100;
    const feasible=daily.length>0 && flat.length>=sk.core.length && daily.every(day=>dayMinutes(day)<=480);
    const score=Math.round(Math.min(98,match*.82+(feasible?12:0)+(flat[0]?.county===startCounty?4:0)-(idx*.35)));
    return {id:`plan-${idx}-${startDate}`,name:sk.name,angle:sk.angle,score,spots:flat,days:daily,
      reason:`以“${sk.angle}”为框架，优先匹配${t1}、${t2}和${exp}需求；${flat[0]?.county===startCounty?"首站位于所选起始县区":"为提高整体匹配度，首站调整至邻近区域"}。适合用于${purpose}。`,
      dimensions:[{label:t1,value:Math.round(match)},{label:t2,value:Math.round(flat.reduce((n,s)=>n+s.themes[t2],0)/Math.max(1,flat.length)/5*100)},{label:exp,value:Math.round(flat.reduce((n,s)=>n+(s.experience[exp]||0),0)/Math.max(1,flat.length)/5*100)},{label:"行程可行性",value:feasible?94:58}],feasible
    };
  }).filter(p=>p.feasible&&p.days.length&&p.spots.length>=3).sort((a,b)=>b.score-a.score).slice(0,5);
}

function baseMapPoint(lng:number,lat:number) {
  const {minLng,maxLng,minLat,maxLat,width,height}=JIANGXI_BOUNDS;
  return {x:(lng-minLng)/(maxLng-minLng)*width,y:(maxLat-lat)/(maxLat-minLat)*height};
}

function MiniMap({plan}:{plan:Plan}){
  const raw=plan.spots.map(s=>baseMapPoint(s.lng,s.lat));
  const width=1000,height=560,x=0,y=0;
  const minGap=35;
  const placed=raw.reduce<{x:number;y:number;trueX:number;trueY:number}[]>((out,p)=>{
    let px=p.x,py=p.y,ring=0;
    while(out.some(marker=>Math.hypot(marker.x-px,marker.y-py)<minGap)){
      ring++; const angle=ring*2.18; px=p.x+Math.cos(angle)*minGap*(.8+ring*.34); py=p.y+Math.sin(angle)*minGap*(.8+ring*.34);
    }
    out.push({x:px,y:py,trueX:p.x,trueY:p.y}); return out;
  },[]);
  const activeCountyNames=Array.from(new Set(plan.spots.map(s=>s.county)));
  const activeCounties=JIANGXI_COUNTIES.filter(county=>activeCountyNames.includes(county.name));
  const labelPositions=activeCounties.reduce<{name:string;x:number;y:number;trueX:number;trueY:number}[]>((out,county)=>{
    let lx=county.x,ly=county.y,ring=0;
    while(out.some(label=>Math.hypot(label.x-lx,label.y-ly)<52)){
      ring++; const angle=ring*2.35; lx=county.x+Math.cos(angle)*42*(.7+ring*.25); ly=county.y+Math.sin(angle)*30*(.7+ring*.25);
    }
    out.push({name:county.name,x:lx,y:ly,trueX:county.x,trueY:county.y}); return out;
  },[]);
  const centerLat=27.25;
  const kmPerUnit=(JIANGXI_BOUNDS.maxLng-JIANGXI_BOUNDS.minLng)/1000*111*Math.cos(centerLat*Math.PI/180);
  const scaleKm=100;
  const scaleWidth=scaleKm/kmPerUnit;
  return <div className="route-map" aria-label="江西省全域路线地图，高亮路线涉及的县级行政区">
    <svg viewBox={`${x} ${y} ${width} ${height}`} role="img">
      <defs><pattern id="terrain" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(28)"><line x1="0" y1="0" x2="0" y2="22" stroke="#bca98c" strokeOpacity=".10" strokeWidth="4"/></pattern></defs>
      <rect x={x} y={y} width={width} height={height} fill="#efe5d5"/>
      <g className="geo-grid">{[114,115,116,117,118].map(lng=>{const p=baseMapPoint(lng,26);return <line key={`lng-${lng}`} x1={p.x} y1="0" x2={p.x} y2="560"/>})}{[25,26,27,28,29,30].map(lat=>{const p=baseMapPoint(116,lat);return <line key={`lat-${lat}`} x1="0" y1={p.y} x2="1000" y2={p.y}/>})}</g>
      <g className="prefectures">{JIANGXI_PREFECTURES.map(area=><path key={area.name} d={area.path}/>)}</g>
      <g className="counties">{JIANGXI_COUNTIES.map(county=><path key={county.name} className={activeCountyNames.includes(county.name)?"active":""} d={county.d}/>)}</g>
      <rect x={x} y={y} width={width} height={height} fill="url(#terrain)"/>
      <g className="rivers">{RIVERS.map((river,i)=><polyline key={i} points={river.map(([lng,lat])=>{const p=baseMapPoint(lng,lat);return `${p.x},${p.y}`}).join(" ")}/>)}</g>
      <text className="province-label" x="510" y="286">江西省</text>
      <g className="county-labels">{labelPositions.map(label=><g key={label.name}>
        {(label.x!==label.trueX||label.y!==label.trueY)&&<line x1={label.trueX} y1={label.trueY} x2={label.x} y2={label.y}/>}
        <text x={label.x} y={label.y}>{label.name}</text>
      </g>)}</g>
      <polyline className="route-line" points={placed.map(p=>`${p.x},${p.y}`).join(" ")}/>
      {placed.map((p,i)=><g className="map-marker" key={plan.spots[i].id}>
        {(p.x!==p.trueX||p.y!==p.trueY)&&<><line className="marker-leader" x1={p.trueX} y1={p.trueY} x2={p.x} y2={p.y}/><circle className="true-point" cx={p.trueX} cy={p.trueY} r={Math.max(1.5,width/330)}/></>}
        <circle cx={p.x} cy={p.y} r={Math.max(9,width/42)}/><text x={p.x} y={p.y+Math.max(3.2,width/125)}>{i+1}</text>
      </g>)}
      <g className="north-arrow" transform={`translate(${x+width-35} ${y+34})`}><path d="M0 16L8 -12L16 16L8 11Z"/><text x="8" y="-18">N</text></g>
      <g className="scale-bar" transform={`translate(${x+24} ${y+height-25})`}><line x1="0" y1="0" x2={scaleWidth} y2="0"/><line x1="0" y1="-4" x2="0" y2="4"/><line x1={scaleWidth} y1="-4" x2={scaleWidth} y2="4"/><text x={scaleWidth/2} y="-8">{scaleKm} km</text></g>
    </svg>
    <div className="map-caption"><span>江西省全域 · 县级行政边界 · 主要河流 · 经纬网</span><span>深红区域为本路线涉及县区，近距离点位采用引线错位标注</span></div>
  </div>
}

export default function Home(){
  const [county,setCounty]=useState("于都县");
  const [startDate,setStartDate]=useState(new Date().toISOString().slice(0,10));
  const [days,setDays]=useState(2);
  const [theme1,setTheme1]=useState<Theme>("长征文化");
  const [theme2,setTheme2]=useState<Theme>("群众支前");
  const [experience,setExperience]=useState("现场观察");
  const [purpose,setPurpose]=useState("社会实践");
  const [plans,setPlans]=useState<Plan[]>([]);
  const [active,setActive]=useState<Plan|null>(null);
  const [selectedSpot,setSelectedSpot]=useState<Spot|null>(null);
  const [saved,setSaved]=useState<Plan[]>([]);
  const [atlasRegion,setAtlasRegion]=useState("全部");
  useEffect(()=>{const timer=window.setTimeout(()=>{try{setSaved(JSON.parse(localStorage.getItem("shujing-routes")||"[]"))}catch{}},0);return()=>window.clearTimeout(timer)},[]);
  const preset=useMemo(()=>generatePlans("于都县",startDate,1,"长征文化","群众支前","现场观察","思政学习")[0],[startDate]);
  const run=()=>{const next=generatePlans(county,startDate,days,theme1,theme2,experience,purpose);setPlans(next);setActive(next[0]||null);setTimeout(()=>document.querySelector("#results")?.scrollIntoView({behavior:"smooth"}),50)};
  const save=()=>{if(!active)return;const next=[{...active,id:`saved-${Date.now()}`},...saved].slice(0,12);setSaved(next);localStorage.setItem("shujing-routes",JSON.stringify(next));};
  const updateSpots=(next:Spot[])=>setActive(active?{...active,spots:next,days:splitDays(next,days,startDate),score:Math.max(60,active.score-1)}:null);
  const move=(i:number,dir:number)=>{if(!active)return;const next=[...active.spots],j=i+dir;if(j<0||j>=next.length)return;[next[i],next[j]]=[next[j],next[i]];updateSpots(next)};
  const swap=(i:number)=>{if(!active)return;const old=active.spots[i];const candidate=spots.filter(s=>s.region===old.region&&!active.spots.some(x=>x.id===s.id)&&!s.core).sort((a,b)=>pointFit(b,theme1,theme2,experience)-pointFit(a,theme1,theme2,experience))[0];if(candidate){const next=[...active.spots];next[i]=candidate;updateSpots(next)}};
  return <main>
    <header className="topbar"><a className="brand" href="#top"><span className="seal">智</span><span><b>数智-红途</b><small>红色文旅智能导览平台</small></span></a><nav><a href="#planner">智能规划</a><a href="#results">推荐路线</a><a href="#atlas">点位图鉴</a><a href="#saved">我的路线</a></nav><a className="nav-cta" href="#planner">开始规划</a></header>
    <section className="hero" id="top">
      <div className="hero-copy"><p className="kicker">赣鄱热土 · 红色摇篮 · 数智新途</p><h1><span className="hero-line">寻历史脉络，走一条真正</span><span className="hero-line accent">适合你的红色路线</span></h1><p className="lead">基于江西全省44个红色点位的内容评分与公开资料，将游客目的、内容偏好、开放时间和预设通行时间转化为可解释、可调整的路线方案。</p><div className="hero-actions"><a className="primary" href="#planner">生成个性化路线 <i>→</i></a><a className="secondary" href="#atlas">浏览红色点位</a></div><div className="hero-stats"><span><b>44</b> 个点位</span><span><b>10</b> 个红色区域</span><span><b>5</b> 条差异方案</span></div></div>
      <div className="hero-art"><HeroMap/></div>
    </section>
    <section className="mobile-only mobile-guide"><p>手机端浏览模式</p><h2>伟大出发·长征源流线</h2><p>手机端用于浏览平台预置路线和点位资料。个性化生成与路线编辑请使用电脑端。</p>{preset&&<button className="primary" onClick={()=>setActive(preset)}>查看预置路线</button>}</section>
    <section className="section desktop-only" id="planner">
      <div className="section-head"><div><small>01 / ROUTE PLANNER</small><h2>告诉我们，你想怎样理解这段历史</h2></div><p>先判断行程是否可完成，再从可行方案中选择需求匹配度最高的路线。</p></div>
      <div className="planner">
        <div className="form-grid">
          <label><span>起始县区</span><select value={county} onChange={e=>setCounty(e.target.value)}>{counties.map(x=><option key={x}>{x}</option>)}</select><small>覆盖全省已收录点位县区，用于优先确定首站</small></label>
          <label><span>出发日期</span><input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}/><small>用于识别固定闭馆日</small></label>
          <label><span>游览天数</span><select value={days} onChange={e=>setDays(+e.target.value)}><option value={1}>1天</option><option value={2}>2天</option><option value={3}>3天</option><option value={4}>4天</option><option value={5}>5天</option></select><small>跨市路线建议选择3—5天；每日预设 08:30—17:30</small></label>
          <label><span>实践目的</span><select value={purpose} onChange={e=>setPurpose(e.target.value)}>{purposes.map(x=><option key={x}>{x}</option>)}</select><small>影响路线推荐理由与任务设计</small></label>
        </div>
        <div className="choice-row"><div><b>优先内容</b>{themeOptions.map(x=><button key={x} className={theme1===x?"active":""} onClick={()=>setTheme1(x)}>{x}</button>)}</div><div><b>补充内容</b>{themeOptions.map(x=><button key={x} className={theme2===x?"active":""} onClick={()=>setTheme2(x)}>{x}</button>)}</div><div><b>体验偏好</b>{experiences.map(x=><button key={x} className={experience===x?"active":""} onClick={()=>setExperience(x)}>{x}</button>)}</div></div>
        <button className="generate" onClick={run}><span>开始生成路线</span><small>综合需求权重 · 点位评分 · 通行时间 · 开放约束</small><i>→</i></button>
      </div>
    </section>
    <section className={`results ${plans.length?"show":""} desktop-only`} id="results">
      <div className="section results-inner"><div className="section-head light"><div><small>02 / RECOMMENDATIONS</small><h2>{plans.length?`为你生成 ${plans.length} 条差异化路线`:"个性化推荐将在这里呈现"}</h2></div><p>{plans.length?"按综合得分排序；若约束过严，只展示实际可行方案。":"完成上方选择后生成路线。"}</p></div>
        {plans.length>0&&<div className="result-layout"><div className="plan-tabs">{plans.map((p,i)=><button key={p.id} className={active?.id===p.id?"active":""} onClick={()=>setActive(p)}><span>0{i+1}</span><div><small>{p.angle}</small><b>{p.name}</b></div><strong>{p.score}<em>分</em></strong></button>)}</div>
        {active&&<article className="plan-detail"><div className="plan-title"><div><small>综合推荐方案</small><h3>{active.name}</h3><p>{active.reason}</p></div><div className="score"><b>{active.score}</b><span>综合匹配</span></div></div><div className="bars">{active.dimensions.map(d=><div key={d.label}><span>{d.label}</span><i><b style={{width:`${d.value}%`}}/></i><em>{d.value}%</em></div>)}</div><MiniMap plan={active}/>
          <div className="days">{active.days.map((day,di)=><section key={di}><header><b>DAY {di+1}</b><span>{dateAt(startDate,di).toLocaleDateString("zh-CN",{month:"long",day:"numeric",weekday:"short"})}</span></header>{day.map(s=>{const index=active.spots.findIndex(x=>x.id===s.id);return <div className="stop" key={s.id}><button className="spot-open" onClick={()=>setSelectedSpot(s)}><img src={s.image} alt=""/><span><small>{s.region} · 建议{s.minutes}分钟</small><b>{s.name}</b><em>{s.core?"核心历史节点":"辅助体验点位"}</em></span></button><div className="edit-actions"><button onClick={()=>move(index,-1)} aria-label="上移">↑</button><button onClick={()=>move(index,1)} aria-label="下移">↓</button>{!s.core&&<><button onClick={()=>swap(index)}>替换</button><button onClick={()=>updateSpots(active.spots.filter(x=>x.id!==s.id))}>删除</button></>}</div></div>})}</section>)}</div>
          <div className="plan-actions"><button onClick={save}>保存到“我的路线”</button><span>路线修改后会重新校验日期与时间；核心历史节点不可删除。</span></div>
        </article>}</div>}</div>
    </section>
    <section className="section atlas" id="atlas"><div className="section-head"><div><small>03 / RED LANDMARKS</small><h2>44个红色点位，构成全省路线的数据底座</h2></div><p>覆盖井冈山、于都、瑞金、南昌、安源、上饶等区域；点开查看主题、停留时间与简介。</p></div><div className="atlas-filters">{regions.map(x=><button key={x} className={atlasRegion===x?"active":""} onClick={()=>setAtlasRegion(x)}>{x}</button>)}</div><div className="spot-grid">{spots.filter(s=>atlasRegion==="全部"||s.region===atlasRegion).map(s=><button key={s.id} onClick={()=>setSelectedSpot(s)}><img src={s.image} alt=""/><span><small>{s.region} · {s.county} · {s.core?"核心节点":"辅助点位"}</small><b>{s.name}</b><em>{Object.entries(s.themes).sort((a,b)=>b[1]-a[1]).slice(0,2).map(x=>x[0]).join(" · ")}</em></span></button>)}</div></section>
    <section className="saved-band desktop-only" id="saved"><div className="section"><div className="section-head light"><div><small>04 / MY ROUTES</small><h2>保存在当前浏览器中的路线</h2></div><p>无需登录；刷新或下次打开仍可继续查看。</p></div>{saved.length?<div className="saved-list">{saved.map((p,i)=><article key={p.id}><span>0{i+1}</span><div><small>{p.spots.length}个点位 · {p.days.length}天</small><b>{p.name}</b></div><button onClick={()=>{setActive(p);setPlans([p]);location.hash="results"}}>继续查看</button><button onClick={()=>{const n=saved.filter(x=>x.id!==p.id);setSaved(n);localStorage.setItem("shujing-routes",JSON.stringify(n))}}>删除</button></article>)}</div>:<p className="empty">尚未保存路线。生成并确认方案后，可在路线详情底部保存。</p>}</div></section>
    <section className="method"><div><small>我们的匹配逻辑</small><h2>不是“热门榜单”，而是需求与红色内容的双向匹配</h2><div className="method-grid"><span><b>01</b>可行性过滤<em>日期、开放时间、参观时长与预设通行时间</em></span><span><b>02</b>内容匹配<em>7类红色文化主题评分与游客偏好权重</em></span><span><b>03</b>历史校验<em>保留主题核心节点与基本叙事顺序</em></span><span><b>04</b>差异化去重<em>避免5条路线只有少量点位变化</em></span></div><p>当前为社会实践成果演示网页。开放时间与通行时间采用预设资料，临时闭馆、节假日调整及实时路况请在出行前以官方通知为准。</p></div></section>
    <footer><div className="brand inverse"><span className="seal">智</span><span><b>数智-红途</b><small>让红色历史在行走中被理解</small></span></div><p>青年红色实践智导平台 · 江西全省</p></footer>
    {selectedSpot&&<div className="drawer-backdrop" onClick={()=>setSelectedSpot(null)}><aside className="drawer" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setSelectedSpot(null)}>×</button><img src={selectedSpot.image} alt={selectedSpot.name}/><div><small>{selectedSpot.region} · {selectedSpot.county}</small><h2>{selectedSpot.name}</h2><p>{selectedSpot.intro}</p><dl><div><dt>建议停留</dt><dd>{selectedSpot.minutes}分钟</dd></div><div><dt>节点属性</dt><dd>{selectedSpot.core?"核心历史节点":"辅助体验点位"}</dd></div></dl><h3>内容维度</h3>{Object.entries(selectedSpot.themes).map(([k,v])=><span className="theme-chip" key={k}>{k} {v}/5</span>)}<p className="notice">开放信息为演示期静态资料，出行前请核验官方通知。</p></div></aside></div>}
  </main>
}
