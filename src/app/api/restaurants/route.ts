import { NextResponse } from "next/server";

import { searchRestaurants } from "@/lib/restaurants";
import { PRICE_RANGES, SORT_OPTIONS, type PriceRangeValue, type SortValue } from "@/lib/constants";

const PRICE_RANGE_VALUES = PRICE_RANGES.map((p) => p.value) as readonly string[];
const SORT_VALUES = SORT_OPTIONS.map((s) => s.value) as readonly string[];

// 콤마로 구분된 다중 선택 값을 파싱한다 (예: zone=정문,후문).
function parseMulti(param: string | null): string[] {
  return param ? param.split(",").map((v) => v.trim()).filter(Boolean) : [];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const zones = parseMulti(searchParams.get("zone"));
  const categories = parseMulti(searchParams.get("category"));
  const priceRanges = parseMulti(searchParams.get("price_range")).filter((v): v is PriceRangeValue =>
    PRICE_RANGE_VALUES.includes(v)
  );
  const partnershipOnly = searchParams.get("partnership_only") === "true";
  const q = searchParams.get("q") || undefined;
  const sortParam = searchParams.get("sort");
  const sort = SORT_VALUES.includes(sortParam ?? "") ? (sortParam as SortValue) : undefined;

  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const lat = latParam !== null ? Number(latParam) : NaN;
  const lng = lngParam !== null ? Number(lngParam) : NaN;
  const origin = Number.isFinite(lat) && Number.isFinite(lng) ? { latitude: lat, longitude: lng } : undefined;

  const restaurants = await searchRestaurants({
    zones,
    categories,
    priceRanges,
    partnershipOnly,
    q,
    sort,
    origin,
  });

  return NextResponse.json({ restaurants });
}
