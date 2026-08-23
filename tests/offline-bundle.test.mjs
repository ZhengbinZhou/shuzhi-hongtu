import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const output=path.join(root,"offline-dist");

test("offline bundle is a portable printable folder",()=>{
  const html=fs.readFileSync(path.join(output,"index.html"),"utf8");
  assert.match(html,/name="offline-print" content="a4-multipage"/);
  assert.equal(fs.readdirSync(path.join(output,"landmarks")).filter(name=>name.endsWith(".webp")).length,44);
  const jsName=fs.readdirSync(path.join(output,"assets")).find(name=>name.endsWith(".js"));
  assert.ok(jsName);
  const js=fs.readFileSync(path.join(output,"assets",jsName),"utf8");
  assert.doesNotMatch(js,/"\/landmarks\//);
  assert.match(js,/\.\/landmarks\//);
});
