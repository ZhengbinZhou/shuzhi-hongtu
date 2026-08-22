import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(projectRoot, "数智-红途-离线完整版.html");
const html = fs.readFileSync(file, "utf8");

test("standalone HTML contains the complete current experience", () => {
  assert.match(html, /<title>数智-红途｜红色文旅智能导览平台<\/title>/);
  assert.match(html, /寻历史脉络，走一条真正/);
  assert.match(html, /适合你的红色路线/);
  assert.match(html, /44个红色点位，构成全省路线的数据底座/);
  assert.match(html, /江西省地图，高亮平台红色点位涉及的十二个县级行政区/);
  assert.match(html, /开始生成路线/);
  assert.match(html, /保存到“我的路线”/);
});

test("standalone HTML embeds all 44 landmark images", () => {
  const images = html.match(/data:image\/webp;base64,/g) ?? [];
  assert.equal(images.length, 44);
  assert.doesNotMatch(html, /(?:src|href)=["'](?:https?:|\/landmarks\/|\.\/assets\/)/);
  assert.doesNotMatch(html, /\/landmarks\//);
});

test("standalone HTML can launch directly from the file protocol", () => {
  assert.doesNotMatch(html, /process\.env\.NODE_ENV/);
  assert.doesNotMatch(html, /<script type=["']module["']/);
  assert.match(html, /<script>window\.addEventListener\("DOMContentLoaded"/);
  assert.match(html, /<style>[\s\S]*\.hero[\s\S]*<\/style>/);
  assert.match(html, /<div id="root"><\/div>/);
});

test("history trail companion page and assets are complete", () => {
  const requiredFiles = [
    "history.html",
    "history-data.js",
    "history-entry.js",
    "history-entry.css",
    "history-page.js",
    "history-page.css",
  ];
  for (const name of requiredFiles) {
    assert.ok(fs.existsSync(path.join(projectRoot, name)), `${name} is missing`);
  }

  const historyData = fs.readFileSync(path.join(projectRoot, "history-data.js"), "utf8");
  const assetPaths = [...historyData.matchAll(/important\/([A-Za-z0-9._-]+)/g)].map((match) => match[1]);
  assert.ok(assetPaths.length > 0);
  for (const name of new Set(assetPaths)) {
    assert.ok(fs.existsSync(path.join(projectRoot, "important", name)), `important/${name} is missing`);
  }
});
