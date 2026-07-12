"use client";

import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  restaurantId,
  initialFavorited,
  isLoggedIn,
}: {
  restaurantId: string;
  initialFavorited: boolean;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function toggle(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (isSubmitting) return;

    const next = !favorited;
    setFavorited(next);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/favorites/${restaurantId}`, { method: next ? "POST" : "DELETE" });
      if (!res.ok) {
        setFavorited(!next);
        return;
      }
      router.refresh();
    } catch {
      setFavorited(!next);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={favorited ? "즐겨찾기 삭제" : "즐겨찾기 추가"}
      aria-pressed={favorited}
      onClick={toggle}
    >
      <Heart className={cn("size-4", favorited && "fill-red-500 text-red-500")} />
    </Button>
  );
}
