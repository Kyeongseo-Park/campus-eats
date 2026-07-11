// 별도 on/off 스위치 없이, 오늘 날짜가 시작일~종료일 사이인지로 매번 계산한다 (PRD 6.1).
export function isPartnershipActive(
  startDate: Date | null,
  endDate: Date | null,
  now: Date = new Date()
): boolean {
  if (!startDate || !endDate) return false;
  return startDate <= now && now <= endDate;
}
