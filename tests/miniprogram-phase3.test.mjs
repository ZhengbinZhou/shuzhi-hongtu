import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";
import { pathToFileURL } from "node:url";
import { build } from "../miniprogram/node_modules/esbuild/lib/main.js";

const root = path.resolve(import.meta.dirname, "..");
const miniRoot = path.join(root, "miniprogram");
const bundlePath = path.join(os.tmpdir(), `shuzhi-hongtu-catalogue-${process.pid}.mjs`);

after(() => {
  fs.rmSync(bundlePath, { force: true });
});

const readMini = (file) => fs.readFileSync(path.join(miniRoot, file), "utf8");

test("phase three exposes home, planner and landmark tabs", () => {
  const appConfig = readMini("src/app.config.ts");

  assert.match(appConfig, /pages\/planner\/index/);
  assert.match(appConfig, /pages\/landmarks\/index/);
  assert.match(appConfig, /tabBar/);
  assert.match(appConfig, /首页/);
  assert.match(appConfig, /规划/);
  assert.match(appConfig, /图鉴/);
});

test("home page presents real route and landmark content", () => {
  const home = readMini("src/pages/index/index.tsx");

  assert.match(home, /让革命史诗/);
  assert.match(home, /generatePlans/);
  assert.match(home, /landmarkColumns/);
  assert.match(home, /spot\.image/);
  assert.match(home, /Taro\.switchTab/);
  assert.doesNotMatch(home, /Hello\s*world/i);
});

test("planner page collects criteria and renders generated plans", () => {
  const planner = readMini("src/pages/planner/index.tsx");

  assert.match(planner, /Picker/);
  assert.match(planner, /plannerDefaults/);
  assert.match(planner, /generatePlans/);
  assert.match(planner, /setPlans/);
  assert.match(planner, /生成路线/);
});

test("landmark page supports regional filtering, search and detail expansion", () => {
  const landmarks = readMini("src/pages/landmarks/index.tsx");

  assert.match(landmarks, /ScrollView/);
  assert.match(landmarks, /filterSpots/);
  assert.match(landmarks, /selectedSpot/);
  assert.match(landmarks, /搜索点位/);
});

test("featured landmark artwork is packaged locally", () => {
  for (const file of [
    "YD01-park.webp",
    "JGS01-museum.webp",
    "R01-yeping.webp",
    "N01-bayi-museum.webp",
  ]) {
    assert.ok(fs.existsSync(path.join(miniRoot, "src/assets/landmarks", file)), file);
  }
});

test("catalogue filtering handles region, keyword and empty results", async () => {
  const entry = path.join(miniRoot, "src/utils/catalogue.ts");
  assert.ok(fs.existsSync(entry), "src/utils/catalogue.ts");
  await build({
    bundle: true,
    entryPoints: [entry],
    format: "esm",
    logLevel: "silent",
    outfile: bundlePath,
    platform: "node",
    target: "node22",
  });
  const { filterSpots } = await import(`${pathToFileURL(bundlePath).href}?v=${Date.now()}`);
  const fixtures = [
    { id: "J01", name: "井冈山革命博物馆", short: "革命博物馆", region: "井冈山", county: "井冈山市", intro: "井冈山斗争" },
    { id: "N01", name: "南昌八一起义纪念馆", short: "八一起义纪念馆", region: "南昌", county: "西湖区", intro: "人民军队创建史" },
  ];

  assert.deepEqual(filterSpots(fixtures, "井冈山", "").map((spot) => spot.id), ["J01"]);
  assert.deepEqual(filterSpots(fixtures, "全部", "八一起义").map((spot) => spot.id), ["N01"]);
  assert.equal(filterSpots(fixtures, "全部", "不存在的点位").length, 0);
});
