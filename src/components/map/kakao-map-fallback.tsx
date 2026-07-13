export type KakaoMapErrorStatus = "missing-key" | "error";

export function kakaoMapFallbackText(status: KakaoMapErrorStatus) {
  return status === "missing-key"
    ? "지도를 표시하려면 .env의 NEXT_PUBLIC_KAKAO_MAP_KEY 값을 설정해야 합니다."
    : "지도를 불러오지 못했습니다. Kakao Developers 콘솔의 플랫폼 > Web에 현재 도메인이 등록되어 있는지 확인해주세요.";
}

export function KakaoMapFallback({ status }: { status: KakaoMapErrorStatus }) {
  return (
    <div className="flex h-full items-center justify-center bg-muted p-6 text-center text-sm text-muted-foreground">
      {kakaoMapFallbackText(status)}
    </div>
  );
}
