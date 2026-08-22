"use client";

import { useEffect } from "react";

// 커스텀 URL 스킴(campuseats://...) 딥링크로 자동 이동시킨다.
// 일부 브라우저는 첫 시도에서 스킴 오픈을 막을 수 있어, 페이지에 별도로 렌더링되는
// "앱으로 돌아가기" 링크가 폴백 역할을 한다.
export function AutoRedirect({ href }: { href: string }) {
  useEffect(() => {
    window.location.href = href;
  }, [href]);

  return null;
}
