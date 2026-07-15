"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import { LocateFixed } from "lucide-react";

import { SCHOOL_MAIN_GATE } from "@/lib/constants";

export type RestaurantMapPoint = {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
};

// 카테고리를 "카페" vs "그 외 전부"의 두 그룹으로 단순화해 아이콘 2종만 쓴다.
const CAFE_CATEGORY = "카페";
type MarkerKind = "cafe" | "food";

// 마커 색상 규칙: 일반(오렌지) / 선택됨(빨강) / 내 위치(파랑, 항상 고정).
// 일반 마커는 옅고 반투명하게 두어 지도 위 도로명/건물명이 비쳐 보이게 하고,
// 선택된 마커만 크고 진하게 강조한다.
const PIN_NORMAL_SIZE = 21;
const PIN_SELECTED_SIZE = 30;
const PIN_COLOR_NORMAL = "#FF6B00";
const PIN_COLOR_SELECTED = "#EF4444";
const MY_LOCATION_COLOR = "#3B82F6";
const MY_LOCATION_SIZE = 18;

// 24x24 좌표계에 그려 두면 최종 픽셀 크기(PIN_NORMAL_SIZE 등)가 바뀌어도
// viewBox가 알아서 스케일해 주므로 아이콘을 다시 그릴 필요가 없다.
const COFFEE_ICON_SVG =
  '<rect x="8" y="9" width="8" height="7" rx="1.5" fill="#fff"/>' +
  '<path d="M16 10.5h1.3a1.6 1.6 0 0 1 0 3.2H16" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>' +
  '<rect x="7.3" y="16.3" width="9.4" height="1.1" rx="0.55" fill="#fff"/>';

// 왼쪽: 숟가락, 오른쪽: 포크 (한식/양식/중식/일식/분식/패스트푸드/기타 공용 아이콘).
const UTENSILS_ICON_SVG =
  '<ellipse cx="8.7" cy="8.6" rx="1.75" ry="2.4" fill="#fff"/>' +
  '<rect x="8.25" y="10.8" width="0.9" height="6.2" rx="0.45" fill="#fff"/>' +
  '<rect x="14.6" y="7" width="0.7" height="3" rx="0.35" fill="#fff"/>' +
  '<rect x="15.6" y="7" width="0.7" height="3" rx="0.35" fill="#fff"/>' +
  '<rect x="16.6" y="7" width="0.7" height="3" rx="0.35" fill="#fff"/>' +
  '<rect x="14.6" y="9.6" width="2.7" height="1" rx="0.5" fill="#fff"/>' +
  '<rect x="15.55" y="10.6" width="0.8" height="6.4" rx="0.4" fill="#fff"/>';

