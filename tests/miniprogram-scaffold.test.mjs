import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const miniRoot = path.join(root, "miniprogram");

test("wechat miniprogram scaffold exposes the required entry files", () => {
  for (const file of [
    "package.json",
    "project.config.json",
    "src/app.config.ts",
    "src/app.ts",
    "src/pages/index/index.tsx",
  ]) {
    assert.ok(fs.existsSync(path.join(miniRoot, file)), file);
  }
});

test("wechat miniprogram scaffold provides Taro build scripts", () => {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(miniRoot, "package.json"), "utf8"),
  );

  assert.match(pkg.scripts?.["build:weapp"] ?? "", /taro build/);
  assert.match(pkg.scripts?.["dev:weapp"] ?? "", /build:weapp.*--watch/);
  assert.ok(pkg.dependencies?.["@tarojs/taro"]);
  assert.ok(pkg.dependencies?.["@tarojs/components"]);
});

test("wechat developer tools can resolve the compiled output and entry page", () => {
  const projectConfig = JSON.parse(
    fs.readFileSync(path.join(miniRoot, "project.config.json"), "utf8"),
  );
  const appConfig = fs.readFileSync(
    path.join(miniRoot, "src/app.config.ts"),
    "utf8",
  );

  assert.match(projectConfig.miniprogramRoot ?? "", /dist/);
  assert.match(appConfig, /pages\/index\/index/);
});

test("wechat developer tools can load the Taro output when the repository root is imported", () => {
  const projectConfig = JSON.parse(
    fs.readFileSync(path.join(root, "project.config.json"), "utf8"),
  );

  assert.equal(projectConfig.miniprogramRoot, "miniprogram/dist/");
});

test("wechat miniprogram consumes the shared domain layer", () => {
  const buildConfig = fs.readFileSync(
    path.join(miniRoot, "config/index.ts"),
    "utf8",
  );
  const indexPage = fs.readFileSync(
    path.join(miniRoot, "src/pages/index/index.tsx"),
    "utf8",
  );

  assert.match(buildConfig, /@shared/);
  assert.match(indexPage, /from ['"]@shared\/domain['"]/);
  assert.match(indexPage, /generatePlans/);
  assert.match(indexPage, /spots/);
});
