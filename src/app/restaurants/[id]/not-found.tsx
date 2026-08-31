import Link from "next/link";
import { FileX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/error-state";

// 즐겨찾기·공유 링크 등으로 들어온 식당이 삭제됐거나 존재하지 않을 때
// (page.tsx의 notFound() 분기에서 렌더링됨).
export default function RestaurantNotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8">
      <ErrorState
        icon={FileX}
        title="이 식당을 찾을 수 없어요"
        description="삭제되었거나 정보가 변경됐어요."
        action={
          <Button nativeButton={false} render={<Link href="/" />} variant="outline" size="sm">
            홈으로
          </Button>
        }
      />
    </main>
  );
}
