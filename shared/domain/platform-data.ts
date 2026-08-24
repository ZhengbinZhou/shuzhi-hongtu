import type { TravelMode } from "./travel";

export type Theme = "重要人物" | "重大事件" | "军事斗争" | "群众支前" | "政权建设" | "长征文化" | "革命精神";
export type Spot = {
  id: string; name: string; short: string; region: string; county: string;
  image: string; minutes: number; closed: number[]; core: boolean; lat: number; lng: number;
  themes: Record<Theme, number>; experience: Record<string, number>; intro: string;
};
export type PlannerCriteria = {
  county: string; startDate: string; days: number; theme1: Theme; theme2: Theme;
  experience: string; purpose: string; travelMode: TravelMode;
};

export type RouteServiceLink = {
  label: string; href: string; note: string;
};
export type RouteServices = {
  hotels: RouteServiceLink[]; charters: RouteServiceLink[];
};

export type Plan = {
  id: string; name: string; angle: string; score: number; spots: Spot[]; days: Spot[][];
  reason: string; background: string; services: RouteServices;
  dimensions: { label: string; value: number }[]; criteria: PlannerCriteria; feasible: boolean;
};

export const themeOptions: Theme[] = ["重要人物", "重大事件", "军事斗争", "群众支前", "政权建设", "长征文化", "革命精神"];
export const experiences = ["深度讲解", "现场观察", "互动体验", "轻松参观"];
export const purposes = ["思政学习", "社会实践", "党建活动", "专题调研"];
export const travelModes: { value: TravelMode; label: string; note: string }[] = [
  { value: "self", label: "自驾", note: "适合小团队自主出行" },
  { value: "charter", label: "包车", note: "适合团队集中出行" },
  { value: "transit", label: "公共交通", note: "适合跨市出行" },
];
const T = (人物:number,事件:number,军事:number,群众:number,政权:number,长征:number,精神:number):Record<Theme,number> => ({
  重要人物:人物, 重大事件:事件, 军事斗争:军事, 群众支前:群众, 政权建设:政权, 长征文化:长征, 革命精神:精神
});
const E = (讲解:number,观察:number,互动:number,轻松:number) => ({深度讲解:讲解,现场观察:观察,互动体验:互动,轻松参观:轻松});

