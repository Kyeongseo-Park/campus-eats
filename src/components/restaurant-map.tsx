"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import { LocateFixed } from "lucide-react";

import { SCHOOL_MAIN_GATE } from "@/lib/constants";

export type RestaurantMapPoint = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

// 테마 자체가 무채색(oklch chroma 0)이라 bg-primary 등 시맨틱 색상으로는
// 선택 여부가 거의 구분되지 않는다. 지도 핀만은 고정된 파란색 강조색을 쓴다.
const PIN_BASE_CLASS =
  "flex items-center justify-center rounded-full ring-2 ring-background shadow-md cursor-pointer transition-transform";
const PIN_NORMAL_CLASS = `${PIN_BASE_CLASS} h-5 w-5 bg-foreground/80`;
const PIN_SELECTED_CLASS = `${PIN_BASE_CLASS} h-7 w-7 bg-blue-500 scale-110`;

type OverlayEntry = { overlay: kakao.maps.CustomOverlay; el: HTMLDivElement };

export function RestaurantMap({
  restaurants,
  selectedId,
  onMarkerClick,
  locateButtonBottomOffsetPx = 16,
}: {
  restaurants: RestaurantMapPoint[];
  selectedId: string | null;
  // 옵셔널: 서버 컴포넌트(예: 식당 상세 페이지의 위치 탭)에서 정적으로 렌더링할 때는
  // 이벤트 핸들러를 클라이언트 컴포넌트로 넘길 수 없으므로 생략한다. 이 경우 기본값인
  // 빈 함수는 이 클라이언트 컴포넌트 내부에서 정의되므로 서버→클라이언트 경계를 넘지 않는다.
  onMarkerClick?: (id: string) => void;
  // "내 위치로 돌아가기" 버튼의 하단 여백.
  locateButtonBottomOffsetPx?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapObjRef = useRef<kakao.maps.Map | null>(null);
  const overlaysRef = useRef<Map<string, OverlayEntry>>(new Map());
  const myLocationMarkerRef = useRef<kakao.maps.Marker | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const onMarkerClickRef = useRef(onMarkerClick);
  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  });

  const [isSdkReady, setIsSdkReady] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;

  // FavoriteButton의 router.refresh() 등으로 restaurants가 새 배열 참조로 바뀌어도
  // 실제 id 구성이 같으면 마커를 재생성/재-fit하지 않기 위한 안정적인 키.
  const restaurantIdsKey = useMemo(() => restaurants.map((r) => r.id).sort().join(","), [restaurants]);

  useEffect(() => {
    if (!isSdkReady) return;

    window.kakao.maps.load(() => {
      if (!containerRef.current) return;

      const center = new window.kakao.maps.LatLng(SCHOOL_MAIN_GATE.latitude, SCHOOL_MAIN_GATE.longitude);
      const map = new window.kakao.maps.Map(containerRef.current, { center, level: 4 });
      mapObjRef.current = map;
      setIsMapReady(true);

      // 위치 권한이 없거나 실패하면 학교 정문 좌표를 기준으로 유지한다 (PRD 6.1).
      navigator.geolocation?.getCurrentPosition((pos) => {
        const position = new window.kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        myLocationMarkerRef.current = new window.kakao.maps.Marker({ position, map });
      });
    });
  }, [isSdkReady]);

  // "내 위치로 돌아가기" 클릭 시마다 navigator.geolocation을 다시 호출해 최신 좌표로 갱신한다.
  // getCurrentPosition 호출 자체가 브라우저의 위치 권한 요청 트리거이므로, 아직 응답한 적 없는
  // 상태("prompt")라면 이 클릭으로 권한 팝업이 뜬다. 이미 거부된 상태("denied")라면 브라우저 정책상
  // JS로 팝업을 다시 띄울 수 없어 곧바로 에러 콜백으로 빠진다.
  function handleLocateClick() {
    const map = mapObjRef.current;
    if (!map || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition((pos) => {
      const position = new window.kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
      if (myLocationMarkerRef.current) {
        myLocationMarkerRef.current.setPosition(position);
      } else {
        myLocationMarkerRef.current = new window.kakao.maps.Marker({ position, map });
      }
      // setLevel을 호출하지 않으므로 기존 확대/축소 레벨이 그대로 유지된다.
      map.panTo(position);
    });
  }

  useEffect(() => {
    const map = mapObjRef.current;
    if (!map || !isMapReady) return;

    for (const { overlay } of overlaysRef.current.values()) {
      overlay.setMap(null);
    }
    overlaysRef.current.clear();

    if (restaurants.length === 0) return;

    const bounds = new window.kakao.maps.LatLngBounds();

    for (const restaurant of restaurants) {
      const position = new window.kakao.maps.LatLng(restaurant.latitude, restaurant.longitude);
      bounds.extend(position);

      const el = document.createElement("div");
      el.className = restaurant.id === selectedIdRef.current ? PIN_SELECTED_CLASS : PIN_NORMAL_CLASS;
      el.addEventListener("click", () => onMarkerClickRef.current?.(restaurant.id));

      const overlay = new window.kakao.maps.CustomOverlay({
        position,
        content: el,
        map,
        clickable: true,
        yAnchor: 0.5,
      });

      overlaysRef.current.set(restaurant.id, { overlay, el });
    }

    if (!selectedIdRef.current) {
      if (restaurants.length === 1) {
        map.setCenter(new window.kakao.maps.LatLng(restaurants[0].latitude, restaurants[0].longitude));
        map.setLevel(4);
      } else {
        // 지도 박스 위에 필터 바가 겹쳐 떠 있으므로 상단 여백을 더 준다.
        map.setBounds(bounds, 90, 24, 24, 24);
      }
    }
    // restaurants 원본 배열이 아니라 id 구성 변화에만 반응한다 (위 주석 참고).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantIdsKey, isMapReady]);

  useEffect(() => {
    const map = mapObjRef.current;
    if (!map || !isMapReady) return;

    const previousId = selectedIdRef.current;
    selectedIdRef.current = selectedId;

    if (previousId && previousId !== selectedId) {
      const prev = overlaysRef.current.get(previousId);
      if (prev) prev.el.className = PIN_NORMAL_CLASS;
    }

    if (!selectedId) return;

    const current = overlaysRef.current.get(selectedId);
    if (current) current.el.className = PIN_SELECTED_CLASS;

    const restaurant = restaurants.find((r) => r.id === selectedId);
    if (!restaurant) return;

    // 줌 레벨은 건드리지 않고 중심 좌표만 부드럽게 이동시켜 선택한 마커를 정중앙에 맞춘다.
    map.panTo(new window.kakao.maps.LatLng(restaurant.latitude, restaurant.longitude));
  }, [selectedId, isMapReady, restaurants]);

  if (!appKey) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
        지도를 표시하려면 NEXT_PUBLIC_KAKAO_MAP_APP_KEY 환경변수가 필요합니다.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`}
        strategy="afterInteractive"
        onReady={() => setIsSdkReady(true)}
      />
      <div ref={containerRef} className="h-full w-full" />
      {isMapReady && (
        <button
          type="button"
          onClick={handleLocateClick}
          aria-label="현재 내 위치로 이동"
          style={{ bottom: locateButtonBottomOffsetPx }}
          className="absolute right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-background shadow-md ring-1 ring-foreground/10 transition-colors hover:bg-muted"
        >
          <LocateFixed className="size-5" />
        </button>
      )}
    </div>
  );
}
