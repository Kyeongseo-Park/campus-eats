"use client";

import { useEffect } from "react";
import { RefreshCw, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/error-state";

// 라우트 세그먼트에서 렌더링 중 에러가 났을 때 표시되는 앱 전역 에러 경계.
// (API 요청 실패·타임아웃 등 서버 컴포넌트에서 throw된 에러 포함. 루트 layout 자체의 에러는 잡지 않음)
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8">
      <ErrorState
        icon={WifiOff}
        title="정보를 불러오지 못했어요"
        description="네트워크 상태를 확인하고 다시 시도해주세요."
        action={
          <Button variant="outline" size="sm" onClick={reset}>
            <RefreshCw className="size-3.5" />
            다시 시도
          </Button>
        }
      />
    </main>
  );
}
