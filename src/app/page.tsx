import Link from "next/link";

import { Button } from "@/components/ui/button";
import { KakaoMap } from "@/components/kakao-map";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-8 text-center">
      <div>
        <h1 className="text-3xl font-semibold">학식 말고 뭐 먹지?</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          학교 주변 식당의 메뉴, 가격, 리뷰, 제휴이벤트를 한곳에서 확인하세요.
        </p>
      </div>

      <div className="w-full max-w-2xl">
        <KakaoMap />
      </div>

      <Button nativeButton={false} render={<Link href="/restaurants" />}>
        식당 목록 보기
      </Button>
    </main>
  );
}
