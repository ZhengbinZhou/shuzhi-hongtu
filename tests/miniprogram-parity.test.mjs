import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";
import { pathToFileURL } from "node:url";
import { build } from "../miniprogram/node_modules/esbuild/lib/main.js";

const root = path.resolve(import.meta.dirname, "..");
const miniRoot = path.join(root, "miniprogram");
const readMini = (file) => fs.readFileSync(path.join(miniRoot, file), "utf8");
const routeLinkBundle = path.join(os.tmpdir(), `shuzhi-parity-route-link-${process.pid}.mjs`);
const routePlanBundle = path.join(os.tmpdir(), `shuzhi-parity-route-plan-${process.pid}.mjs`);

after(() => {
  fs.rmSync(routeLinkBundle, { force: true });
  fs.rmSync(routePlanBundle, { force: true });
});

test("parity pages are registered in the mini-program", () => {
  const config = readMini("src/app.config.ts");

  for (const page of ["pages/history/index", "pages/methodology/index", "pages/landmark-detail/index"]) {
    assert.match(config, new RegExp(page.replaceAll("/", "\\/")));
  }
});

test("home and route detail render embedded maps", () => {
  const home = readMini("src/pages/index/index.tsx");
  const detail = readMini("src/pages/route-detail/index.tsx");
  const routeMap = readMini("src/components/route-map/index.tsx");

  assert.match(home, /RouteMap/);
  assert.match(detail, /RouteMap/);
  assert.match(routeMap, /<Map/);
  assert.match(routeMap, /markers=/);
  assert.match(routeMap, /polyline=/);
  assert.match(routeMap, /includePoints=/);
});

test("route detail exposes travel summary, editing, dimensions, services and poster export", () => {
  const detail = readMini("src/pages/route-detail/index.tsx");
  const routePlan = readMini("src/utils/route-plan.ts");

  assert.match(detail, /routeSummary/);
  assert.match(detail, /moveRouteSpot/);
  assert.match(detail, /replaceRouteSpot/);
  assert.match(detail, /removeRouteSpot/);
  assert.match(detail, /plan\.dimensions/);
  assert.match(detail, /plan\.services\.hotels/);
  assert.match(detail, /plan\.services\.charters/);
  assert.match(detail, /canvasToTempFilePath/);
  assert.match(routePlan, /travelEngine\.travel/);
  assert.match(routePlan, /splitDays/);
  assert.match(routePlan, /buildRouteServices/);
});

test("landmark detail presents complete visit information and related spots", () => {
  const detail = readMini("src/pages/landmark-detail/index.tsx");

  assert.match(detail, /spotDetails/);
  assert.match(detail, /openingHours/);
  assert.match(detail, /reservationRequired/);
  assert.match(detail, /reservationMethod/);
  assert.match(detail, /verificationLevel/);
  assert.match(detail, /Object\.entries\(spot\.themes\)/);
  assert.match(detail, /relatedSpots/);
});

test("history topics include maps, timelines, questions, sources and planner presets", () => {
  const history = readMini("src/pages/history/index.tsx");

  assert.match(history, /historyStages/);
  assert.match(history, /RouteMap/);
  assert.match(history, /stage\.events/);
  assert.match(history, /stage\.qa/);
  assert.match(history, /stage\.sources/);
  assert.match(history, /setPlannerPreset/);
});

test("methodology explains all four matching stages and data boundaries", () => {
  const methodology = readMini("src/pages/methodology/index.tsx");

  for (const copy of ["可行性过滤", "内容匹配", "历史叙事校验", "差异化输出", "使用边界"]) {
    assert.match(methodology, new RegExp(copy));
  }
});

test("edited route order survives a mini-program share link", async () => {
  await build({
    bundle: true,
    entryPoints: [path.join(miniRoot, "src/utils/route-link.ts")],
    format: "esm",
    logLevel: "silent",
    outfile: routeLinkBundle,
    platform: "node",
    target: "node22",
  });
  const links = await import(`${pathToFileURL(routeLinkBundle).href}?v=${Date.now()}`);
  const base = links.defaultSharedPlan();
  const edited = { ...base, spots: [...base.spots].reverse().slice(0, Math.max(2, base.spots.length - 1)) };
  const url = new URL(`https://mini.local${links.miniPlanPath(edited)}`);
  const recovered = links.resolvePlanFromParams(Object.fromEntries(url.searchParams));

  assert.match(url.searchParams.get("spotIds") ?? "", /,/);
  assert.deepEqual(recovered?.spots.map((spot) => spot.id), edited.spots.map((spot) => spot.id));
});

test("route utilities calculate travel and safely edit non-core spots", async () => {
  await build({
    bundle: true,
    entryPoints: [path.join(miniRoot, "src/utils/route-plan.ts")],
    format: "esm",
    logLevel: "silent",
    outfile: routePlanBundle,
    platform: "node",
    target: "node22",
  });
  const routePlan = await import(`${pathToFileURL(routePlanBundle).href}?v=${Date.now()}`);
  const themes = { 重要人物: 3, 重大事件: 4, 军事斗争: 3, 群众支前: 4, 政权建设: 2, 长征文化: 2, 革命精神: 5 };
  const experience = { 深度讲解: 4, 现场观察: 4, 互动体验: 3, 轻松参观: 3 };
  const spot = (id, longitude, core = false) => ({ id, name: `点位${id}`, short: id, region: "测试区", county: "于都县", image: "/landmarks/YD01-park.webp", minutes: 60, closed: [], core, lat: 25.95, lng: longitude, themes, experience, intro: "测试点位" });
  const spots = [spot("A", 115.40, true), spot("B", 115.45), spot("C", 115.50)];
  const plan = {
    id: "plan-test",
    name: "测试路线",
    angle: "测试",
    score: 90,
    spots,
    days: [spots],
    reason: "测试",
    background: "测试",
    services: { hotels: [], charters: [] },
    dimensions: [],
    criteria: { county: "于都县", startDate: "2026-10-01", days: 1, theme1: "重大事件", theme2: "群众支前", experience: "现场观察", purpose: "社会实践", travelMode: "self" },
    feasible: true,
  };

  const summary = routePlan.routeSummary(plan.spots, "self");
  assert.equal(summary.legs.length, 2);
  assert.ok(summary.driveKm > 0);
  assert.deepEqual(routePlan.moveRouteSpot(plan, 1, -1).spots.map((item) => item.id), ["B", "A", "C"]);
  assert.deepEqual(routePlan.removeRouteSpot(plan, 1).spots.map((item) => item.id), ["A", "C"]);
  assert.equal(routePlan.replaceRouteSpot(plan, 1, [...spots, spot("D", 115.47)]).spots[1].id, "D");
  assert.equal(routePlan.removeRouteSpot(plan, 0), plan);
});