function buildPinImageSrc(
  kind: MarkerKind,
  size: number,
  { fillOpacity, strokeWidth, color }: { fillOpacity: number; strokeWidth: number; color: string }
) {
  const icon = kind === "cafe" ? COFFEE_ICON_SVG : UTENSILS_ICON_SVG;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="${color}" fill-opacity="${fillOpacity}" stroke="#ffffff" stroke-width="${strokeWidth}" />${icon}</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildMyLocationImageSrc() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${MY_LOCATION_SIZE}" height="${MY_LOCATION_SIZE}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="${MY_LOCATION_COLOR}" stroke="#ffffff" stroke-width="3" /></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// 클러스터 원은 일반 마커와 같은 브랜드 톤(오렌지)을 유지하되, 묶인 개수가 많을수록
// 크고 진해지도록 4단계로 나눈다.
const CLUSTER_CALCULATOR = [10, 30, 60];
const CLUSTER_STYLES: Array<Partial<CSSStyleDeclaration>> = [
  clusterStyle(32, "rgba(255, 107, 0, 0.85)"),
  clusterStyle(40, "rgba(255, 107, 0, 0.85)"),
  clusterStyle(48, "rgba(230, 96, 0, 0.88)"),
  clusterStyle(56, "rgba(194, 81, 0, 0.9)"),
];

function clusterStyle(size: number, background: string): Partial<CSSStyleDeclaration> {
  return {
    width: `${size}px`,
    height: `${size}px`,
    lineHeight: `${size - 2}px`,
    background,
    border: "2px solid #fff",
    borderRadius: "50%",
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: size >= 48 ? "14px" : "12px",
  };
}

type MarkerEntry = { marker: kakao.maps.Marker; isCafe: boolean };
type MarkerImageSet = { normal: kakao.maps.MarkerImage; selected: kakao.maps.MarkerImage };
type MarkerImages = { food: MarkerImageSet; cafe: MarkerImageSet };

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
  const clustererRef = useRef<kakao.maps.MarkerClusterer | null>(null);
  const markersRef = useRef<Map<string, MarkerEntry>>(new Map());
  const markerImagesRef = useRef<MarkerImages | null>(null);
  const myLocationMarkerRef = useRef<kakao.maps.Marker | null>(null);
  const myLocationImageRef = useRef<kakao.maps.MarkerImage | null>(null);
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

      const makeImage = (
        kind: MarkerKind,
        size: number,
        opts: { fillOpacity: number; strokeWidth: number; color: string }
      ) =>
        new window.kakao.maps.MarkerImage(buildPinImageSrc(kind, size, opts), new window.kakao.maps.Size(size, size), {
          offset: new window.kakao.maps.Point(size / 2, size / 2),
        });

      markerImagesRef.current = {
        food: {
          normal: makeImage("food", PIN_NORMAL_SIZE, { fillOpacity: 0.75, strokeWidth: 1.6, color: PIN_COLOR_NORMAL }),
          selected: makeImage("food", PIN_SELECTED_SIZE, { fillOpacity: 1, strokeWidth: 2.2, color: PIN_COLOR_SELECTED }),
        },
        cafe: {
          normal: makeImage("cafe", PIN_NORMAL_SIZE, { fillOpacity: 0.75, strokeWidth: 1.6, color: PIN_COLOR_NORMAL }),
          selected: makeImage("cafe", PIN_SELECTED_SIZE, { fillOpacity: 1, strokeWidth: 2.2, color: PIN_COLOR_SELECTED }),
        },
      };
      // 지도를 축소해 넓은 지역을 볼 때(레벨 6 이상)만 마커를 클러스터로 묶는다.
      clustererRef.current = new window.kakao.maps.MarkerClusterer({
        map,
        averageCenter: true,
        minLevel: 6,
        calculator: CLUSTER_CALCULATOR,
        styles: CLUSTER_STYLES,
      });

      myLocationImageRef.current = new window.kakao.maps.MarkerImage(
        buildMyLocationImageSrc(),
        new window.kakao.maps.Size(MY_LOCATION_SIZE, MY_LOCATION_SIZE),
        { offset: new window.kakao.maps.Point(MY_LOCATION_SIZE / 2, MY_LOCATION_SIZE / 2) }
      );

      setIsMapReady(true);

      // 위치 권한이 없거나 실패하면 학교 정문 좌표를 기준으로 유지한다 (PRD 6.1).
      navigator.geolocation?.getCurrentPosition((pos) => {
        const position = new window.kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        myLocationMarkerRef.current = new window.kakao.maps.Marker({ position, map, image: myLocationImageRef.current! });
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
        myLocationMarkerRef.current = new window.kakao.maps.Marker({ position, map, image: myLocationImageRef.current! });
      }
      // setLevel을 호출하지 않으므로 기존 확대/축소 레벨이 그대로 유지된다.
      map.panTo(position);
    });
  }

  useEffect(() => {
    const map = mapObjRef.current;
    const clusterer = clustererRef.current;
    const images = markerImagesRef.current;
    if (!map || !isMapReady || !clusterer || !images) return;

    clusterer.clear();
    markersRef.current.clear();

    if (restaurants.length === 0) return;

    const bounds = new window.kakao.maps.LatLngBounds();
    const markers: kakao.maps.Marker[] = [];

    for (const restaurant of restaurants) {
      const position = new window.kakao.maps.LatLng(restaurant.latitude, restaurant.longitude);
      bounds.extend(position);

      const isCafe = restaurant.category === CAFE_CATEGORY;
      const imageSet = isCafe ? images.cafe : images.food;
      const marker = new window.kakao.maps.Marker({
        position,
        image: restaurant.id === selectedIdRef.current ? imageSet.selected : imageSet.normal,
      });
      window.kakao.maps.event.addListener(marker, "click", () => onMarkerClickRef.current?.(restaurant.id));

      markersRef.current.set(restaurant.id, { marker, isCafe });
      markers.push(marker);
    }

    clusterer.addMarkers(markers);

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

    const images = markerImagesRef.current;
    if (!images) return;

    const previousId = selectedIdRef.current;
    selectedIdRef.current = selectedId;

    if (previousId && previousId !== selectedId) {
      const prev = markersRef.current.get(previousId);
      if (prev) prev.marker.setImage(prev.isCafe ? images.cafe.normal : images.food.normal);
    }

    if (!selectedId) return;

    const current = markersRef.current.get(selectedId);
    if (current) current.marker.setImage(current.isCafe ? images.cafe.selected : images.food.selected);

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
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=clusterer`}
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
