"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORIES, ZONES } from "@/lib/constants";

type MenuRow = { name: string; price: string };

export type AdminRestaurantFormValues = {
  id?: string;
  name: string;
  category: string;
  zone: string;
  address: string;
  phone: string;
  latitude: string;
  longitude: string;
  menus: MenuRow[];
  partnershipStartDate: string;
  partnershipEndDate: string;
  partnershipInfo: string;
};

const EMPTY_MENU_ROW: MenuRow = { name: "", price: "" };

const SELECT_CLASS =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function AdminRestaurantForm({ initialValues }: { initialValues?: AdminRestaurantFormValues }) {
  const router = useRouter();
  const isEdit = !!initialValues?.id;

  const [name, setName] = useState(initialValues?.name ?? "");
  const [category, setCategory] = useState(initialValues?.category ?? "");
  const [zone, setZone] = useState(initialValues?.zone ?? "");
  const [address, setAddress] = useState(initialValues?.address ?? "");
  const [phone, setPhone] = useState(initialValues?.phone ?? "");
  const [latitude, setLatitude] = useState(initialValues?.latitude ?? "");
  const [longitude, setLongitude] = useState(initialValues?.longitude ?? "");
  const [menus, setMenus] = useState<MenuRow[]>(
    initialValues?.menus?.length ? initialValues.menus : [{ ...EMPTY_MENU_ROW }]
  );

  const [partnershipStartDate, setPartnershipStartDate] = useState(initialValues?.partnershipStartDate ?? "");
  const [partnershipEndDate, setPartnershipEndDate] = useState(initialValues?.partnershipEndDate ?? "");
  const [partnershipInfo, setPartnershipInfo] = useState(initialValues?.partnershipInfo ?? "");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateMenu(index: number, patch: Partial<MenuRow>) {
    setMenus((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  }

  function addMenuRow() {
    setMenus((prev) => [...prev, { ...EMPTY_MENU_ROW }]);
  }

  function removeMenuRow(index: number) {
    setMenus((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        name,
        category,
        zone,
        address,
        phone,
        latitude: Number(latitude),
        longitude: Number(longitude),
        menus: menus.filter((m) => m.name.trim()).map((m) => ({ name: m.name.trim(), price: Number(m.price) })),
      };

      const url = isEdit ? `/api/admin/restaurants/${initialValues!.id}` : "/api/admin/restaurants";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
        return;
      }

      if (isEdit) {
        const partnershipRes = await fetch(`/api/admin/restaurants/${initialValues!.id}/partnership`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            partnershipStartDate: partnershipStartDate || null,
            partnershipEndDate: partnershipEndDate || null,
            partnershipInfo,
          }),
        });
        const partnershipData = await partnershipRes.json();

        if (!partnershipRes.ok) {
          setError(partnershipData.error ?? "제휴이벤트 저장에 실패했습니다.");
          return;
        }
      }

      router.push("/admin/restaurants");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">식당명 *</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category">카테고리 *</Label>
          <select
            id="category"
            className={SELECT_CLASS}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="" disabled>
              선택
            </option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="zone">구역 *</Label>
          <select id="zone" className={SELECT_CLASS} value={zone} onChange={(e) => setZone(e.target.value)} required>
            <option value="" disabled>
              선택
            </option>
            {ZONES.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="address">주소 *</Label>
        <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">전화번호</Label>
        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="02-1234-5678" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="latitude">위도 *</Label>
          <Input
            id="latitude"
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="longitude">경도 *</Label>
          <Input
            id="longitude"
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>메뉴 *</Label>
        {menus.map((menu, index) => (
          <div key={index} className="flex gap-2">
            <Input value={menu.name} onChange={(e) => updateMenu(index, { name: e.target.value })} placeholder="메뉴명" />
            <Input
              type="number"
              value={menu.price}
              onChange={(e) => updateMenu(index, { price: e.target.value })}
              placeholder="가격"
              className="max-w-28"
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => removeMenuRow(index)}
              disabled={menus.length <= 1}
            >
              삭제
            </Button>
          </div>
        ))}
        <Button type="button" size="sm" variant="outline" onClick={addMenuRow} className="w-fit">
          메뉴 추가
        </Button>
      </div>

      {isEdit && (
        <div className="flex flex-col gap-2 rounded-lg border p-3">
          <span className="text-sm font-medium">제휴이벤트</span>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="partnershipStartDate">시작일</Label>
              <Input
                id="partnershipStartDate"
                type="date"
                value={partnershipStartDate}
                onChange={(e) => setPartnershipStartDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="partnershipEndDate">종료일</Label>
              <Input
                id="partnershipEndDate"
                type="date"
                value={partnershipEndDate}
                onChange={(e) => setPartnershipEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="partnershipInfo">내용</Label>
            <Input
              id="partnershipInfo"
              value={partnershipInfo}
              onChange={(e) => setPartnershipInfo(e.target.value)}
              placeholder="예: 학생증 제시 시 아메리카노 500원 할인"
            />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? "저장 중..." : "저장"}
      </Button>
    </form>
  );
}
