"use client";

import { useState } from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function ReviewImageGallery({ images }: { images: { id: string; url: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <div className="mt-2 flex gap-2 overflow-x-auto">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setOpenIndex(index)}
            className="h-[84px] w-[84px] shrink-0 overflow-hidden rounded-md"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      <Dialog open={openIndex !== null} onOpenChange={(open) => !open && setOpenIndex(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] bg-transparent p-0 ring-0 sm:max-w-2xl" showCloseButton>
          <DialogTitle className="sr-only">리뷰 사진</DialogTitle>
          {openIndex !== null && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={images[openIndex].url}
              alt=""
              className="max-h-[80vh] w-full rounded-md object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
