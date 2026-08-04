"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { StarPicker } from "@/components/star-rating";
import { ReviewImageUpload } from "@/components/review-image-upload";
import { REVIEW_TAG_MAX_COUNT } from "@/lib/constants";
import { cn } from "@/lib/utils";

const CONTENT_MAX_LENGTH = 500;

type Tag = { id: string; group: string; label: string };

const GROUP_ICON: Record<string, string> = {
  음식: "🍚",
  매장: "🏠",
  서비스: "🔔",
  이용목적: "👥",
};

export function ReviewWriteModal({
  restaurantId,
  open,
  onClose,
  onCreated,
}: {
  restaurantId: string;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [rating, setRating] = useState(5);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [showLimitHint, setShowLimitHint] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch("/api/tags")
      .then((res) => res.json())
      .then((data) => setTags(data.tags ?? []));
  }, [open]);

  function resetForm() {
    setRating(5);
    setSelectedTagIds([]);
    setContent("");
    setImages([]);
    setShowLimitHint(false);
    setError(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  const groupedTags = useMemo(() => {
    const groups = new Map<string, Tag[]>();
    for (const tag of tags) {
      if (!groups.has(tag.group)) groups.set(tag.group, []);
      groups.get(tag.group)!.push(tag);
    }
    return [...groups.entries()];
  }, [tags]);

  const canSubmit = (content.trim().length > 0 || selectedTagIds.length > 0) && !isSubmitting;

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) => {
      if (prev.includes(tagId)) {
        setShowLimitHint(false);
        return prev.filter((id) => id !== tagId);
      }
      if (prev.length >= REVIEW_TAG_MAX_COUNT) {
        setShowLimitHint(true);
        return prev;
      }
      setShowLimitHint(false);
      return [...prev, tagId];
    });
  }

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, rating, content, images, tagIds: selectedTagIds }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "리뷰 작성에 실패했습니다.");
        return;
      }

      onCreated();
      handleClose();
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] w-full max-w-md flex-col gap-0 overflow-hidden rounded-3xl border border-gray-100 bg-white p-0 shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
          <DialogTitle className="text-base font-bold text-gray-900">리뷰 작성</DialogTitle>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="닫기" onClick={handleClose}>
            <X className="size-4" />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-semibold text-gray-500">별점 평가</span>
            <div className="flex items-center gap-2">
              <StarPicker value={rating} onChange={setRating} />
              <span className="text-sm font-bold text-gray-900">({rating.toFixed(1)})</span>
            </div>
          </div>

          <div className="my-4 border-t border-gray-100" />

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-600">STEP 1</span>
              <span className="text-sm font-bold text-gray-900">어떤 점이 좋았나요?</span>
            </div>
            <p className="text-xs text-gray-500">어울리는 키워드를 골라주세요 (1개~5개)</p>
          </div>

          <div className="mt-3 flex flex-col gap-3">
            {groupedTags.map(([group, groupTags]) => (
              <div key={group} className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-gray-600">
                  {GROUP_ICON[group] ?? ""} {group}
                </span>
                <div className="flex flex-wrap gap-2">
                  {groupTags.map((tag) => {
                    const selected = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleTag(tag.id)}
                        className={cn(
                          "flex items-center gap-1 rounded-[20px] border px-3 py-1.5 text-xs font-medium transition-colors",
                          selected
                            ? "border-orange-500 bg-orange-50 text-orange-600"
                            : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        {selected && <Check className="size-3" />}
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {showLimitHint && <p className="mt-2 text-xs font-medium text-orange-600">최대 5개까지 선택 가능해요</p>}

          <div className="my-4 border-t border-gray-100" />

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-600">STEP 2</span>
              <span className="text-sm font-bold text-gray-900">상세 후기 작성</span>
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-1">
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value.slice(0, CONTENT_MAX_LENGTH))}
              maxLength={CONTENT_MAX_LENGTH}
              rows={4}
              placeholder="식당에 대한 솔직한 리뷰를 남겨주세요. (선택한 태그 외에 공유하고 싶은 이야기를 적어주세요)"
              className="w-full resize-none rounded-lg border border-gray-200 p-2.5 text-sm focus:border-orange-500 focus:outline-none"
            />
            <span className="self-end text-xs text-gray-400">
              {content.length}/{CONTENT_MAX_LENGTH}
            </span>
          </div>

          <div className="mt-2">
            <ReviewImageUpload images={images} onChange={setImages} disabled={isSubmitting} />
          </div>

          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>

        <div className="border-t border-gray-100 p-4">
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit} className="w-full">
            {isSubmitting ? "등록 중..." : "리뷰 등록하기"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
