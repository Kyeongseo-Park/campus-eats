"use client";

import { useState, type FormEvent } from "react";

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

export interface RestaurantFormValues {
  name: string;
  category: Category | "";
  zone: Zone | "";
  address: string;
  latitude: string;
  longitude: string;
  minPrice: string;
}

interface RestaurantFormSubmitValues {
  name: string;
  category: Category;
  zone: Zone;
  address: string;
  latitude: number;
  longitude: number;
  minPrice: number | null;
}

interface RestaurantFormProps {
  initialValues?: Partial<RestaurantFormValues>;
  submitLabel: string;
  onSubmit: (values: RestaurantFormSubmitValues) => Promise<{ error?: string } | void>;
  onCancel?: () => void;
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
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