export const spots: Spot[] = [
  {id:"J01",name:"井冈山革命博物馆",short:"革命博物馆",region:"井冈山",county:"井冈山市",image:"/landmarks/JGS01-museum.webp",minutes:90,closed:[1],core:true,lat:26.57097,lng:114.16016,themes:T(5,5,4,4,4,1,5),experience:E(5,4,3,4),intro:"系统呈现井冈山革命根据地创建、发展及其历史影响，是建立井冈山斗争完整时间线的重要起点。"},
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

export const skeletons = [
  {name:"伟大出发·长征源流线",angle:"以中央红军集结出发为叙事主轴",core:["Y02","Y04","Y03"],background:"从于都出发，最动人的不是一串年份，而是河岸、渡口和纪念园连在一起的告别场景。先在纪念馆把来龙去脉看清，再走到纪念碑和东门渡口，很多关于长征的词会变得具体：为什么要出发，谁在支援，又是谁在岸边送别。"},
  {name:"井冈星火·道路探索线",angle:"从理论探索到军事实践",core:["J01","J05","J04"],background:"这条线适合把井冈山慢慢读开。博物馆先给出整段斗争的轮廓，八角楼把人的思考拉近到一盏灯下，黄洋界再把视线带到山路、哨口和战斗现场。走完以后，井冈山不再只是一个地名，而是一条道路怎样被摸索出来的过程。"},
  {name:"信仰铸魂·初心教育线",angle:"突出重要人物与革命精神",core:["J01","J02","J03"],background:"如果这趟行程想做成一次沉静的初心教育，可以从这条线开始。博物馆讲清历史，烈士陵园让人停下来致敬，茨坪旧址群则把当年的工作、生活和组织运行摆到眼前。它不追求赶点，重在让人真正进入那段精神世界。"},
  {name:"军民同心·群众支前线",angle:"看见革命胜利背后的群众力量",core:["Y03","Y05","Y06","Y07"],background:"这条线看的不是单个英雄故事，而是很多普通人如何托起一段历史。东门渡口、宗祠旧址、省委旧址和省苏旧址连起来，会看到送别、借屋、筹粮、动员这些细节。它很适合做社会实践，因为问题会自然冒出来：群众为什么愿意支持，地方又怎样被组织起来。"},
  {name:"行走课堂·实践观察线",angle:"强调现场观察与身体体验",core:["J03","J09","J06"],background:"这不是坐在车上看风景的路线。茨坪旧址群先让人知道根据地如何运转，挑粮小道把艰苦奋斗变成脚下的坡度和汗水，小井红军医院旧址再把保障、救治和牺牲带回眼前。适合边走边记，也适合团队做体验式研学。"},
  {name:"新长征·时代发展线",angle:"连接红色记忆与乡村振兴",core:["Y01","Y10","Y05"],background:"这条线把历史和今天放在一起看。长征出发地纪念园回答“从哪里出发”，潭头村让人看到红色资源怎样进入当代乡村生活，葛氏宗祠则把地方社会与革命记忆重新接上。它适合做观察报告，也适合讨论红色文化如何继续生长。"},
  {name:"共和国摇篮·苏区政权线",angle:"从叶坪到沙洲坝理解治国理政探索",core:["R01","R04","R03"],background:"瑞金这条线的重点，是看一个新政权曾经怎样在苏区落地。叶坪旧址群有机构和日常，二苏大旧址有制度建设的现场，中央苏区博物馆把这些片段收束成完整脉络。它适合带着“共和国摇篮”这个问题去看，而不是只拍几张旧址照片。"},
  {name:"饮水思源·群众路线",angle:"从红井故事理解初心与群众工作",core:["R02","R01","R06"],background:"红井的故事容易记住，但真正值得多走几步的是它背后的关系：干部怎样贴近群众，群众又怎样把信任交给革命。沙洲坝、叶坪和纪念园放在一起，会让“饮水思源”不只是口号，而是能在生活细节里看见的初心。"},
  {name:"军旗升起·英雄城线",angle:"沿八一起义旧址追溯人民军队创建",core:["N01","N04","N02"],background:"南昌的好处是历史点位和城市生活贴得很近。纪念馆讲起义全貌，贺龙指挥部旧址把决策与部署拉到一间具体的空间里，纪念塔则把记忆放回英雄城的街道中心。时间不长，但信息密度很高。"},
  {name:"工运先声·安源初心线",angle:"理解早期工人运动与群众组织",core:["A01","A02","A03"],background:"安源这条线很适合看“组织”两个字如何从口号变成行动。纪念馆讲清工运脉络，工人俱乐部旧址保留了群众活动的空间感，秋收起义广场再把早期工运和后来的革命进程接起来。走起来紧凑，但主题非常清楚。"},
  {name:"信仰如炬·上饶英烈线",angle:"在狱中斗争遗址体悟信仰与气节",core:["S01","S02","S03"],background:"上饶这条线的情绪会更沉一些。集中营纪念馆和茅家岭监狱旧址让人直面艰难处境，方志敏纪念馆则把信仰、文字和牺牲连起来。它不适合走得太匆忙，留一点时间沉默，反而更有力量。"},
  {name:"调查研究·苏区作风线",angle:"以长冈乡、寻乌调查理解群众路线",core:["XG2","XG3","XW1"],background:"这条线适合带着问题上路：调查研究到底调查什么，为什么要走到群众中间去。长冈乡、潋江书院和寻乌调查相关点位连起来，不只是看旧址，更像跟着一套工作方法往前走。对于做调研和社会实践的团队，尤其对路。"},
  {name:"军民同心·将军县线",angle:"从兴国支前史理解苏区军民关系",core:["XG1","XG2","XG3"],background:"兴国的故事很集中，也很有分量。将军园看到一方土地走出的革命队伍，长冈乡调查纪念馆看到干部作风，潋江书院旧居则把人物和地方联系起来。一个区域内就能形成完整主题，行程不会散。"},
  {name:"反围剿·中央苏区军事线",angle:"连接宁都起义与苏区军事斗争",core:["ND1","ND2","R05"],background:"这条线更适合对军事斗争和队伍建设感兴趣的团队。宁都起义、小布红色旧址群和瑞金军事旧址连起来，会看到中央苏区不是抽象的版图，而是一连串选择、指挥、转折和坚持。跨区域行程会先尽量走完一个地方，再接到下一个地方。"},
  {name:"百年征程·江西党史线",angle:"从革命年代延伸至建设时期",core:["N01","J01","LS1"],background:"如果想把江西放进更长的党史脉络里，这条线更合适。南昌、井冈山和庐山分别对应不同阶段：军旗升起、道路探索、建设时期的重要会议。跨度大，节奏也更开阔，适合时间充裕、想建立整体视野的团队。"},
];
export const counties = Array.from(new Set(spots.map(s=>s.county)));
export const regions = ["全部", ...Array.from(new Set(spots.map(s=>s.region)))];
export const platformCountyNames = counties;
