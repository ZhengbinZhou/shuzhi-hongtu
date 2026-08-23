"use client";
import { useEffect, useRef, useState } from "react";
import { loadTDT } from "./tdt-loader";

interface UseTianDiTuOptions {
  tk: string;
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  /** 地图初始化完成后回调，可在此添加覆盖物；返回清理函数。 */
  onReady?: (map: any, T: any) => void | (() => void);
}

interface State {
  ready: boolean;
  error: string | null;
}

/**
 * 管理天地图 Map 实例的生命周期。
 * - 单例加载脚本；StrictMode 双调用下用 inited 守卫避免重复初始化。
 * - 容器需有明确宽高（TDT 初始化时若尺寸为 0 会渲染空白）。
 */
export function useTianDiTu(
  containerRef: React.RefObject<HTMLDivElement | null>,
  opts: UseTianDiTuOptions,
) {
  const [state, setState] = useState<State>({ ready: false, error: null });
  const initedRef = useRef(false);
  const cleanupRef = useRef<void | (() => void)>(undefined);

  useEffect(() => {
    if (!opts.tk) {
      setState({ ready: false, error: "未配置天地图 Key" });
      return;
    }
    if (initedRef.current) return;
    initedRef.current = true;
    let cancelled = false;

    loadTDT(opts.tk)
      .then((T) => {
        if (cancelled || !containerRef.current) return;
        const [lng, lat] = opts.center ?? [115.9, 27.6];
        const map = new T.Map(containerRef.current);
        map.centerAndZoom(new T.LngLat(lng, lat), opts.zoom ?? 7);
        // 关闭双击放大等可选默认行为，保留缩放控件
        try {
          map.addControl(new T.Control.Zoom());
          map.addControl(new T.Control.Scale());
        } catch {
          /* 控件名在不同版本可能不同，忽略 */
        }
        setState({ ready: true, error: null });
        if (opts.onReady) {
          cleanupRef.current = opts.onReady(map, T) ?? undefined;
        }
      })
      .catch((e) => {
        if (!cancelled) setState({ ready: false, error: e.message || String(e) });
      });

    return () => {
      cancelled = true;
      if (cleanupRef.current) {
        try {
          cleanupRef.current();
        } catch {
          /* ignore */
        }
        cleanupRef.current = undefined;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
