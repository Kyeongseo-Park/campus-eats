"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Clock, Handshake, Map, MapPin, Navigation, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FavoriteButton } from "@/components/favorite-button";
import { ShareButton } from "@/components/share-button";
import { OpenStatusBadge } from "@/components/open-status-badge";
import { RestaurantMap } from "@/components/restaurant-map";
import { RestaurantCorrectionModal } from "@/components/restaurant-correction-modal";
import { ReviewSection } from "@/components/review-section";
import {
  DAY_KEYS,
  DAY_LABELS,
  currentDayKey,
  formatDayHours,
  type BusinessHours,
  type OpenStatus,
} from "@/lib/business-hours";

type ModalRestaurant = {
  id: string;
  name: string;
  category: string;
  zone: string;
  address: string;
  latitude: number;
  longitude: number;
  businessHours: BusinessHours | null;
  openStatus: OpenStatus;
  avgRating: number | null;
  reviewCount: number;
  menus: { id: string; name: string; price: number }[];
  isFavorited: boolean;
  isPartnershipActive: boolean;
  partnershipInfo: string | null;
};

// 지도/목록에서 식당을 선택하면 이 모달이 즉시 열려 위치·메뉴·리뷰를 한 화면에서 보여준다
// (기존 "상세보기" 페이지 이동 단계를 없앤 것). restaurantId가 바뀔 때마다 클라이언트에서
// /api/restaurants/[id]를 새로 fetch한다.
export function RestaurantDetailModal({
  restaurantId,
  isLoggedIn,
  currentUserId,
  openReviewForm = false,
  onClose,
}: {
  restaurantId: string | null;
  isLoggedIn: boolean;
  currentUserId: string | null;
  /// true면 모달이 열리자마자 리뷰 작성 폼이 펼쳐진 상태로 보인다(요약카드의 "리뷰 작성" 버튼용).
  openReviewForm?: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<ModalRestaurant | null>(null);
  // 실패한 요청이 어느 restaurantId에 대한 것이었는지 함께 저장해, 식당을 바꿔 다시 열었을 때
  // 이전 에러가 새 요청의 로딩 상태를 가리지 않도록 한다.
  const [error, setError] = useState<{ id: string; message: string } | null>(null);
  const [correctionOpen, setCorrectionOpen] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;

    let cancelled = false;

    fetch(`/api/restaurants/${restaurantId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (!cancelled) setData(json.restaurant);
      })
      .catch(() => {
        if (!cancelled) setError({ id: restaurantId, message: "식당 정보를 불러오지 못했습니다." });
      });

    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  useEffect(() => {
    // 상세 모달이 닫히거나 다른 식당으로 바뀌면 정보수정 제안 모달도 닫는다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCorrectionOpen(false);
  }, [restaurantId]);

  const isCurrent = data?.id === restaurantId;
  const currentError = error?.id === restaurantId ? error.message : null;
  const loading = restaurantId !== null && !isCurrent && !currentError;

  return (
    <Dialog open={restaurantId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] w-full max-w-lg flex-col gap-0 overflow-hidden rounded-3xl border border-gray-100 bg-white p-0 shadow-xl sm:max-w-lg"
      >
        <DialogTitle className="sr-only">{data?.name ?? "식당 상세정보"}</DialogTitle>

        {loading && <div className="p-10 text-center text-sm text-gray-500">불러오는 중...</div>}
        {currentError && <div className="p-10 text-center text-sm text-destructive">{currentError}</div>}

        {isCurrent && data && (
          <>
            <header className="flex items-center justify-between gap-2 border-b border-gray-100 bg-white/95 px-5 py-3.5 backdrop-blur-md">
              <span className="min-w-0 truncate text-xs font-semibold text-gray-500">{data.category}</span>
              <div className="flex shrink-0 items-center gap-1">
                <FavoriteButton restaurantId={data.id} initialFavorited={data.isFavorited} isLoggedIn={isLoggedIn} />
                <ShareButton
                  title={data.name}
                  path={`/restaurants/${data.id}`}
                  category={data.category}
                  avgRating={data.avgRating}
                  reviewCount={data.reviewCount}
                />
                <Button type="button" variant="ghost" size="icon" aria-label="닫기" onClick={onClose}>
                  <X className="size-4" />
                </Button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl">{data.name}</h2>
                  {data.isPartnershipActive && <Badge variant="secondary">제휴</Badge>}
                  <OpenStatusBadge status={data.openStatus} />
                </div>
                <Button
                  nativeButton={false}
                  render={
                    <a
                      href={`https://map.kakao.com/link/to/${encodeURIComponent(data.name)},${data.latitude},${data.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                >
                  <Navigation className="size-3.5" />
                  길찾기
                </Button>
              </div>

              <div className="mt-3 flex flex-col gap-2.5">
                <LocationMapAccordion
                  id={data.id}
                  name={data.name}
                  category={data.category}
                  latitude={data.latitude}
                  longitude={data.longitude}
                />
                <HoursAccordion businessHours={data.businessHours} openStatus={data.openStatus} />
                <CorrectionSuggestLink isLoggedIn={isLoggedIn} onSuggest={() => setCorrectionOpen(true)} />
                <AddressRow address={data.address} />
              </div>

              <div className="my-4 border-t border-gray-100" />

              {data.isPartnershipActive && data.partnershipInfo && (
                <>
                  <PartnershipSection info={data.partnershipInfo} />
                  <div className="my-4 border-t border-gray-100" />
                </>
              )}

              <MenuSection menus={data.menus} />

              <div className="my-4 border-t border-gray-100" />

              <ReviewSection
                restaurantId={data.id}
                isLoggedIn={isLoggedIn}
                currentUserId={currentUserId}
                avgRating={data.avgRating}
                openReviewForm={openReviewForm}
              />
            </div>

            <RestaurantCorrectionModal
              restaurantId={data.id}
              open={correctionOpen}
              onClose={() => setCorrectionOpen(false)}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function LocationMapAccordion({
  id,
  name,
  category,
  latitude,
  longitude,
}: {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border border-gray-200/90 bg-white px-3.5 py-2.5 text-sm transition-colors hover:bg-gray-50/80"
      >
        <span className="flex items-center gap-1.5 font-semibold text-gray-800">
          <Map className="size-4 text-gray-400" />
          {expanded ? "지도 접기" : "지도 펼치기"}
        </span>
        {expanded ? <ChevronUp className="size-4 text-gray-400" /> : <ChevronDown className="size-4 text-gray-400" />}
      </button>

      {expanded && (
        <div className="mt-2 h-48 w-full overflow-hidden rounded-xl border border-gray-200/80">
          <RestaurantMap restaurants={[{ id, name, category, latitude, longitude }]} selectedId={id} />
        </div>
      )}
    </div>
  );
}

const HOURS_STATUS_LABEL: Record<OpenStatus, string> = {
  open: "영업중",
  break: "브레이크타임",
  closed: "영업종료",
  unknown: "영업시간 정보 없음",
};

function HoursAccordion({
  businessHours,
  openStatus,
}: {
  businessHours: BusinessHours | null;
  openStatus: OpenStatus;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!businessHours) return null;

  const todaySummary = formatDayHours(businessHours[currentDayKey()]);
  const closedDays = DAY_KEYS.filter((day) => businessHours[day] === null);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border border-gray-200/90 bg-white px-3.5 py-2.5 text-sm transition-colors hover:bg-gray-50/80"
      >
        <span className="flex items-center gap-1.5 font-semibold text-gray-800">
          <Clock className="size-4 text-gray-400" />
          {HOURS_STATUS_LABEL[openStatus]} · {todaySummary}
        </span>
        {expanded ? <ChevronUp className="size-4 text-gray-400" /> : <ChevronDown className="size-4 text-gray-400" />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 rounded-xl border border-gray-200/80 bg-gray-50/80 p-3.5 text-xs text-gray-700">
          {DAY_KEYS.map((day) => (
            <div key={day} className="flex justify-between">
              <span className="text-gray-500">{DAY_LABELS[day]}</span>
              <span>{formatDayHours(businessHours[day])}</span>
            </div>
          ))}
          {closedDays.length > 0 && (
            <p className="border-t border-gray-200/80 pt-2 text-gray-500">
              정기휴무 · {closedDays.map((day) => DAY_LABELS[day]).join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// 로그인 상태면 정보수정 제안 모달을 열고(onSuggest), 아니면 로그인 페이지로 보낸다.
function CorrectionSuggestLink({
  isLoggedIn,
  onSuggest,
}: {
  isLoggedIn: boolean;
  onSuggest: () => void;
}) {
  const className = "w-fit text-xs font-semibold text-green-600 transition-colors hover:text-green-700";

  if (!isLoggedIn) {
    return (
      <Link href="/login" className={className}>
        정보수정 제안
      </Link>
    );
  }

  return (
    <button type="button" onClick={onSuggest} className={className}>
      정보수정 제안
    </button>
  );
}

function AddressRow({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 클립보드 권한이 없는 환경은 조용히 무시한다.
    }
  }

  return (
    <button type="button" onClick={handleCopy} className="flex min-w-0 items-center gap-1.5 text-left">
      <MapPin className="size-4 shrink-0 text-gray-400" />
      <span className="truncate font-medium text-gray-600 hover:text-gray-900">{address}</span>
      {copied && <span className="shrink-0 text-[11px] font-bold text-orange-600">복사완료!</span>}
    </button>
  );
}

function PartnershipSection({ info }: { info: string }) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-gray-900">
        <Handshake className="size-4 text-orange-500" />
        제휴 혜택
      </h3>
      <div className="flex items-start gap-2.5 rounded-2xl border border-orange-200/80 bg-orange-50/60 p-3.5 shadow-sm">
        <span className="shrink-0 rounded-md bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">제휴 혜택</span>
        <p className="text-xs font-semibold leading-relaxed text-orange-950">{info}</p>
      </div>
    </div>
  );
}

function MenuSection({ menus }: { menus: { id: string; name: string; price: number }[] }) {
  const [expanded, setExpanded] = useState(false);

  if (menus.length === 0) {
    return <p className="text-sm text-gray-500">등록된 메뉴가 없어요.</p>;
  }

  const visibleMenus = expanded ? menus : menus.slice(0, 3);

  return (
    <div>
      <h3 className="text-base font-bold text-gray-900">메뉴</h3>
      <ul className="mt-1">
        {visibleMenus.map((menu) => (
          <li key={menu.id} className="flex items-center justify-between py-1 text-sm">
            <span className="font-medium text-gray-800">{menu.name}</span>
            <span className="font-bold text-gray-900">{menu.price.toLocaleString()}원</span>
          </li>
        ))}
      </ul>
      {menus.length > 3 && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex cursor-pointer items-center gap-1 pt-1 text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          {expanded ? "메뉴 접기" : "메뉴 더보기"}
          {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>
      )}
    </div>
  );
}
