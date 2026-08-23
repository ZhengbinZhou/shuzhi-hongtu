import assert from "node:assert/strict";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

async function render(path="/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, {headers: {accept: "text/html"}}),
    {ASSETS: {fetch: async () => new Response("Not found", {status: 404})}},
    {waitUntil() {},passThroughOnException() {}},
  );
}

test("renders development preview metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "",/^text\/html\b/i);
  assert.match(await response.text(), developmentPreviewMeta);
});

test("renders representative multi-page routes",async()=>{
  for(const [path,expected] of [
    ["/planner","告诉我们，你想怎样理解这段历史"],
    ["/landmarks/J01","井冈山革命博物馆"],
    ["/routes?county=%E4%BA%8E%E9%83%BD%E5%8E%BF&startDate=2026-10-01&days=2&theme1=%E9%95%BF%E5%BE%81%E6%96%87%E5%8C%96&theme2=%E7%BE%A4%E4%BC%97%E6%94%AF%E5%89%8D&experience=%E7%8E%B0%E5%9C%BA%E8%A7%82%E5%AF%9F&purpose=%E7%A4%BE%E4%BC%9A%E5%AE%9E%E8%B7%B5","差异化路线"],
  ]){
    const response=await render(path);
    assert.equal(response.status,200,path);
    assert.match(await response.text(),new RegExp(expected));
  }
});
