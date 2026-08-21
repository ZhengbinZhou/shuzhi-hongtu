import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const outputDir = path.join(projectRoot, "offline-dist");
const assetsDir = path.join(outputDir, "assets");
const htmlPath = path.join(outputDir, "index.html");

let html = fs.readFileSync(htmlPath, "utf8");
const assetFiles = fs.readdirSync(assetsDir);
const jsName = assetFiles.find((name) => name.endsWith(".js"));
const cssName = assetFiles.find((name) => name.endsWith(".css"));
if (!jsName || !cssName) throw new Error("Standalone build assets are incomplete");

let js = fs.readFileSync(path.join(assetsDir, jsName), "utf8");
const css = fs.readFileSync(path.join(assetsDir, cssName), "utf8");

for (const imageName of fs.readdirSync(path.join(projectRoot, "public/landmarks"))) {
  if (!imageName.endsWith(".webp")) continue;
  const source = fs.readFileSync(path.join(projectRoot, "public/landmarks", imageName));
  const dataUri = `data:image/webp;base64,${source.toString("base64")}`;
  js = js.replaceAll(`/landmarks/${imageName}`, dataUri);
}

html = html
  .replace(
    /<script[^>]+src="\.\/assets\/[^"]+\.js"[^>]*><\/script>/,
    () => `<script>${js}</script>`,
  )
  .replace(
    /<link[^>]+href="\.\/assets\/[^"]+\.css"[^>]*>/,
    () => `<style>${css}</style>`,
  );

if (/process\.env\.NODE_ENV/.test(js)) {
  throw new Error("Standalone bundle still contains process.env.NODE_ENV");
}
if (/\/landmarks\//.test(js)) {
  throw new Error("Standalone bundle still contains external landmark paths");
}

const finalPath = path.join(projectRoot, "数智-红途-离线完整版.html");
fs.writeFileSync(finalPath, html);
console.log(finalPath);
