#!/usr/bin/env node
// 预缓存点位间公路车程矩阵 → data/distance-matrix.json。
//
// 用法：
//   VITE_TIANDITU_TK=你的服务端Key node scripts/precompute-travel.mjs
//   # 或
//   TIANDITU_TK=xxx node scripts/precompute-travel.mjs
//
// 可选：
//   QPS=3                 限速（默认 3，天地图对个人 Key 较保守）
//   FORCE=1               忽略已有缓存，全量重算
//   LIMIT=20              只算前 N 对（调试用）
//   GEOMETRY=1            同时把道路路线几何写入 data/route-geometry.json（解析 routelatlon）
//
// 说明：
// - 无向矩阵（A->B ≈ B->A），36 个点约 630 对，3 QPS 约 4 分钟。
// - 只缓存公路车程；跨市公共交通见 data/intercity-transit.json，手工维护。
// - 红色步道（挑粮小道/祁禄山等）路网不覆盖，由点位 minutes 字段手工维护，不在此列。
// - 失败自动重试 4 次；仍失败则保留直线估算兜底，不中断整体流程。
//
// 天地图驾车 WebService（服务端 Key）：
//   https://api.tianditu.gov.cn/drive?postStr={orig,dest,style}&type=search&tk=KEY
// 返回 XML，关键字段在末尾：
//   <distance>公里</distance> <duration>秒</duration> <routelatlon>lng,lat;...</routelatlon>
// 注意：type=json 仍返回 XML，必须解析 XML。routelatlon 坐标分隔符历史版本有
// 逗号/分号两种，解析时两种都兼容。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const dataPath = path.join(root, "lib/platform-data.ts");
const matrixPath = path.join(root, "data/distance-matrix.json");
const geometryPath = path.join(root, "data/route-geometry.json");

const TK =
  process.env.VITE_TIANDITU_TK ||
  process.env.TIANDITU_TK ||
  "";
const QPS = Number(process.env.QPS || 3);
const FORCE = process.env.FORCE === "1";
const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : Infinity;
const GEOMETRY = process.env.GEOMETRY === "1";

if (!TK) {
  console.error(
    "[precompute] 未检测到天地图 Key。请设置环境变量 VITE_TIANDITU_TK 后重试。\n" +
      "           （脚本骨架已就绪；没有 Key 也可以先提交框架，等 Key 到位再运行）",
  );
  process.exit(1);
}

// ---------- 1. 从平台数据文件提取点位坐标 ----------
function extractSpots(source) {
  const spots = [];
  const re = /\{id:"([^"]+)"[^}]*?region:"([^"]+)"[^}]*?lat:([\d.]+),lng:([\d.]+)[^}]*?\}/g;
  let m;
  while ((m = re.exec(source))) {
    spots.push({
      id: m[1],
      region: m[2],
      lat: Number(m[3]),
      lng: Number(m[4]),
    });
  }
  return spots;
}

const source = fs.readFileSync(dataPath, "utf8");
const spots = extractSpots(source);
if (spots.length === 0) {
  console.error("[precompute] 未能从 lib/platform-data.ts 提取到点位，请检查正则或改为读取 data/spots.json。");
  process.exit(1);
}
console.log(`[precompute] 提取到 ${spots.length} 个点位`);

// ---------- 2. 无向配对 ----------
const pairs = [];
for (let i = 0; i < spots.length; i++) {
  for (let j = i + 1; j < spots.length; j++) {
    pairs.push([spots[i], spots[j]]);
  }
}
console.log(`[precompute] 共 ${pairs.length} 对（无向）`);

// ---------- 3. 读取现有矩阵（增量） ----------
const matrix = JSON.parse(fs.readFileSync(matrixPath, "utf8"));
matrix.pairs = matrix.pairs || {};
let geometry = { pairs: {} };
if (GEOMETRY && fs.existsSync(geometryPath)) {
  try {
    geometry = JSON.parse(fs.readFileSync(geometryPath, "utf8"));
    geometry.pairs = geometry.pairs || {};
  } catch {
    geometry = { pairs: {} };
  }
}
let skipped = 0;

