"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

import { REVIEW_IMAGE_ALLOWED_TYPES, REVIEW_IMAGE_MAX_COUNT, REVIEW_IMAGE_MAX_SIZE_MB } from "@/lib/constants";
import { isHeic, preloadHeicConverter, resizeImageForUpload } from "@/lib/image-resize";

type Phase = "idle" | "converting" | "uploading";

export function ReviewImageUpload({
  images,
  onChange,
  disabled,
}: {
  images: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  const canAddMore = images.length < REVIEW_IMAGE_MAX_COUNT;
  const isUploading = phase !== "idle";

  // HEIC 변환용 WASM 모듈은 용량이 커서, 사용자가 파일을 고르기 전에 미리 받아둔다.
  useEffect(() => {
    preloadHeicConverter();
  }, []);

  async function uploadOne(file: File): Promise<string> {
    const resized = await resizeImageForUpload(file);

    if (!REVIEW_IMAGE_ALLOWED_TYPES.includes(resized.type as (typeof REVIEW_IMAGE_ALLOWED_TYPES)[number])) {
      throw new Error("jpg, png, webp, heic 형식의 이미지만 업로드할 수 있습니다.");
    }
    if (resized.size > REVIEW_IMAGE_MAX_SIZE_MB * 1024 * 1024) {
      throw new Error(`${REVIEW_IMAGE_MAX_SIZE_MB}MB 이하의 이미지 파일만 업로드할 수 있습니다.`);
    }

    const blob = await upload(resized.name, resized, {
      access: "public",
      handleUploadUrl: "/api/reviews/upload",
    });
    return blob.url;
  }

  async function handleFilesSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (selected.length === 0) return;

    const remainingSlots = REVIEW_IMAGE_MAX_COUNT - images.length;
    const filesToUpload = selected.slice(0, remainingSlots);
    const skippedCount = selected.length - filesToUpload.length;

    setError(null);
    setPhase(filesToUpload.some(isHeic) ? "converting" : "uploading");

    const results = await Promise.allSettled(filesToUpload.map((file) => uploadOne(file)));
    setPhase("idle");

    const uploadedUrls = results
      .filter((result): result is PromiseFulfilledResult<string> => result.status === "fulfilled")
      .map((result) => result.value);
    const failures = results.filter((result): result is PromiseRejectedResult => result.status === "rejected");

    if (uploadedUrls.length > 0) {
      onChange([...images, ...uploadedUrls]);
    }

    const messages: string[] = [];
    if (skippedCount > 0) {
      messages.push(`최대 ${REVIEW_IMAGE_MAX_COUNT}장까지만 첨부할 수 있어 ${skippedCount}장은 제외됐습니다.`);
    }
    if (failures.length > 0) {
      const firstMessage = failures[0].reason instanceof Error ? failures[0].reason.message : "업로드에 실패했습니다.";
      messages.push(failures.length > 1 ? `${failures.length}장 업로드 실패: ${firstMessage}` : firstMessage);
    }
    if (messages.length > 0) {
      setError(messages.join(" "));
    }
  }

  function handleRemove(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">
        📷 사진 첨부 ({images.length}/{REVIEW_IMAGE_MAX_COUNT})
      </span>
      <div className="flex gap-2 overflow-x-auto">
        {images.map((url, index) => (
          <div key={url} className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            {index === 0 && (
              <span className="absolute top-1 left-1 rounded bg-primary px-1 py-0.5 text-[10px] font-bold text-primary-foreground">
                대표
              </span>
            )}
            <button
              type="button"
              onClick={() => handleRemove(index)}
              disabled={disabled}
              aria-label="사진 삭제"
              className="absolute top-1 right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-black/50 text-[10px] text-white"
            >
              ✕
            </button>
          </div>
        ))}

        {canAddMore && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || isUploading}
            className="flex h-[84px] w-[84px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-md border border-dashed border-gray-300 bg-gray-50 text-xs font-bold text-gray-700 disabled:opacity-50"
          >
            <span>📷</span>
            <span>{phase === "converting" ? "변환 중" : phase === "uploading" ? "업로드 중" : "사진 추가"}</span>
            <span className="text-xs font-normal text-gray-400">
              ({images.length}/{REVIEW_IMAGE_MAX_COUNT})
            </span>
          </button>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFilesSelect} />
      <p className="text-xs text-muted-foreground">
        * 사진 용량에 따라 업로드에 시간이 조금 걸릴 수 있어요. 잠시만 기다려주세요.
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
