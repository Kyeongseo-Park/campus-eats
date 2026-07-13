"use client";

import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="별점">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star}점`}
          onClick={() => onChange(star)}
          className="p-0.5"
        >
          <Star
            className={cn(
              "size-7",
              star <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
            )}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-muted-foreground">{value > 0 ? `${value}점` : ""}</span>
    </div>
  );
}
