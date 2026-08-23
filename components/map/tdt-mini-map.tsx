"use client";
import { useRef } from "react";
import { useRuntimeMapConfig } from "./use-runtime-map-config";
import { useTianDiTu } from "./use-tianditu";

export interface MiniSpot {
  id: string;
  name: string;
  lng: number;
  lat: number;
}

/**
 * 天地图版路线地图：编号 Marker + 连线 + 点击打开点位抽屉。
 * 视野自动适配路线内所有点位。
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

  const { error } = useTianDiTu(containerRef, {
    tk: effectiveTk,
    zoom: 8,
    onReady: (map, T) => {
      const overlays: any[] = [];

      // 编号图标
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

      // 路线连线
      if (spots.length > 1) {
        const line = new T.Polyline(
          spots.map((s) => new T.LngLat(s.lng, s.lat)),
          { color: "#8b1f24", weight: 3, opacity: 0.85, lineStyle: "dashed" },
        );
        map.addOverLay(line);
        overlays.push(line);
      }

      // 视野适配
      try {
        const lngs = spots.map((s) => s.lng);
        const lats = spots.map((s) => s.lat);
        const sw = new T.LngLat(Math.min(...lngs), Math.min(...lats));
        const ne = new T.LngLat(Math.max(...lngs), Math.max(...lats));
        const bounds = new T.LngLatBounds(sw, ne);
        map.setViewport(bounds);
      } catch {
        /* setViewport 签名因版本而异，失败则用默认 */
      }

      return () => overlays.forEach((o) => map.removeOverLay(o));
    },
  });

  return (
    <div className="route-map tdt-map" aria-label="路线天地图">
      <div ref={containerRef} className="tdt-canvas" />
      {(runtimeError || error) && <div className="tdt-error">天地图加载失败：{runtimeError || error}</div>}
      <div className="map-caption">
        <span>天地图 · CGCS2000 坐标系</span>
        <span>点击编号查看点位详情</span>
      </div>
    </div>
  );
}
