// 路线几何取线模块（方案 C）。
//
// 四级来源：
//   1. 内存缓存（本次会话已取过的段）
//   2. 随包发布的静态缓存 data/route-geometry.json（构建期由 precompute 脚本预热）
//   3. 浏览器端在线调用天地图 JS API 的 T.DrivingRoute
//   4. 全部失败 → 两点直线兜底（与旧版视觉一致）
//
// 为避免天地图 JS API 在 setViewport 之后异步 addOverLay 不触发重绘的问题，
// 提供 getStaticGeometrySync() 同步函数：onReady 里可在 setViewport 之前
// 一次性把所有静态命中段画完，零异步、零闪烁。未命中段再走在线兜底。

import staticGeometry from "../../data/route-geometry.json";

export interface LngLat {
  lng: number;
  lat: number;
}

export interface RouteGeometrySource {
  source: "memory" | "static" | "online" | "straight";
  error?: string;
}

export interface RouteGeometryResult extends RouteGeometrySource {
  points: LngLat[];
}

interface GeometryPair {
  points: [number, number][];
  km?: number;
  minutes?: number;
}

type GeometryMap = Record<string, GeometryPair>;

const staticPairs: GeometryMap =
  (staticGeometry as { pairs?: GeometryMap }).pairs ?? {};

const memoryCache = new Map<string, LngLat[]>();
const failedCache = new Map<string, string>();

export function geometryKey(a: { id: string }, b: { id: string }): string {
  return [a.id, b.id].sort().join("|");
}

function fromStatic(key: string): LngLat[] | null {
  const pair = staticPairs[key];
  if (!pair || !Array.isArray(pair.points) || pair.points.length < 2) {
    return null;
  }
  return pair.points.map(([lng, lat]) => ({ lng, lat }));
}

/**
 * 同步取静态（内存或随包 JSON）几何，不发起任何网络请求。
 * 供 onReady 在 setViewport 之前同步绘制全部命中段，避免异步重绘问题。
 * 返回 null 表示未命中，调用方应改走 getRouteGeometry() 在线兜底。
 */
export function getStaticGeometrySync(
  a: { id: string },
  b: { id: string },
): LngLat[] | null {
  const key = geometryKey(a, b);
  const mem = memoryCache.get(key);
  if (mem) return mem;
  const hit = fromStatic(key);
  if (hit) {
    memoryCache.set(key, hit);
    return hit;
  }
  return null;
}

function straightFallback(a: LngLat, b: LngLat): LngLat[] {
  return [
    { lng: a.lng, lat: a.lat },
    { lng: b.lng, lat: b.lat },
  ];
}

function toLngLat(p: any): LngLat | null {
  if (!p) return null;
  const lng =
    typeof p.getLng === "function" ? p.getLng() : (p.lng ?? p.lon ?? p.x);
  const lat =
    typeof p.getLat === "function" ? p.getLat() : (p.lat ?? p.y);
  const lngN = Number(lng);
  const latN = Number(lat);
  if (!Number.isFinite(lngN) || !Number.isFinite(latN)) return null;
  return { lng: lngN, lat: latN };
}

function extractPath(result: any): LngLat[] | null {
  const plan =
    result?.getPlan?.(0) ??
    result?.getResults?.()?.getPlan?.(0) ??
    result?.plan ??
    result?.results?.plan ??
    result?.results?.plans?.[0] ??
    result;
  const routeObj =
    plan?.getRoute?.(0) ?? plan?.route ?? plan?.routes?.[0] ?? plan;
  const raw =
    routeObj?.getPath?.() ??
    routeObj?.getPath ??
    routeObj?.path ??
    routeObj?.points;
  if (!Array.isArray(raw) || raw.length < 2) return null;
  const pts = raw.map(toLngLat).filter((p): p is LngLat => p !== null);
  return pts.length >= 2 ? pts : null;
}

function fetchOnlineOnce(
  T: any,
  a: LngLat,
  b: LngLat,
  label?: string,
): Promise<LngLat[]> {
  return new Promise((resolve, reject) => {
    let route: any;
    try {
      route = new T.DrivingRoute(null, {
        onSearchComplete: (result: any) => {
          try {
            const pts = extractPath(result);
            if (pts) {
              if (label) console.log(`[route-geo] ${label}: ${pts.length} 个路径点`);
              resolve(pts);
              return;
            }
            const status =
              (typeof route?.getStatus === "function" && route.getStatus()) ??
              result?.status ??
              (typeof result?.getStatus === "function" && result.getStatus());
            const msg =
              result?.getMessage?.() ?? result?.message ?? "返回空路径";
            let dump = "";
            try {
              if (result && typeof result === "object") {
                const keys = Object.keys(result).slice(0, 20).join(",");
                dump = ` resultKeys=[${keys}]`;
              }
            } catch {
              /* ignore */
            }
            reject(
              new Error(
                `DrivingRoute ${msg}${status !== undefined && status !== null ? ` (status=${status})` : ""}${dump}`,
              ),
            );
          } catch (e) {
            reject(e instanceof Error ? e : new Error(String(e)));
          }
        },
      });
    } catch (e) {
      reject(e instanceof Error ? e : new Error(String(e)));
      return;
    }
    try {
      route.search(new T.LngLat(a.lng, a.lat), new T.LngLat(b.lng, b.lat));
    } catch (e) {
      reject(e instanceof Error ? e : new Error(String(e)));
    }
  });
}

