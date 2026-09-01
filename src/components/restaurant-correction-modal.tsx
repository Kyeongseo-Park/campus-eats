"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SessionExpiredDialog } from "@/components/session-expired-dialog";

const CONTENT_MAX_LENGTH = 500;

// 상세 모달 위에 겹쳐 뜨는 2중 모달 (리뷰 작성 모달과 동일한 패턴).
// 닫으면 입력/완료 상태가 모두 초기화된다.
export function RestaurantCorrectionModal({
  restaurantId,
  open,
  onClose,
}: {
  restaurantId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [content, setContent] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  function handleClose() {
    setContent("");
    setSubmitted(false);
    setError(null);
    setIsSubmitting(false);
    onClose();
  }

  const canSubmit = content.trim().length > 0 && !isSubmitting;

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/corrections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.status === 401) {
        // 작성 중 세션이 끊긴 경우 — 입력 내용은 그대로 두고 만료 모달을 띄운다.
        setSessionExpired(true);
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "제출에 실패했습니다.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <SessionExpiredDialog open={sessionExpired} onClose={() => setSessionExpired(false)} />
      <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
        <DialogContent
          showCloseButton={false}
          className="flex max-h-[90vh] w-full max-w-md flex-col gap-0 overflow-hidden rounded-3xl border border-gray-100 bg-white p-0 shadow-xl"
        >
          <header className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
            <DialogTitle className="text-base font-bold text-gray-900">정보수정 제안</DialogTitle>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="닫기" onClick={handleClose}>
              <X className="size-4" />
            </Button>
          </header>

          {submitted ? (
            <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
              <span className="text-5xl">✅</span>
              <p className="text-base font-bold text-gray-900">제안이 등록되었어요</p>
              <p className="text-sm text-gray-500">검토 후 반영할게요.
                <br />
                알려주셔서 감사해요!
              </p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <p className="text-xs leading-relaxed text-gray-500">
                  잘못된 정보나 새로 추가되어야 할 내용을 자유롭게 적어주세요. (예: 영업시간 변경, 메뉴 가격 변동 등)
                </p>

                <div className="mt-3 flex flex-col gap-1">
                  <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value.slice(0, CONTENT_MAX_LENGTH))}
                    maxLength={CONTENT_MAX_LENGTH}
                    rows={5}
                    placeholder="예: 브레이크타임이 15시~17시로 바뀌었어요."
                    className="w-full resize-none rounded-lg border border-gray-200 p-2.5 text-sm focus:border-green-500 focus:outline-none"
                  />
                  <span className="self-end text-xs text-gray-400">
                    {content.length}/{CONTENT_MAX_LENGTH}
                  </span>
                </div>

                {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
              </div>

              <div className="border-t border-gray-100 p-4">
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? "제출 중..." : "제안 보내기"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
