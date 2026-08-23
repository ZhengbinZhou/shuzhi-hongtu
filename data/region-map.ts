// 红色区域 → 地级市映射，用于判断是否需要跨市公共交通。
// 同一地级市内部默认走公路（驾车/包车），不查市际通联表。
export const REGION_CITY: Record<string, string> = {
  井冈山: "吉安",
  于都: "赣州",
  瑞金: "赣州",
  兴国: "赣州",
  宁都: "赣州",
  寻乌: "赣州",
  南昌: "南昌",
  安源: "萍乡",
  上饶: "上饶",
  庐山: "九江",
};

export function cityOf(region: string): string {
  return REGION_CITY[region] ?? region;
}
