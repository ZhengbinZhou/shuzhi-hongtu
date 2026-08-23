// 地图引擎开关：tdt（默认，天地图）| svg（离线兜底）。
// 浏览器端天地图 key 本身会暴露给前端，这里提供默认值以保证托管站点也能加载 API 地图。
export type MapEngine = "svg" | "tdt";

const DEFAULT_TIANDITU_TK = "bfb495435a8826c96a7d89b7c9729bc7";

export function getMapEngine(): MapEngine {
  const v = (import.meta.env?.VITE_MAP_ENGINE ?? "tdt").toString().toLowerCase();
  return v === "svg" ? "svg" : "tdt";
}

export function getTiandituTk(): string {
  return (import.meta.env?.VITE_TIANDITU_TK ?? DEFAULT_TIANDITU_TK).toString();
}
