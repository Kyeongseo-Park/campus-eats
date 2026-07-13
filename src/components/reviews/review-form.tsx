"use client";

import { useState, type FormEvent } from "react";

import { StarRatingInput } from "@/components/reviews/star-rating-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ReviewFormProps {
  initialRating?: number;
  initialContent?: string;
  submitLabel: string;
  onSubmit: (data: { rating: number; content: string }) => Promise<{ error?: string } | void>;
  onCancel?: () => void;
}

export function ReviewForm({
  initialRating = 0,
  initialContent = "",
  submitLabel,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(initialRating);
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (rating < 1) {
      setError("별점을 선택해주세요.");
      return;
    }
    if (content.trim().length === 0) {
      setError("리뷰 내용을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await onSubmit({ rating, content: content.trim() });
      if (result?.error) setError(result.error);
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>별점</Label>
        <StarRatingInput value={rating} onChange={setRating} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="review-content">내용</Label>
        <Textarea
          id="review-content"
          required
          rows={4}
          placeholder="가성비 최고! 자주 올 것 같아요"
          value={content}
          onChange={(event) => setContent(event.target.value)}
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
