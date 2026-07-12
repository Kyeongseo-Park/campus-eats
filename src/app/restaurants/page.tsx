"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { FilterSheet, type RestaurantFilters } from "@/components/restaurants/filter-sheet";
import { RestaurantCard } from "@/components/restaurants/restaurant-card";
import { SortTabs } from "@/components/restaurants/sort-tabs";
import { buttonVariants } from "@/components/ui/button";
import { useUserLocation } from "@/hooks/use-user-location";
import type { SortOption } from "@/lib/constants";
import type { RestaurantListItem } from "@/lib/types";

export default function RestaurantsPage() {
  const [inputValue, setInputValue] = useState("");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<RestaurantFilters>({
    zone: null,
    category: null,
    priceRange: null,
  });
  const [sort, setSort] = useState<SortOption>("평점순");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [restaurants, setRestaurants] = useState<RestaurantListItem[] | null>(null);

  const location = useUserLocation();
  const userLocation = location.status === "granted" ? location.coords : null;

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("search", query);
    if (filters.zone) params.set("zone", filters.zone);
    if (filters.category) params.set("category", filters.category);
    if (filters.priceRange) params.set("priceRange", filters.priceRange);
    params.set("sort", sort);
    if (userLocation) {
      params.set("lat", String(userLocation.latitude));
      params.set("lng", String(userLocation.longitude));
    }

    const controller = new AbortController();
    fetch(`/api/restaurants?${params.toString()}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: { restaurants: RestaurantListItem[] }) => setRestaurants(data.restaurants ?? []))
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error(error);
          setRestaurants([]);
        }
      });

    return () => controller.abort();
  }, [query, filters, sort, userLocation]);

  const activeFilterCount = [filters.zone, filters.category, filters.priceRange].filter(
    Boolean,
  ).length;

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b px-4 py-3 md:hidden">
        <h1 className="text-lg font-semibold">학식말고 뭐먹지?</h1>
      </header>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(inputValue.trim());
        }}
        className="flex shrink-0 items-center gap-2 border-b px-4 py-2"
      >
        <input
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder="식당명 또는 메뉴명 검색..."
          className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        {query && (
          <button
            type="button"
            aria-label="검색어 지우기"
            onClick={() => {
              setInputValue("");
              setQuery("");
            }}
            className="shrink-0 rounded-full p-1.5 hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        )}
        <button type="submit" aria-label="검색" className="shrink-0 rounded-full p-1.5 hover:bg-muted">
          <Search className="size-4" />
        </button>
      </form>

      <div className="flex shrink-0 items-center justify-between border-b px-4 py-2">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-1.5 text-sm font-medium"
        >
          <SlidersHorizontal className="size-4" />
          상세 필터
          {activeFilterCount > 0 && (
            <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <SortTabs value={sort} onChange={setSort} />

      <div className="flex-1 overflow-y-auto">
        {restaurants === null && (
          <p className="p-10 text-center text-sm text-muted-foreground">불러오는 중...</p>
        )}
        {restaurants && restaurants.length === 0 && (
          <div className="flex flex-col items-center gap-4 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              검색 결과가 없어요.
              <br />
              새로운 식당을 제보해보세요!
            </p>
            <Link href="/restaurant-requests/new" className={buttonVariants()}>
              ✍️ 식당 제보하기
            </Link>
          </div>
        )}
        {restaurants?.map((restaurant) => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </div>

      <FilterSheet open={sheetOpen} onOpenChange={setSheetOpen} filters={filters} onApply={setFilters} />
    </div>
  );
}
