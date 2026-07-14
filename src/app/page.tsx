import { IntroSplash } from "@/components/intro-splash";
import { MapExplorer } from "@/components/map-explorer";
import { searchRestaurants } from "@/lib/restaurants";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PriceRangeValue, SortValue } from "@/lib/constants";

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseMulti(value: string | string[] | undefined): string[] {
  const raw = firstParam(value);
  return raw ? raw.split(",").filter(Boolean) : [];
}

// selected를 제외한 나머지 쿼리를 그대로 문자열로 재구성한다 — 상세 페이지에서
// 돌아올 때 필터 상태를 그대로 복원하는 데 쓴다.
function buildFilterQuery(sp: { [key: string]: string | string[] | undefined }): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (key === "selected" || value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) params.append(key, v);
  }
  return params.toString();
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;

  const q = firstParam(sp.q) || undefined;
  const zones = parseMulti(sp.zone);
  const categories = parseMulti(sp.category);
  const priceRanges = parseMulti(sp.price_range) as PriceRangeValue[];
  const partnershipOnly = firstParam(sp.partnership_only) === "true";

  const sortRaw = firstParam(sp.sort);
  const sort = (sortRaw as SortValue) || "rating";

  const latRaw = firstParam(sp.lat);
  const lngRaw = firstParam(sp.lng);
  const lat = latRaw ? Number(latRaw) : NaN;
  const lng = lngRaw ? Number(lngRaw) : NaN;
  const origin = Number.isFinite(lat) && Number.isFinite(lng) ? { latitude: lat, longitude: lng } : undefined;

  const initialSelectedId = firstParam(sp.selected) || undefined;
  const filterQuery = buildFilterQuery(sp);

  const [restaurants, currentUser] = await Promise.all([
    searchRestaurants({ q, zones, categories, priceRanges, partnershipOnly, sort, origin }),
    getCurrentUser(),
  ]);

  const favoriteIds = currentUser
    ? (
        await prisma.favorite.findMany({
          where: { userId: currentUser.id, restaurantId: { in: restaurants.map((r) => r.id) } },
          select: { restaurantId: true },
        })
      ).map((f) => f.restaurantId)
    : [];

  return (
    <>
      <IntroSplash />
      <main className="h-full overflow-hidden">
        <MapExplorer
          restaurants={restaurants}
          currentUserId={currentUser?.id ?? null}
          favoriteIds={favoriteIds}
          sort={sort}
          q={q}
          filterQuery={filterQuery}
          initialSelectedId={initialSelectedId}
        />
      </main>
    </>
  );
}
