"use client";
import { useRef, useState } from "react";
import { HeroMap } from "@/components/platform-maps";
import { useRuntimeMapConfig } from "./use-runtime-map-config";
import { useTianDiTu } from "./use-tianditu";

export interface CountyPoint {
  name: string;
  lng: number;
  lat: number;
  rings: [number, number][][];
  count: number;
}

export interface ScenicPoint {
  id: string;
  name: string;
  short: string;
  county: string;
  lng: number;
  lat: number;
  core: boolean;
}

/**
 * 天地图版首页地图：
 * - 总览缩放：以淡红行政区覆盖面表达资源覆盖，不直接堆叠 44 个点。
 * - 中等缩放：显示核心点位，帮助用户理解主要资源锚点。
 * - 深度缩放：显示全部景点与名称，适合查看具体场馆。
 */
export function TdtHeroMap({
  tk,
  counties,
  spots,
}: {
  tk: string;
  counties: CountyPoint[];
  spots: ScenicPoint[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const [detailMode, setDetailMode] = useState(false);
  const mapConfig = useRuntimeMapConfig(tk);
  const runtimeError = !mapConfig.loading ? mapConfig.error : null;
  const effectiveTk = mapConfig.tiandituTk;

  const { error } = useTianDiTu(containerRef, {
    tk: mapConfig.mapEngine === "svg" ? "" : effectiveTk,
    center: [115.35, 26.45],
    zoom: 7,
    onReady: (map, T) => {
      const allOverlays: any[] = [];
      const countyOverlays: any[] = [];
      const countyLabels: any[] = [];
      const visible = new Set<any>();

      const addVisible = (overlay: any) => {
        if (visible.has(overlay)) return;
        try {
          map.addOverLay(overlay);
          visible.add(overlay);
        } catch {
          /* 天地图重复添加时可能抛错，保持当前状态即可 */
        }
      };
      const removeVisible = (overlay: any) => {
        if (!visible.has(overlay)) return;
        try {
          map.removeOverLay(overlay);
        } catch {
          /* ignore */
        }
        visible.delete(overlay);
      };
      const setGroup = (list: any[], shouldShow: boolean) => {
        list.forEach((overlay) => shouldShow ? addVisible(overlay) : removeVisible(overlay));
      };
      counties.forEach((c) => {
        c.rings.forEach((ring) => {
          if (ring.length < 3) return;
          try {
            const polygon = new T.Polygon(ring.map(([lng, lat]) => new T.LngLat(lng, lat)), {
              color: "#7B1419",
              weight: 3,
              opacity: 0.95,
              fillColor: "#da291c",
              fillOpacity: 0.5,
            });
            countyOverlays.push(polygon);
            allOverlays.push(polygon);
          } catch {
            /* Polygon 失败时跳过该县区面 */
          }
        });
        try {
          const label = new T.Label({
            text: c.name,
            position: new T.LngLat(c.lng, c.lat),
            offset: new T.Point(-18, -8),
          });
          label.setStyle({
            color: "#641319",
            fontSize: "12px",
            fontWeight: "700",
            backgroundColor: "rgba(255,247,232,0.86)",
            border: "1px solid rgba(127,27,32,0.3)",
            padding: "2px 6px",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(91,17,23,0.12)",
          });
          countyLabels.push(label);
          allOverlays.push(label);
        } catch {
          /* Label 失败不影响主图 */
        }
      });

      const updateHtmlLabels = (zoom: number) => {
        const box = labelsRef.current;
        if (!box) return;
        box.classList.toggle("show-core", zoom >= 8);
        box.classList.toggle("show-all", zoom >= 9);
        box.classList.toggle("show-labels", zoom >= 8);
        if (typeof map.lngLatToContainerPoint !== "function") return;
        spots.forEach((spot) => {
          const node = box.querySelector<HTMLElement>(`[data-spot-id="${spot.id}"]`);
          if (!node) return;
          const point = map.lngLatToContainerPoint(new T.LngLat(spot.lng, spot.lat));
          node.style.left = `${point.x}px`;
          node.style.top = `${point.y}px`;
        });
      };
      const updateByZoom = () => {
        const zoom = typeof map.getZoom === "function" ? Number(map.getZoom()) : 7;
        setDetailMode(zoom >= 8);
        containerRef.current?.closest(".tdt-map")?.classList.toggle("tdt-map-detail", zoom >= 8);
        setGroup(countyOverlays, true);
        setGroup(countyLabels, true);
        updateHtmlLabels(zoom);
      };

      updateByZoom();
      try {
        map.addEventListener("zoomend", updateByZoom);
        map.addEventListener("moveend", updateByZoom);
        map.addEventListener("dragend", updateByZoom);
      } catch {
        /* 如果事件注册失败，仍保留初始总览层 */
      }

      return () => {
        try {
          map.removeEventListener("zoomend", updateByZoom);
          map.removeEventListener("moveend", updateByZoom);
          map.removeEventListener("dragend", updateByZoom);
        } catch {
          /* ignore */
        }
        allOverlays.forEach((overlay) => removeVisible(overlay));
      };
    },
  });

  if (mapConfig.mapEngine === "svg") return <HeroMap />;

  return (
    <div className={`hero-map tdt-map${detailMode ? " tdt-map-detail" : ""}`} aria-label="江西省天地图，高亮平台点位涉及县区">
      <div ref={containerRef} className="tdt-canvas" />
      <div ref={labelsRef} className="tdt-spot-labels" aria-hidden="true">
        {spots.map((spot) => (
          <span key={spot.id} data-spot-id={spot.id} data-core={spot.core ? "true" : "false"}>
            <i />
            <b>{spot.name}</b>
          </span>
        ))}
      </div>
      {(runtimeError || error) && <div className="tdt-error">天地图加载失败：{runtimeError || error}（请检查 Key 与网络）</div>}
      <div className="hero-map-note"><i /><span>淡红区域为资源覆盖县区</span><b>{counties.length}</b></div>
    </div>
  );
}
