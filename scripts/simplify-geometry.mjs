#!/usr/bin/env node
// 对 data/route-geometry.json 做 Douglas-Peucker 抽稀，显著减小体积。
//
// 用法：
//   node scripts/simplify-geometry.mjs [tolerance]
//   tolerance 单位：度（经纬度）。0.0005 ≈ 50m，0.0003 ≈ 30m。默认 0.0005。
//
// 原地覆盖，保留 _meta。仅抽稀 points，不动 km/minutes。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const geometryPath = path.join(root, "data/route-geometry.json");

const tolerance = Number(process.argv[2] || 0.0005);

const g = JSON.parse(fs.readFileSync(geometryPath, "utf8"));
const pairs = g.pairs || {};

// Douglas-Peucker
function pointLineDistance(p, a, b) {
  const [x, y] = p;
  const [x1, y1] = a;
  const [x2, y2] = b;
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) {
    const ex = x - x1;
    const ey = y - y1;
    return Math.sqrt(ex * ex + ey * ey);
  }
  // 投影参数 t
  const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
  let px, py;
  if (t < 0) { px = x1; py = y1; }
  else if (t > 1) { px = x2; py = y2; }
  else { px = x1 + t * dx; py = y1 + t * dy; }
  const ex = x - px;
  const ey = y - py;
  return Math.sqrt(ex * ex + ey * ey);
}

function douglasPeucker(points, tol) {
  if (points.length <= 2) return points;
  let maxDist = 0;
  let maxIdx = 0;
  const first = points[0];
  const last = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i++) {
    const d = pointLineDistance(points[i], first, last);
    if (d > maxDist) {
      maxDist = d;
      maxIdx = i;
    }
  }
  if (maxDist > tol) {
    const left = douglasPeucker(points.slice(0, maxIdx + 1), tol);
    const right = douglasPeucker(points.slice(maxIdx), tol);
    return left.slice(0, -1).concat(right);
  }
  return [first, last];
}

let beforePts = 0;
let afterPts = 0;
let changed = 0;
for (const key of Object.keys(pairs)) {
  const pts = pairs[key].points;
  if (!Array.isArray(pts) || pts.length < 3) continue;
  beforePts += pts.length;
  const simplified = douglasPeucker(pts, tolerance);
  afterPts += simplified.length;
  if (simplified.length !== pts.length) {
    pairs[key].points = simplified;
    changed++;
  }
}

const beforeBytes = fs.statSync(geometryPath).size;
g._meta = {
  ...(g._meta || {}),
  simplified: `douglas-peucker tolerance=${tolerance} (~${Math.round(tolerance * 111000)}m)`,
  simplifiedPoints: afterPts,
  stats: { ...(g._meta?.stats || {}), pairs: Object.keys(pairs).length },
};
fs.writeFileSync(geometryPath, JSON.stringify(g, null, 2) + "\n", "utf8");
const afterBytes = fs.statSync(geometryPath).size;

console.log(`[simplify] tolerance=${tolerance} (≈${Math.round(tolerance * 111000)}m)`);
console.log(`[simplify] 抽稀 ${changed} 对，路径点 ${beforePts} → ${afterPts}（保留 ${(100 * afterPts / beforePts).toFixed(1)}%）`);
console.log(`[simplify] 文件 ${(beforeBytes / 1048576).toFixed(1)} MB → ${(afterBytes / 1048576).toFixed(1)} MB`);
