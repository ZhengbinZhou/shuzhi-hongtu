"use client";

import { useEffect, useState } from "react";

import { getMapEngine, getTiandituTk, type MapEngine } from "@/lib/map/engine";

interface RuntimeMapConfig {
  error: string | null;
  loading: boolean;
  mapEngine: MapEngine;
  tiandituTk: string;
}

function normalizeMapEngine(value: unknown): MapEngine {
  return String(value ?? "").toLowerCase() === "svg" ? "svg" : "tdt";
}

export function useRuntimeMapConfig(initialTk = getTiandituTk(), initialEngine = getMapEngine()): RuntimeMapConfig {
  const [config, setConfig] = useState<RuntimeMapConfig>({
    error: null,
    loading: initialEngine === "tdt" && !initialTk,
    mapEngine: initialEngine,
    tiandituTk: initialTk,
  });

  useEffect(() => {
    if (initialEngine !== "tdt" || initialTk) return;
    let cancelled = false;

    fetch("/api/map-config", { headers: { Accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) throw new Error(`地图配置接口返回 ${response.status}`);
        return response.json() as Promise<{ mapEngine?: unknown; tiandituTk?: unknown }>;
      })
      .then((data) => {
        if (cancelled) return;
        const mapEngine = normalizeMapEngine(data.mapEngine);
        const tiandituTk = typeof data.tiandituTk === "string" ? data.tiandituTk : "";
        setConfig({
          error: mapEngine === "tdt" && !tiandituTk ? "未配置天地图 Key" : null,
          loading: false,
          mapEngine,
          tiandituTk,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setConfig((current) => ({
          ...current,
          error: error instanceof Error ? error.message : "地图配置加载失败",
          loading: false,
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [initialEngine, initialTk]);

  return config;
}
