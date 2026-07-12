"use client";

import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, ZONES, type Category, type Zone } from "@/lib/constants";
import { guessCategory } from "@/lib/kakao-category";

export interface RestaurantFormValues {
  name: string;
  category: Category | "";
  zone: Zone | "";
  address: string;
  latitude: string;
  longitude: string;
  minPrice: string;
  phone: string;
  kakaoPlaceId: string;
}

interface RestaurantFormSubmitValues {
  name: string;
  category: Category;
  zone: Zone;
  address: string;
  latitude: number;
  longitude: number;
  minPrice: number | null;
  phone: string | null;
  kakaoPlaceId: string | null;
}

interface RestaurantFormProps {
  initialValues?: Partial<RestaurantFormValues>;
  submitLabel: string;
  onSubmit: (values: RestaurantFormSubmitValues) => Promise<{ error?: string } | void>;
  onCancel?: () => void;
}

interface KakaoPlaceResult {
  kakaoPlaceId: string;
  name: string;
  category: string;
  phone: string;
  address: string;
  roadAddress: string;
  latitude: number;
  longitude: number;
  placeUrl: string;
}

export function RestaurantForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: RestaurantFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [category, setCategory] = useState<Category | "">(initialValues?.category ?? "");
  const [zone, setZone] = useState<Zone | "">(initialValues?.zone ?? "");
  const [address, setAddress] = useState(initialValues?.address ?? "");
  const [latitude, setLatitude] = useState(initialValues?.latitude ?? "");
  const [longitude, setLongitude] = useState(initialValues?.longitude ?? "");
  const [minPrice, setMinPrice] = useState(initialValues?.minPrice ?? "");
  const [phone, setPhone] = useState(initialValues?.phone ?? "");
  const [kakaoPlaceId, setKakaoPlaceId] = useState(initialValues?.kakaoPlaceId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [kakaoQuery, setKakaoQuery] = useState(initialValues?.name ?? "");
  const [kakaoResults, setKakaoResults] = useState<KakaoPlaceResult[] | null>(null);
  const [kakaoSearching, setKakaoSearching] = useState(false);
  const [kakaoError, setKakaoError] = useState<string | null>(null);

  async function handleKakaoSearch(event: FormEvent) {
    event.preventDefault();
    if (!kakaoQuery.trim()) return;

    setKakaoSearching(true);
    setKakaoError(null);
    try {
      const res = await fetch(`/api/kakao/places?query=${encodeURIComponent(kakaoQuery.trim())}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setKakaoError(data?.error ?? "카카오 장소 검색에 실패했습니다.");
        setKakaoResults(null);
        return;
      }
      setKakaoResults(data.places ?? []);
    } catch {
      setKakaoError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setKakaoSearching(false);
    }
  }

  function applyKakaoPlace(place: KakaoPlaceResult) {
    setName(place.name);
    setAddress(place.roadAddress || place.address);
    setLatitude(String(place.latitude));
    setLongitude(String(place.longitude));
    setPhone(place.phone);
    setKakaoPlaceId(place.kakaoPlaceId);
    const guessed = guessCategory(place.category);
    if (guessed) setCategory(guessed);
    setKakaoResults(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!category || !zone) {
      setError("카테고리와 구역을 선택해주세요.");
      return;
    }
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (latitude.trim() === "" || longitude.trim() === "" || Number.isNaN(lat) || Number.isNaN(lng)) {
      setError("위도/경도는 숫자로 입력해주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await onSubmit({
        name,
        category,
        zone,
        address,
        latitude: lat,
        longitude: lng,
        minPrice: minPrice.trim() === "" ? null : Number(minPrice),
        phone: phone.trim() === "" ? null : phone.trim(),
        kakaoPlaceId: kakaoPlaceId.trim() === "" ? null : kakaoPlaceId.trim(),
      });
      if (result?.error) setError(result.error);
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5 rounded-md border border-dashed p-3">
        <Label htmlFor="kakao-query">카카오에서 검색해 기본 정보 채우기</Label>
        <div className="flex gap-2">
          <Input
            id="kakao-query"
            placeholder="예: 학교앞 돈까스"
            value={kakaoQuery}
            onChange={(event) => setKakaoQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleKakaoSearch(event);
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={kakaoSearching || !kakaoQuery.trim()}
            onClick={handleKakaoSearch}
          >
            <Search className="size-4" /> {kakaoSearching ? "검색 중..." : "검색"}
          </Button>
        </div>
        {kakaoError && <p className="text-sm text-destructive">{kakaoError}</p>}
        {kakaoResults && (
          <ul className="mt-1 flex max-h-48 flex-col gap-1 overflow-y-auto">
            {kakaoResults.length === 0 && (
              <li className="p-2 text-sm text-muted-foreground">검색 결과가 없습니다.</li>
            )}
            {kakaoResults.map((place) => (
              <li key={place.kakaoPlaceId}>
                <button
                  type="button"
                  onClick={() => applyKakaoPlace(place)}
                  className="w-full rounded-sm border px-2 py-1.5 text-left text-sm hover:bg-muted"
                >
                  <p className="font-medium">{place.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {place.roadAddress || place.address}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">
          검색 결과를 선택하면 식당명/주소/위도·경도/전화번호가 자동으로 채워져요. 구역·가격은 직접
          입력해주세요.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="restaurant-name">식당명</Label>
        <Input
          id="restaurant-name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>카테고리</Label>
          <Select value={category || undefined} onValueChange={(value) => setCategory(value as Category)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>구역</Label>
          <Select value={zone || undefined} onValueChange={(value) => setZone(value as Zone)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              {ZONES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="restaurant-address">주소</Label>
        <Input
          id="restaurant-address"
          required
          value={address}
          onChange={(event) => setAddress(event.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="restaurant-lat">위도</Label>
          <Input
            id="restaurant-lat"
            required
            inputMode="decimal"
            placeholder="35.1765"
            value={latitude}
            onChange={(event) => setLatitude(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="restaurant-lng">경도</Label>
          <Input
            id="restaurant-lng"
            required
            inputMode="decimal"
            placeholder="126.9075"
            value={longitude}
            onChange={(event) => setLongitude(event.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="restaurant-min-price">메뉴 최저가 (선택, 원)</Label>
          <Input
            id="restaurant-min-price"
            inputMode="numeric"
            placeholder="8000"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="restaurant-phone">전화번호 (선택)</Label>
          <Input
            id="restaurant-phone"
            placeholder="062-000-0000"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            취소
          </Button>
        )}
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting ? "처리 중..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
