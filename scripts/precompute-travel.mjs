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
//
// 说明：
// - 无向矩阵（A->B ≈ B->A），100 个点约 4950 对，3 QPS 约半小时。
// - 只缓存公路车程；跨市公共交通见 data/intercity-transit.json，手工维护。
// - 红色步道（挑粮小道/祁禄山等）路网不覆盖，由点位 minutes 字段手工维护，不在此列。
// - 失败自动重试 3 次；仍失败则保留直线估算兜底，不中断整体流程。
//
// 天地图驾车 WebService（服务端 Key）：
//   https://api.tianditu.gov.cn/drive?postStr={orig,dest,style}&type=search&tk=KEY
// 返回 XML，关键字段在末尾：<distance>公里</distance> <duration>秒</duration>
// 注意：type=json 仍返回 XML，必须解析 XML。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const dataPath = path.join(root, "lib/platform-data.ts");
const matrixPath = path.join(root, "data/distance-matrix.json");

const TK =
  process.env.VITE_TIANDITU_TK ||
  process.env.TIANDITU_TK ||
  "";
const QPS = Number(process.env.QPS || 3);
const FORCE = process.env.FORCE === "1";
const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : Infinity;

if (!TK) {
  console.error(
    "[precompute] 未检测到天地图 Key。请设置环境变量 VITE_TIANDITU_TK 后重试。\n" +
      "           （脚本骨架已就绪；没有 Key 也可以先提交框架，等 Key 到位再运行）",
  );
  process.exit(1);
}

// ---------- 1. 从平台数据文件提取点位坐标 ----------
// spots 目前集中在 lib/platform-data.ts；预计算脚本只需要 id/region/lat/lng。
function extractSpots(source) {
  const spots = [];
  // 匹配每个点位对象块：{id:"...",name:"...",...}
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
let skipped = 0;

// ---------- 4. 调用天地图驾车规划 ----------
// 字段以官方文档为准；此处做防御式解析。
async function fetchDriving(a, b) {
  const postStr = JSON.stringify({
    orig: `${a.lng},${a.lat}`,
    dest: `${b.lng},${b.lat}`,
    style: 0, // 0 推荐路线
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
      // 天地图驾车接口固定返回 XML（即使带 type=json），总距离/时长在末尾：
      //   <distance>2.54</distance>  单位：公里
      //   <duration>291.0</duration>  单位：秒
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
      return {
        km: Math.round(km * 10) / 10,
        minutes: Math.round(seconds / 60),
      };
    } catch (e) {
      lastErr = e;
      // 限流：指数退避，等更久
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
  if (matrix.pairs[key]) { skipped++; return false; }
  return true;
});
const run = todo.slice(0, LIMIT);
console.log(
  `[precompute] 待计算 ${run.length} 对（已跳过缓存 ${skipped} 对），QPS=${QPS}`,
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
}

for (const [a, b] of run) {
  await throttle();
  const key = [a.id, b.id].sort().join("|");
  try {
    const r = await fetchDriving(a, b);
    matrix.pairs[key] = { ...r, source: "tianditu-driving" };
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
    // 连续失败过多（通常是限流/Key 问题），提前退出并保存已有进度
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
