import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");

const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));

test("wechat devtools does not hot-reload while Taro replaces generated output", () => {
  const rootConfig = readJson("project.config.json");
  const privateConfigPath = path.join(root, "project.private.config.json");

  assert.equal(rootConfig.miniprogramRoot, "miniprogram/dist/");
  assert.equal(rootConfig.setting.compileHotReLoad, false);
  if (fs.existsSync(privateConfigPath)) {
    const privateConfig = JSON.parse(fs.readFileSync(privateConfigPath, "utf8"));
    assert.equal(privateConfig.setting.compileHotReLoad, false);
  }
});
