// 地图引擎开关：svg（默认，离线兜底）| tdt（天地图）。
// 由 VITE_MAP_ENGINE 控制；未配置或非 tdt 时一律用 SVG，保证离线/无 Key 可用。
export type MapEngine = "svg" | "tdt";

export function getMapEngine(): MapEngine {
  const v = (import.meta.env?.VITE_MAP_ENGINE ?? "svg").toString().toLowerCase();
  return v === "tdt" ? "tdt" : "svg";
}

export function getTiandituTk(): string {
  return (import.meta.env?.VITE_TIANDITU_TK ?? "").toString();
}
