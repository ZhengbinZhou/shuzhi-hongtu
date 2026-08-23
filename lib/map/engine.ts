// 地图引擎开关：tdt（默认，天地图）| svg（离线兜底）。
// 浏览器端天地图 key 从环境变量读取，避免提交到公开代码仓库。
export type MapEngine = "svg" | "tdt";

export function getMapEngine(): MapEngine {
  const v = (import.meta.env?.VITE_MAP_ENGINE ?? "tdt").toString().toLowerCase();
  return v === "svg" ? "svg" : "tdt";
}

export function getTiandituTk(): string {
  return (import.meta.env?.VITE_TIANDITU_TK ?? "").toString();
}
