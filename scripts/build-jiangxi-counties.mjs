import fs from "node:fs";
import path from "node:path";

const inputRoot = "/tmp/shujing-counties/package/src/江西";
const outputFile = path.resolve("app/jiangxi-counties.ts");
const bounds = { minLng: 113.45, maxLng: 118.55, minLat: 24.35, maxLat: 30.15, width: 1000, height: 560 };

function project([lng, lat]) {
  return [
    (lng - bounds.minLng) / (bounds.maxLng - bounds.minLng) * bounds.width,
    (bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat) * bounds.height,
  ];
}

function perpendicularDistance(point, start, end) {
  const [x, y] = point;
  const [x1, y1] = start;
  const [x2, y2] = end;
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1);
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}

function simplify(points, tolerance = 0.75) {
  if (points.length <= 4) return points;
  let maxDistance = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], points[0], points.at(-1));
    if (distance > maxDistance) {
      maxDistance = distance;
      index = i;
    }
  }
  if (maxDistance <= tolerance) return [points[0], points.at(-1)];
  const left = simplify(points.slice(0, index + 1), tolerance);
  const right = simplify(points.slice(index), tolerance);
  return [...left.slice(0, -1), ...right];
}

function ringPath(ring) {
  const projected = simplify(ring.map(project));
  return `${projected.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("")}Z`;
}

const entries = [];
for (const city of fs.readdirSync(inputRoot)) {
  const cityRoot = path.join(inputRoot, city);
  if (!fs.statSync(cityRoot).isDirectory()) continue;
  for (const filename of fs.readdirSync(cityRoot)) {
    if (!filename.endsWith(".geojson")) continue;
    const collection = JSON.parse(fs.readFileSync(path.join(cityRoot, filename), "utf8"));
    const feature = collection.features[0];
    const geometry = feature.geometry;
    const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
    const d = polygons.flatMap(polygon => polygon.map(ringPath)).join("");
    const [x, y] = project(feature.properties.cp);
    entries.push({
      name: feature.properties.name,
      city,
      d,
      x: Number(x.toFixed(1)),
      y: Number(y.toFixed(1)),
    });
  }
}

entries.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
const source = `// Generated from county-level GeoJSON data packaged by echarts-china-counties-js.\n` +
  `export const JIANGXI_COUNTIES = ${JSON.stringify(entries)} as const;\n`;
fs.writeFileSync(outputFile, source);
console.log(`Wrote ${entries.length} counties to ${outputFile}`);
