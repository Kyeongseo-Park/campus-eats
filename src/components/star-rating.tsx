"use client";

import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export function StarPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => onChange(star)} aria-label={`${star}점`} className="p-0.5">
          <Star className={cn("size-5", star <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
        </button>
      ))}
    </div>
  );
}

export function StaticStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn("size-4", star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")}
        />
      ))}
    </div>
  );
}
