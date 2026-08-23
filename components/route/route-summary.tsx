"use client";
// 路线规划摘要容器：把 travelEngine 算出的逐段路程/方式/时间/里程可视化。
// - 数据来源全部来自 lib/route/travel.ts，不重复实现路程逻辑。
// - 头部：交通方式、总里程、总车程、途经点位数。
// - 徽标行：按 source 统计（matrix=真实公路车程，是 946 对预缓存矩阵生效的直接证据）。
// - 时间线：相邻点位逐段；命中跨市公共交通时展开接驳/干线/接驳三段。

import { travelEngine, type TravelMode, type TravelResult } from "../../lib/route/travel";

interface RouteSpot {
  id: string;
  name: string;
  short?: string;
  region: string;
  county?: string;
  lat: number;
  lng: number;
  minutes: number;
}

const MODE_LABEL: Record<TravelMode, string> = {
  self: "自驾",
  charter: "包车",
  transit: "公共交通",
};

const SOURCE_LABEL: Record<string, string> = {
  matrix: "真实公路车程",
  straight: "直线估算",
  intercity: "跨市公共交通",
  "intercity-fallback": "公交暂缺·公路估算",
};

function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h && m) return `${h}小时${m}分`;
  if (h) return `${h}小时`;
  return `${m}分钟`;
}

export function RouteSummary({ spots, mode }: { spots: RouteSpot[]; mode: TravelMode }) {
  // 逐段计算（相邻点位）。同时汇总参观时长与车程。
  const legs: { from: RouteSpot; to: RouteSpot; result: TravelResult }[] = [];
  let driveKm = 0;
  let driveMin = 0;
  let visitMin = 0;
  const sourceCount: Record<string, number> = {};

  for (let i = 0; i < spots.length; i++) {
    visitMin += spots[i].minutes;
    if (i > 0) {
      const result = travelEngine.travel(spots[i - 1], spots[i], mode);
      legs.push({ from: spots[i - 1], to: spots[i], result });
      driveKm += result.km;
      driveMin += result.minutes;
      sourceCount[result.source] = (sourceCount[result.source] ?? 0) + 1;
    }
  }

  const badges = ["matrix", "straight", "intercity", "intercity-fallback"]
    .filter((k) => sourceCount[k] > 0)
    .map((k) => ({ key: k, label: SOURCE_LABEL[k], n: sourceCount[k] }));

  return (
    <div className="route-board" aria-label="路线规划摘要">
      <div className="route-board-head">
        <div className="route-board-title">
          <small>ROUTE PLAN</small>
          <h4>路线规划 · {MODE_LABEL[mode]}</h4>
        </div>
        <div className="route-stats">
          <div><b>{spots.length}</b><span>个点位</span></div>
          <div><b>{driveKm.toFixed(0)}</b><span>公里车程</span></div>
          <div><b>{fmtDuration(driveMin)}</b><span>路上时间</span></div>
          <div><b>{fmtDuration(visitMin)}</b><span>参观时长</span></div>
        </div>
      </div>

      {badges.length > 0 && (
        <div className="route-source-badges">
          {badges.map((b) => (
            <span key={b.key} className={`route-badge route-badge-${b.key}`}>
              {b.label} · {b.n} 段
            </span>
          ))}
        </div>
      )}

      {legs.length > 0 && (
        <ol className="route-legs">
          {legs.map((leg, i) => (
            <li key={`${leg.from.id}-${leg.to.id}-${i}`} className="route-leg">
              <div className="route-leg-main">
                <span className="route-leg-idx">{i + 1}</span>
                <span className="route-leg-name">
                  {leg.from.short ?? leg.from.name} <i>→</i> {leg.to.short ?? leg.to.name}
                </span>
                <span className="route-leg-meta">
                  {leg.result.km.toFixed(1)} km · {fmtDuration(leg.result.minutes)}
                </span>
              </div>
              {leg.result.segments && leg.result.segments.length > 0 && (
                <ul className="route-leg-segs">
                  {leg.result.segments.map((seg, j) => (
                    <li key={j} className={`route-leg-seg seg-${seg.kind}`}>
                      <span className="seg-kind">
                        {seg.kind === "rail" ? "高铁/火车" : seg.kind === "coach" ? "客运大巴" : "接驳"}
                      </span>
                      <span className="seg-path">{seg.from} <i>→</i> {seg.to}</span>
                      <span className="seg-min">{fmtDuration(seg.minutes)}</span>
                    </li>
                  ))}
                </ul>
              )}
              {leg.result.source === "intercity-fallback" && (
                <p className="route-leg-warn">该跨市段暂无班次数据，暂按公路里程估算。</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
