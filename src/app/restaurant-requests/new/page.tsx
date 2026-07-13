"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { useSession } from "@/components/providers/session-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORIES, type Category } from "@/lib/constants";

export default function NewRestaurantRequestPage() {
  const router = useRouter();
  const { status } = useSession();

  const [restaurantName, setRestaurantName] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [menuInfo, setMenuInfo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!category) {
      setError("카테고리를 선택해주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/restaurant-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantName,
          address,
          category,
          menuInfo: menuInfo.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "제보 등록에 실패했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }
      toast.success("✓ 제보가 성공적으로 접수됐어요!");
      router.push("/mypage");
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status !== "authenticated") {
    return <p className="p-10 text-center text-sm text-muted-foreground">불러오는 중...</p>;
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b px-4 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> 뒤로가기
        </button>
        <h1 className="font-semibold">식당 제보</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <p className="mb-6 text-lg font-semibold">새로운 식당을 알려주세요!</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="restaurantName">[필수] 식당명*</Label>
            <Input
              id="restaurantName"
              required
              placeholder="예: 학교앞 돈까스"
              value={restaurantName}
              onChange={(event) => setRestaurantName(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">[필수] 위치(주소)*</Label>
            <Input
              id="address"
              required
              placeholder="예: 정문 삼거리 편의점 2층"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category">[필수] 카테고리*</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as Category)}
            >
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="카테고리 선택" />
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
            <Label htmlFor="menuInfo">[선택] 메뉴 및 가격</Label>
            <Input
              id="menuInfo"
              placeholder="예: 등심돈까스 8,000원"
              value={menuInfo}
              onChange={(event) => setMenuInfo(event.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" size="lg" disabled={submitting} className="mt-1">
            {submitting ? "등록 중..." : "제보 등록하기"}
          </Button>
        </form>
      </div>
    </div>
  );
}
