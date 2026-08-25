"use client";
import { useRef, useState } from "react";
import { useRuntimeMapConfig } from "./use-runtime-map-config";
import { useTianDiTu } from "./use-tianditu";
import {
  getRouteGeometries,
  getStaticGeometrySync,
  type LngLat,
  type RouteGeometryResult,
} from "../../lib/route/geometry";

export interface MiniSpot {
  id: string;
  name: string;
  lng: number;
  lat: number;
}

/**
 * 天地图版路线地图：编号 Marker + 真实道路路线 + 点击打开点位抽屉。
 *
 * 关键渲染策略（解决此前"有数据但部分折线不显示"问题）：
 *   1. onReady 里先对每段调用同步函数 getStaticGeometrySync()，命中静态缓存的段
 *      在 setViewport 之前就 new T.Polyline + addOverLay，零异步，必绘。
 *   2. 只有未命中的段才走异步 getRouteGeometries()（在线 T.DrivingRoute / 直线兜底），
 *      取回后追加绘制并重新 setViewport。
 * 这样静态全量预加载的路线首屏即完整显示，不再依赖异步重绘。
 */
export function TdtMiniMap({
  tk,
  spots,
  onSelect,
}: {
  tk: string;
  spots: MiniSpot[];
  onSelect?: (spot: MiniSpot) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapConfig = useRuntimeMapConfig(tk);
  const runtimeError = !mapConfig.loading ? mapConfig.error : null;
  const effectiveTk = mapConfig.tiandituTk;
  const [routeState, setRouteState] = useState<{
    loading: boolean;
    source: "static" | "online" | "straight" | "mixed" | "none";
    failed: number;
  }>({ loading: spots.length > 1, source: "none", failed: 0 });

  const { error } = useTianDiTu(containerRef, {
    tk: effectiveTk,
    zoom: 8,
    onReady: (map, T) => {
      const overlays: any[] = [];
      let cancelled = false;

      const numberedIcon = (n: number) =>
        new T.Icon({
          iconUrl:
            "data:image/svg+xml;charset=utf-8," +
            encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 26 34">
                <path d="M13 0C5.8 0 0 5.8 0 13c0 9.1 13 21 13 21s13-11.9 13-21C26 5.8 20.2 0 13 0z" fill="#8b1f24" stroke="#fff8e9" stroke-width="1.5"/>
                <text x="13" y="18" text-anchor="middle" fill="#fff" font-size="13" font-weight="800" font-family="sans-serif">${n}</text>
              </svg>`,
            ),
          iconSize: new T.Point(26, 34),
          iconAnchor: new T.Point(13, 32),
        });

      // ---- 编号 Marker ----
      spots.forEach((s, i) => {
        const marker = new T.Marker(new T.LngLat(s.lng, s.lat), {
          icon: numberedIcon(i + 1),
          title: s.name,
        });
        if (onSelect) {
          marker.addEventListener("click", () => onSelect(s));
        }
        map.addOverLay(marker);
        overlays.push(marker);
      });

      // ---- 同步绘制所有静态缓存命中段（setViewport 之前）----
      // 每段都记录几何，用于 setViewport 的 bounds 计算；未命中段先记 null。
      const segmentPoints: (LngLat[] | null)[] = [];
      let staticCount = 0;
      const allPtsForBounds: { lng: number; lat: number }[] = spots.map((s) => ({
        lng: s.lng,
        lat: s.lat,
      }));

      if (spots.length > 1) {
        for (let i = 0; i < spots.length - 1; i++) {
          const a = spots[i];
          const b = spots[i + 1];
          const pts = getStaticGeometrySync(a, b);
          if (pts && pts.length >= 2) {
            segmentPoints[i] = pts;
            staticCount++;
            const lnglats = pts.map((p) => new T.LngLat(p.lng, p.lat));
            const line = new T.Polyline(lnglats, {
              color: "#8b1f24",
              weight: 5,
              opacity: 0.95,
            });
            try {
              line.setZIndex?.(400);
            } catch {
              /* ignore */
            }
            map.addOverLay(line);
            overlays.push(line);
            pts.forEach((p) => allPtsForBounds.push({ lng: p.lng, lat: p.lat }));
          } else {
            segmentPoints[i] = null;
          }
        }
      }

      // ---- 视野适配：以点位 + 已同步绘制的路线点为准 ----
      try {
        const lngs = allPtsForBounds.map((p) => p.lng);
        const lats = allPtsForBounds.map((p) => p.lat);
        const bounds = new T.LngLatBounds(
          new T.LngLat(Math.min(...lngs), Math.min(...lats)),
          new T.LngLat(Math.max(...lngs), Math.max(...lats)),
        );
        map.setViewport(bounds);
      } catch {
        /* setViewport 签名因版本而异 */
      }

      if (staticCount > 0) {
        console.log(`[route-geo] 同步绘制静态路线 ${staticCount}/${spots.length - 1} 段`);
      }

      // ---- 未命中段：在线兜底（异步），取回后追加并重新适配 ----
      const missingIndices: number[] = [];
      for (let i = 0; i < segmentPoints.length; i++) {
        if (!segmentPoints[i]) missingIndices.push(i);
      }

      if (missingIndices.length === 0 && spots.length > 1) {
        // 全部静态命中
        setRouteState({
          loading: false,
          source: "static",
          failed: 0,
        });
      } else if (missingIndices.length > 0) {
        if (spots.length < 2) {
          setRouteState({ loading: false, source: "none", failed: 0 });
        } else {
          let onlineCount = 0;
          let straightCount = 0;
          // 占位直线（仅在有未命中段时），避免首屏这些段空白
          let placeholderLine: any = null;
          if (staticCount < spots.length - 1) {
            placeholderLine = new T.Polyline(
              spots.map((s) => new T.LngLat(s.lng, s.lat)),
              { color: "#8b1f24", weight: 2, opacity: 0.45, lineStyle: "dashed" },
            );
            map.addOverLay(placeholderLine);
            overlays.push(placeholderLine);
          }
          const removePlaceholder = () => {
            if (!placeholderLine) return;
            try {
              map.removeOverLay(placeholderLine);
            } catch {
              /* ignore */
            }
            const idx = overlays.indexOf(placeholderLine);
            if (idx >= 0) overlays.splice(idx, 1);
            placeholderLine = null;
          };

          getRouteGeometries(
            spots,
            { T, timeoutMs: 15000 },
            (i, r) => {
              if (cancelled) return;
              // 静态命中的段已画过，跳过
              if (segmentPoints[i]) return;
              segmentPoints[i] = r.points;
              if (r.source === "online") onlineCount++;
              else if (r.source === "straight") straightCount++;
              const pts = r.points;
              if (pts.length >= 2) {
                const isFallback = r.source === "straight";
                const lnglats = pts.map((p) => new T.LngLat(p.lng, p.lat));
                const line = new T.Polyline(
                  lnglats,
                  isFallback
                    ? { color: "#8b1f24", weight: 3, opacity: 0.7, lineStyle: "dashed" }
                    : { color: "#8b1f24", weight: 5, opacity: 0.95 },
                );
                try {
                  line.setZIndex?.(400);
                } catch {
                  /* ignore */
                }
                map.addOverLay(line);
                overlays.push(line);
              }
            },
          )
            .then(() => {
              if (cancelled) return;
              removePlaceholder();
              // 重新按全部路线点适配
              const allPts: { lng: number; lat: number }[] = spots.map((s) => ({
                lng: s.lng,
                lat: s.lat,
              }));
              segmentPoints.forEach((pts) => {
                pts?.forEach((p) => allPts.push({ lng: p.lng, lat: p.lat }));
              });
              if (allPts.length >= 2) {
                try {
                  const lngs = allPts.map((p) => p.lng);
                  const lats = allPts.map((p) => p.lat);
                  map.setViewport(
                    new T.LngLatBounds(
                      new T.LngLat(Math.min(...lngs), Math.min(...lats)),
                      new T.LngLat(Math.max(...lngs), Math.max(...lats)),
                    ),
                  );
                } catch {
                  /* ignore */
                }
              }
              try {
                map.checkResize?.();
              } catch {
                /* ignore */
              }
              try {
                map.panBy?.(new T.Point(0, 0));
              } catch {
                /* ignore */
              }
              const total = spots.length - 1;
              const source =
                straightCount === total
                  ? "straight"
                  : straightCount > 0
                    ? "mixed"
                    : onlineCount > 0
                      ? "online"
                      : "static";
              setRouteState({ loading: false, source, failed: straightCount });
            })
            .catch(() => {
              if (cancelled) return;
              setRouteState({
                loading: false,
                source: "straight",
                failed: missingIndices.length,
              });
            });
        }
      }

      return () => {
        cancelled = true;
        overlays.forEach((o) => {
          try {
            map.removeOverLay(o);
          } catch {
            /* ignore */
          }
        });
      };
    },
  });

  const caption = (() => {
    if (routeState.loading) return "正在规划道路路线…";
    switch (routeState.source) {
      case "online":
        return "天地图 · 实时道路路线";
      case "static":
        return "天地图 · 缓存道路路线";
      case "mixed":
        return `天地图 · 道路路线（${routeState.failed} 段直线示意）`;
      case "straight":
        return "天地图 · 直线示意（路线规划暂不可用）";
      default:
        return "天地图 · CGCS2000 坐标系";
    }
  })();

  return (
    <div className="route-map tdt-map" aria-label="路线天地图">
      <div ref={containerRef} className="tdt-canvas" />
      {(runtimeError || error) && (
        <div className="tdt-error">天地图加载失败：{runtimeError || error}</div>
      )}
      <div className="map-caption">
        <span>{caption}</span>
        <span>点击编号查看点位详情</span>
      </div>
    </div>
  );
}
