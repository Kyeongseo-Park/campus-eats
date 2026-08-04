"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const SWIPE_THRESHOLD_PX = 40;

export function ReviewImageGallery({ images }: { images: { id: string; url: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  if (images.length === 0) return null;

  function showPrev() {
    setOpenIndex((current) => (current === null ? null : (current - 1 + images.length) % images.length));
  }

  function showNext() {
    setOpenIndex((current) => (current === null ? null : (current + 1) % images.length));
  }

  function handleTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0].clientX;
  }

  function handleTouchEnd(event: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    if (deltaX > 0) {
      showPrev();
    } else {
      showNext();
    }
  }

  return (
    <>
      <div className="mt-2 flex gap-2 overflow-x-auto">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setOpenIndex(index)}
            className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-md"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt="" className="h-full w-full object-cover" />
            {index === 0 && images.length > 1 && (
              <span className="absolute top-1 left-1 rounded bg-primary px-1 py-0.5 text-[10px] font-bold text-primary-foreground">
                대표
              </span>
            )}
          </button>
        ))}
      </div>

      <Dialog open={openIndex !== null} onOpenChange={(open) => !open && setOpenIndex(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] bg-transparent p-0 ring-0 sm:max-w-2xl" showCloseButton>
          <DialogTitle className="sr-only">리뷰 사진</DialogTitle>
          {openIndex !== null && (
            <div
              className="relative"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[openIndex].url}
                alt=""
                className="max-h-[80vh] w-full rounded-md object-contain select-none"
                draggable={false}
              />

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPrev}
                    aria-label="이전 사진"
                    className="absolute top-1/2 left-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={showNext}
                    aria-label="다음 사진"
                    className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
                    {openIndex + 1} / {images.length}
                  </span>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
