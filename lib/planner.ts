import { JIANGXI_BOUNDS } from "@/app/jiangxi-map";

export * from "@/shared/domain/planner";

export function baseMapPoint(lng: number, lat: number) {
  const { minLng, maxLng, minLat, maxLat, width, height } = JIANGXI_BOUNDS;
  return {
    x: ((lng - minLng) / (maxLng - minLng)) * width,
    y: ((maxLat - lat) / (maxLat - minLat)) * height,
  };
}
