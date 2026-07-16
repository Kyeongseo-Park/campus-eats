const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// partnershipStartDate/EndDate는 Prisma `@db.Date` 컬럼이라 UTC 자정 시각의 Date로 들어온다
// (예: "2026-07-20" → 2026-07-20T00:00:00.000Z, 이는 한국 시간 오전 9시).
// now(현재 시각)를 그대로 비교하면 한국 시간 기준 하루의 앞뒤 9시간이 밀려 종료일 오전에
// 조기 종료되는 등의 오차가 생기므로, "오늘"을 한국 시간 기준 캘린더 날짜의 UTC 자정 값으로
// 변환해 날짜 단위로만 비교한다.
export function todayAsUtcDate(now: Date = new Date()): Date {
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  return new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()));
}

// 별도 on/off 스위치 없이, 오늘 날짜가 시작일~종료일 사이인지로 매번 계산한다 (PRD 6.1).
export function isPartnershipActive(
  startDate: Date | null,
  endDate: Date | null,
  now: Date = new Date()
): boolean {
  if (!startDate || !endDate) return false;
  const today = todayAsUtcDate(now);
  return startDate <= today && today <= endDate;
}
