import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const miniRoot = path.join(root, "miniprogram");

const readMini = (file) => fs.readFileSync(path.join(miniRoot, file), "utf8");

test("mini-program packages all 44 original landmark artworks", () => {
  const originalFiles = fs.readdirSync(path.join(root, "public", "landmarks"))
    .filter((file) => file.endsWith(".webp"))
    .sort();
  const miniFiles = fs.readdirSync(path.join(miniRoot, "src", "assets", "landmarks"))
    .filter((file) => file.endsWith(".webp"))
    .sort();

  assert.equal(originalFiles.length, 44);
  assert.deepEqual(miniFiles, originalFiles);

  const config = readMini("config/index.ts");
  assert.match(config, /src\/assets\/landmarks/);
  assert.match(config, /dist\/landmarks/);
});

test("home page renders the complete landmark gallery with lazy-loaded images", () => {
  const home = readMini("src/pages/index/index.tsx");

  assert.match(home, /landmarkColumns/);
  assert.match(home, /spot\.image/);
  assert.match(home, /lazyLoad/);
  assert.match(home, /完整\s*44\s*处/);
});

test("landmark catalogue uses real artwork for every spot", () => {
  const catalogue = readMini("src/pages/landmarks/index.tsx");

  assert.match(catalogue, /src=\{spot\.image\}/);
  assert.match(catalogue, /lazyLoad/);
  assert.doesNotMatch(catalogue, /featuredSpotImages|spot-placeholder/);
});

test("planner choices use a compatibility-safe two-column layout", () => {
  const stylesheet = readMini("src/pages/planner/index.scss");
  const fieldRule = stylesheet.match(/\.planner-field\s*\{([^}]*)\}/s)?.[1] ?? "";

  assert.match(fieldRule, /width:\s*48%/);
  assert.match(fieldRule, /flex:\s*0\s+0\s+48%/);
  assert.doesNotMatch(fieldRule, /calc\(/);
});
