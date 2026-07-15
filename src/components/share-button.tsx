"use client";

import { useState, type MouseEvent } from "react";
import { Check, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // 사용자가 공유 시트를 취소한 경우 등은 무시한다.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 클립보드 권한이 없는 환경은 조용히 무시한다.
    }
  }

  return (
    <Button type="button" variant="ghost" size="icon" aria-label="공유하기" onClick={handleShare}>
      {copied ? <Check className="size-4 text-green-600" /> : <Share2 className="size-4" />}
    </Button>
  );
}