// ---------- 4. 调用天地图驾车规划 ----------
async function fetchDriving(a, b) {
  const postStr = JSON.stringify({
    orig: `${a.lng},${a.lat}`,
    dest: `${b.lng},${b.lat}`,
    style: 0,
  });
  const url = `https://api.tianditu.gov.cn/drive?postStr=${encodeURIComponent(
    postStr,
  )}&type=search&tk=${TK}`;

  let lastErr;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 429 || res.status === 403) {
        const body = await res.text().catch(() => "");
        const codeMatch = body.match(/<code>(\d+)<\/code>/);
        throw { rateLimited: true, message: `HTTP ${res.status} code=${codeMatch?.[1] ?? ""}` };
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const distMatch = text.match(/<distance>([\d.]+)<\/distance>/);
      const durMatch = text.match(/<duration>([\d.]+)<\/duration>/);
      if (!distMatch || !durMatch) {
        const codeMatch = text.match(/<code>(\d+)<\/code>/) || text.match(/"code":\s*(\d+)/);
        const msgMatch = text.match(/<msg>([^<]*)<\/msg>/) || text.match(/"msg":\s*"([^"]*)"/);
        throw new Error(
          `未找到 distance/duration${codeMatch ? `（code=${codeMatch[1]}` : ""}${
            msgMatch ? `, ${msgMatch[1]}` : ""
          })`,
        );
      }
      const km = Number(distMatch[1]);
      const seconds = Number(durMatch[1]);
      if (!Number.isFinite(km) || !Number.isFinite(seconds)) {
        throw new Error(`distance/duration 非数字: ${distMatch[1]}, ${durMatch[1]}`);
      }
      let points = null;
      if (GEOMETRY) {
        const geomMatch = text.match(/<routelatlon>([\s\S]*?)<\/routelatlon>/);
        if (geomMatch) {
          points = geomMatch[1]
            .split(";")
            .map((seg) => seg.trim())
            .filter(Boolean)
            .map((seg) => {
              const parts = seg.split(/[,\s]+/).filter(Boolean).map(Number);
              return parts.length >= 2 ? [parts[0], parts[1]] : null;
            })
            .filter((p) => p && Number.isFinite(p[0]) && Number.isFinite(p[1]));
          if (points.length < 2) points = null;
        }
      }
      return {
        km: Math.round(km * 10) / 10,
        minutes: Math.round(seconds / 60),
        ...(points ? { points } : {}),
      };
    } catch (e) {
      lastErr = e;
      const backoff = e?.rateLimited ? 2000 * attempt : 800 * attempt;
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw lastErr;
}

// ---------- 5. 限速调度 ----------
const intervalMs = Math.ceil(1000 / QPS);
let scheduled = 0;
function throttle() {
  const wait = scheduled * intervalMs - Date.now();
  scheduled++;
  if (wait > 0) return new Promise((r) => setTimeout(r, wait));
  return Promise.resolve();
}

let done = 0;
let failed = 0;
let consecutiveFail = 0;
const todo = FORCE ? pairs : pairs.filter(([a, b]) => {
  const key = [a.id, b.id].sort().join("|");
  const hasMatrix = !!matrix.pairs[key];
  const needGeometry = GEOMETRY && !geometry.pairs[key];
  if (hasMatrix && !needGeometry) { skipped++; return false; }
  return true;
});
const run = todo.slice(0, LIMIT);
console.log(
  `[precompute] 待计算 ${run.length} 对（已跳过缓存 ${skipped} 对），QPS=${QPS}${GEOMETRY ? "，GEOMETRY=1" : ""}`,
);

function save(partial = false) {
  matrix._meta = {
    ...(matrix._meta || {}),
    description:
      "点位间公路车程缓存。键为两个点位 id 用 | 连接，按字典序排序（无向）。由 scripts/precompute-travel.mjs 生成。",
    source: partial ? "tianditu-driving (partial)" : "tianditu-driving",
    updated: new Date().toISOString().slice(0, 10),
    unit: "minutes/公里",
    stats: { spots: spots.length, pairs: Object.keys(matrix.pairs).length, failed },
  };
  fs.writeFileSync(matrixPath, JSON.stringify(matrix, null, 2) + "\n", "utf8");
  if (GEOMETRY) {
    geometry._meta = {
      ...(geometry._meta || {}),
      description:
        "点位间真实道路路线几何缓存。键为两个点位 id 用 | 连接，按字典序排序（无向）。points 为 [lng, lat] 坐标序列。前端命中即同步绘制，未命中则在线 T.DrivingRoute 兜底。",
      source: partial ? "tianditu-driving (partial)" : "tianditu-driving",
      updated: new Date().toISOString().slice(0, 10),
      coordinates: "天地图驾车 WebService routelatlon，经纬度",
      stats: { spots: spots.length, pairs: Object.keys(geometry.pairs).length },
    };
    fs.writeFileSync(geometryPath, JSON.stringify(geometry, null, 2) + "\n", "utf8");
  }
}

for (const [a, b] of run) {
  await throttle();
  const key = [a.id, b.id].sort().join("|");
  try {
    const r = await fetchDriving(a, b);
    const { points, ...travel } = r;
    matrix.pairs[key] = { ...travel, source: "tianditu-driving" };
    if (GEOMETRY && points) {
      geometry.pairs[key] = {
        points: points.map(([lng, lat]) => [
          Number(Number(lng).toFixed(6)),
          Number(Number(lat).toFixed(6)),
        ]),
        km: travel.km,
        minutes: travel.minutes,
      };
    }
    done++;
    consecutiveFail = 0;
    if (done % 10 === 0) {
      save(true);
      process.stdout.write(`  ...${done}/${run.length}（失败 ${failed}）\n`);
    }
  } catch (e) {
    failed++;
    consecutiveFail++;
    process.stdout.write(`  [跳过] ${a.id}->${b.id}：${e.message || e}\n`);
    if (consecutiveFail >= 10) {
      process.stdout.write("  [中止] 连续 10 次失败，疑似限流或 Key 问题，已保存进度。\n");
      break;
    }
  }
}

save(false);
console.log(
  `[precompute] 完成：新增/更新 ${done} 对，失败 ${failed} 对，矩阵总条数 ${
    Object.keys(matrix.pairs).length
  } → ${path.relative(root, matrixPath)}`,
);
if (GEOMETRY) {
  console.log(
    `[precompute] 几何缓存 ${Object.keys(geometry.pairs).length} 对 → ${path.relative(root, geometryPath)}`,
  );
}
