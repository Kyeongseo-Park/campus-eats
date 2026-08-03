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
  const openNow = firstParam(sp.open_now) === "true";

  const sortRaw = firstParam(sp.sort);
  const sort = (sortRaw as SortValue) || "rating";

  const latRaw = firstParam(sp.lat);
  const lngRaw = firstParam(sp.lng);
  const lat = latRaw ? Number(latRaw) : NaN;
  const lng = lngRaw ? Number(lngRaw) : NaN;
  const origin = Number.isFinite(lat) && Number.isFinite(lng) ? { latitude: lat, longitude: lng } : undefined;

  const [restaurants, currentUser] = await Promise.all([
    searchRestaurants({ q, zones, categories, priceRanges, partnershipOnly, openNow, sort, origin }),
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
        />
      </main>
    </>
  );
}
