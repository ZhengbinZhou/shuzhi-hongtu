// 路程/交通抽象层。
//
// 设计目标：
// - 行程编排（arrange/splitDays/generatePlans）只依赖 travel() 返回的分钟数，
//   不关心数据来自缓存矩阵、天地图在线规划、直线估算还是公共交通。
// - 三种交通模式：self(自驾) / charter(包车) / transit(公共交通)。
// - 同地级市走公路；跨市在 transit 模式下查市际通联表（高铁/大巴），
//   查不到则回退公路并标记 transitAvailable=false（界面可提示"数据建设中"）。
// - 纯函数、无 React 依赖，浏览器与 node 脚本均可使用。

import matrixData from "../../data/distance-matrix.json";
import intercityData from "../../data/intercity-transit.json";
import { cityOf } from "../../data/region-map";

/** 点位只需要坐标与归属，避免引入 UI 组件类型。 */
export interface Locatable {
  id: string;
  region: string;
  lat: number;
  lng: number;
}

export type TravelMode = "self" | "charter" | "transit";

export type TravelSource =
  | "matrix" // 预缓存的真实公路车程
  | "online" // 在线规划（预留，未来命中即写回矩阵）
  | "straight" // 直线距离经验估算（离线兜底）
  | "intercity" // 跨市公共交通（高铁/大巴 + 接驳）
  | "intercity-fallback"; // 公共交通无数据，回退公路

export interface TravelResult {
  km: number;
  minutes: number;
  source: TravelSource;
  mode: TravelMode;
  /** transit 模式且无通联数据时为 false，界面据此显示"数据建设中"。 */
  transitAvailable: boolean;
  /** 跨市公共交通的分段明细（仅 source=intercity 时存在）。 */
  segments?: TransitSegment[];
}

export interface TransitSegment {
  kind: "transfer" | "rail" | "coach";
  from: string;
  to: string;
  minutes: number;
  km?: number;
  line?: string; // 如 "高铁" / "大巴"
  note?: string;
}

interface MatrixEntry {
  km: number;
  minutes: number;
  source?: string;
}

interface IntercityLink {
  from: string; // 地级市
  to: string;
  modes: Array<{
    kind: "rail" | "coach";
    line?: string;
    duration_min: number;
    km?: number;
    cost_cny?: number;
    frequency?: string;
    first_last?: string;
    note?: string;
  }>;
  /** 站点到景区的接驳时长（分钟），两端分别配置；缺省用 defaultTransferMin。 */
  transfer_min?: { from?: number; to?: number };
  note?: string;
}

const DEFAULT_TRANSFER_MIN = 40; // 高铁站/汽车站 ↔ 红色景区的经验接驳时长
const SAME_CITY_SPEED = 35; // km/h，与历史逻辑一致
const INTERCITY_SPEED = 58;

function haversineKm(a: Locatable, b: Locatable): number {
  const lat = ((a.lat - b.lat) * Math.PI) / 180;
  const lng = ((a.lng - b.lng) * Math.PI) / 180;
  const x =
    Math.sin(lat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(lng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(x));
}

/** 直线距离经验车程，与原 page.tsx travel() 保持一致。 */
export function straightTravel(
  a: Locatable,
  b: Locatable,
): { km: number; minutes: number } {
  const km = haversineKm(a, b);
  const speed = a.region === b.region ? SAME_CITY_SPEED : INTERCITY_SPEED;
  const minutes = Math.max(10, Math.round((km / speed) * 60 * 1.18 + 8));
  return { km, minutes };
}

function matrixKey(a: Locatable, b: Locatable): string {
  return [a.id, b.id].sort().join("|");
}

function directedKey(a: Locatable, b: Locatable): string {
  return `${a.id}|${b.id}`;
}

function lookupMatrix(
  a: Locatable,
  b: Locatable,
  matrix: Record<string, MatrixEntry>,
): MatrixEntry | null {
  // 优先有向（同城单行道场景），再退回无向
  return matrix[directedKey(a, b)] ?? matrix[matrixKey(a, b)] ?? null;
}

function roadTravel(
  a: Locatable,
  b: Locatable,
  matrix: Record<string, MatrixEntry>,
): { km: number; minutes: number; source: "matrix" | "straight" } {
  const hit = lookupMatrix(a, b, matrix);
  if (hit) return { km: hit.km, minutes: hit.minutes, source: "matrix" };
  const est = straightTravel(a, b);
  return { ...est, source: "straight" };
}

function findLink(
  cityA: string,
  cityB: string,
  links: IntercityLink[],
): IntercityLink | null {
  return (
    links.find(
      (l) =>
        (l.from === cityA && l.to === cityB) ||
        (l.from === cityB && l.to === cityA),
    ) ?? null
  );
}

export interface TravelEngine {
  travel(a: Locatable, b: Locatable, mode?: TravelMode): TravelResult;
}

/** 用默认（随包发布的）数据构建引擎。 */
export function createTravelEngine(
  matrix: Record<string, MatrixEntry> = (matrixData as { pairs: object }).pairs as Record<string, MatrixEntry>,
  intercity: { links: IntercityLink[] } = intercityData as unknown as {
    links: IntercityLink[];
  },
): TravelEngine {
  return {
    travel(a, b, mode = "self"): TravelResult {
      // 自驾 / 包车：都走公路，区别只是语义（包车门到门、无需停车考虑），
      // 时长模型当前一致，预留后续差异化（如大巴车限速、车队集结时间）。
      if (mode === "self" || mode === "charter") {
        const r = roadTravel(a, b, matrix);
        return { ...r, mode, transitAvailable: true };
      }

      // 公共交通
      if (cityOf(a.region) === cityOf(b.region)) {
        // 同市：公共交通意义不大，回退公路
        const r = roadTravel(a, b, matrix);
        return { ...r, mode: "transit", transitAvailable: true };
      }

      const link = findLink(cityOf(a.region), cityOf(b.region), intercity.links);
      if (!link) {
        const r = roadTravel(a, b, matrix);
        return {
          ...r,
          mode: "transit",
          source: "intercity-fallback",
          transitAvailable: false,
        };
      }

      // 选最快干线（高铁优先于大巴的体验由排序保证；数据录入时把推荐项放前）
      const line = link.modes[0];
      if (!line) {
        const r = roadTravel(a, b, matrix);
        return {
          ...r,
          mode: "transit",
          source: "intercity-fallback",
          transitAvailable: false,
        };
      }

      const transferFrom = link.transfer_min?.from ?? DEFAULT_TRANSFER_MIN;
      const transferTo = link.transfer_min?.to ?? DEFAULT_TRANSFER_MIN;
      const segments: TransitSegment[] = [
        {
          kind: "transfer",
          from: a.region,
          to: `${cityOf(a.region)}车站`,
          minutes: transferFrom,
        },
        {
          kind: line.kind,
          from: cityOf(a.region),
          to: cityOf(b.region),
          minutes: line.duration_min,
          km: line.km,
          line: line.kind === "rail" ? "高铁/火车" : "客运大巴",
          note: line.frequency ? `约 ${line.frequency}` : line.note,
        },
        {
          kind: "transfer",
          from: `${cityOf(b.region)}车站`,
          to: b.region,
          minutes: transferTo,
        },
      ];
      const minutes = segments.reduce((n, s) => n + s.minutes, 0);
      return {
        km: line.km ?? straightTravel(a, b).km,
        minutes,
        source: "intercity",
        mode: "transit",
        transitAvailable: true,
        segments,
      };
    },
  };
}

// 单例：UI 直接 import 使用。
export const travelEngine = createTravelEngine();
