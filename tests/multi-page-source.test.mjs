import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=(file)=>fs.readFileSync(path.join(root,file),"utf8");

test("application exposes the planned multi-page routes",()=>{
  for(const file of [
    "app/page.tsx",
    "app/planner/page.tsx",
    "app/routes/page.tsx",
    "app/routes/[planId]/page.tsx",
    "app/history/page.tsx",
    "app/landmarks/page.tsx",
    "app/landmarks/[spotId]/page.tsx",
    "app/my-routes/page.tsx",
    "app/methodology/page.tsx",
  ])assert.ok(fs.existsSync(path.join(root,file)),file);
});

test("history topic routes are integrated",()=>{
  assert.ok(fs.existsSync(path.join(root,"shared/domain/history-data.ts")));
  assert.ok(fs.existsSync(path.join(root,"public/important/map-stage-01-woodcut.webp")));
  assert.equal(read("shared/domain/history-data.ts").match(/"id": "stage-/g)?.length,4);
  assert.match(read("components/site-shell.tsx"),/\/history/);
  assert.match(read("app/page.tsx"),/历史专题/);
});

test("landmark data remains centralized and complete",()=>{
  const data=read("shared/domain/platform-data.ts");
  assert.equal(data.match(/\{id:"[A-Z0-9]+",name:/g)?.length,44);
  assert.match(read("lib/platform-data.ts"),/shared\/domain\/platform-data/);
  assert.match(read("app/landmarks/[spotId]/page.tsx"),/generateStaticParams/);
});

test("route criteria are shareable and plans retain their criteria",()=>{
  assert.match(read("shared/domain/planner-query.ts"),/travelMode/);
  assert.match(read("shared/domain/planner.ts"),/travelEngine\.travel/);
  assert.match(read("shared/domain/planner.ts"),/criteria:\{county:startCounty,startDate,days/);
  assert.match(read("lib/planner.ts"),/shared\/domain\/planner/);
});

test("map api and route summary are integrated into multi-page surfaces",()=>{
  assert.ok(fs.existsSync(path.join(root,"components/map/tdt-mini-map.tsx")));
  assert.ok(fs.existsSync(path.join(root,"components/route/route-summary.tsx")));
  assert.match(read("app/page.tsx"),/TdtHeroMap/);
  assert.match(read("features/route-detail-client.tsx"),/RouteSummary/);
});