let onlineQueue: Promise<unknown> = Promise.resolve();
function enqueueOnline<T>(fn: () => Promise<T>): Promise<T> {
  const run = onlineQueue.then(
    () => new Promise<void>((resolve) => setTimeout(resolve, 150)).then(fn),
    () => new Promise<void>((resolve) => setTimeout(resolve, 150)).then(fn),
  );
  onlineQueue = run.catch(() => {});
  return run;
}

function fetchOnline(T: any, a: LngLat, b: LngLat, label?: string): Promise<LngLat[]> {
  return enqueueOnline(() =>
    fetchOnlineOnce(T, a, b, label).catch((err) => {
      console.warn(`[route-geo] 首次失败 ${label ?? ""}: ${err.message}，1.2s 后重试...`);
      return new Promise<LngLat[]>((resolve) => setTimeout(resolve, 1200)).then(() =>
        fetchOnlineOnce(T, a, b, label),
      );
    }),
  );
}

export interface GetGeometryOptions {
  T?: any;
  timeoutMs?: number;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("DrivingRoute 超时")), ms);
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

export async function getRouteGeometry(
  a: { id: string; lng: number; lat: number },
  b: { id: string; lng: number; lat: number },
  opts: GetGeometryOptions = {},
): Promise<RouteGeometryResult> {
  const key = geometryKey(a, b);

  const mem = memoryCache.get(key);
  if (mem) return { points: mem, source: "memory" };

  const staticHit = fromStatic(key);
  if (staticHit) {
    memoryCache.set(key, staticHit);
    return { points: staticHit, source: "static" };
  }

  if (!opts.T) {
    return { points: straightFallback(a, b), source: "straight" };
  }

  const label = `${a.id}->${b.id}`;
  const priorFail = failedCache.get(key);
  if (priorFail) {
    console.warn(`[route-geo] ${label} 已失败过，直接回退直线：${priorFail}`);
    return { points: straightFallback(a, b), source: "straight", error: priorFail };
  }

  try {
    const points = await withTimeout(
      fetchOnline(opts.T, a, b, label),
      opts.timeoutMs ?? 15000,
    );
    memoryCache.set(key, points);
    return { points, source: "online" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[route-geo] ${label} 失败：${msg}`);
    failedCache.set(key, msg);
    return { points: straightFallback(a, b), source: "straight", error: msg };
  }
}

export async function getRouteGeometries(
  spots: ReadonlyArray<{ id: string; lng: number; lat: number }>,
  opts: GetGeometryOptions = {},
  onProgress?: (index: number, result: RouteGeometryResult) => void,
): Promise<RouteGeometryResult[]> {
  if (spots.length < 2) return [];
  const results: RouteGeometryResult[] = new Array(spots.length - 1);
  for (let i = 0; i < spots.length - 1; i++) {
    const r = await getRouteGeometry(spots[i], spots[i + 1], opts);
    results[i] = r;
    onProgress?.(i, r);
  }
  return results;
}

export function dumpOnlineGeometry(): Record<string, GeometryPair> {
  const out: Record<string, GeometryPair> = {};
  for (const [key, points] of memoryCache.entries()) {
    if (staticPairs[key]) continue;
    out[key] = {
      points: points.map((p) => [
        Number(p.lng.toFixed(6)),
        Number(p.lat.toFixed(6)),
      ]),
    };
  }
  return out;
}

export function getGeometryCacheStats() {
  return {
    memory: memoryCache.size,
    static: Object.keys(staticPairs).length,
    failed: failedCache.size,
  };
}

export function clearFailedGeometryCache() {
  failedCache.clear();
}

if (typeof window !== "undefined") {
  (window as any).__routeGeo = {
    getStats: getGeometryCacheStats,
    dumpOnline: dumpOnlineGeometry,
    retryFailed: () => {
      failedCache.clear();
      return "已清空失败缓存，重新生成路线即可重试";
    },
  };
}
