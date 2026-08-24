import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const miniRoot = path.join(root, "miniprogram");
const auditPath = path.join(miniRoot, "scripts", "release-audit.mjs");
const auditUrl = pathToFileURL(auditPath).href;
const fixtureRoot = path.join(os.tmpdir(), `shuzhi-release-audit-${process.pid}`);

after(() => {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
});

test("phase five enables required-component lazy loading", () => {
  const appConfig = fs.readFileSync(path.join(miniRoot, "src", "app.config.ts"), "utf8");

  assert.match(appConfig, /lazyCodeLoading:\s*['"]requiredComponents['"]/);
});

test("phase five exposes one-command release verification", () => {
  const rootPackage = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const miniPackage = JSON.parse(fs.readFileSync(path.join(miniRoot, "package.json"), "utf8"));

  assert.equal(rootPackage.scripts["verify:miniprogram"], "npm --prefix miniprogram run verify:weapp");
  assert.match(miniPackage.scripts["verify:weapp"], /typecheck:weapp/);
  assert.match(miniPackage.scripts["verify:weapp"], /test:weapp/);
  assert.match(miniPackage.scripts["verify:weapp"], /build:weapp/);
  assert.match(miniPackage.scripts["verify:weapp"], /release-audit\.mjs/);
});

test("release audit accepts the current production package", async () => {
  assert.ok(fs.existsSync(auditPath), "miniprogram/scripts/release-audit.mjs");
  const { auditRelease, MAX_MAIN_PACKAGE_BYTES } = await import(`${auditUrl}?v=${Date.now()}`);
  const result = auditRelease({ miniRoot, repoRoot: root });

  assert.equal(result.ok, true, result.issues.join("\n"));
  assert.equal(result.imageCount, 44);
  assert.ok(result.totalBytes < MAX_MAIN_PACKAGE_BYTES);
});

test("release audit rejects missing entry files and oversized output", async () => {
  assert.ok(fs.existsSync(auditPath), "miniprogram/scripts/release-audit.mjs");
  const { auditRelease, MAX_MAIN_PACKAGE_BYTES } = await import(`${auditUrl}?v=${Date.now()}`);
  const fakeRepo = path.join(fixtureRoot, "repo");
  const fakeMini = path.join(fakeRepo, "miniprogram");
  const fakeDist = path.join(fakeMini, "dist");
  fs.mkdirSync(fakeDist, { recursive: true });
  fs.writeFileSync(path.join(fakeDist, "oversized.bin"), Buffer.alloc(MAX_MAIN_PACKAGE_BYTES + 1));

  const result = auditRelease({ miniRoot: fakeMini, repoRoot: fakeRepo });

  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.includes("app.json")));
  assert.ok(result.issues.some((issue) => issue.includes("2 MiB")));
});

test("release checklist covers the critical mini-program journey", () => {
  const checklistPath = path.join(root, "docs", "miniprogram-release-checklist.md");
  assert.ok(fs.existsSync(checklistPath), "docs/miniprogram-release-checklist.md");
  const checklist = fs.readFileSync(checklistPath, "utf8");

  for (const expectation of ["verify:miniprogram", "44 张", "2×2", "保存路线", "地图查看", "分享"]) {
    assert.match(checklist, new RegExp(expectation));
  }
});
