const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayKey = (typeof DAY_KEYS)[number];

export type DayHours = {
  open: string; // "HH:MM"
  close: string; // "HH:MM", may be earlier than open (영업이 자정을 넘어가는 경우)
  breakStart?: string;
  breakEnd?: string;
} | null; // null = 휴무일

export type BusinessHours = Record<DayKey, DayHours>;

export type OpenStatus = "open" | "break" | "closed" | "unknown";

// KST(Date 컬럼과 무관하게 실제 "지금") 기준 요일 인덱스 + 자정부터 지난 분(分).
function nowInKst(now: Date): { dayKey: DayKey; minutes: number } {
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  const jsDay = kst.getUTCDay(); // 0=일 1=월 ... 6=토
  const dayKey = DAY_KEYS[(jsDay + 6) % 7]; // mon..sun 순서로 재배치
  const minutes = kst.getUTCHours() * 60 + kst.getUTCMinutes();
  return { dayKey, minutes };
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// 영업시간이 자정을 넘기는 경우(예: 16:00~01:00)를 고려해, "지금이 open~close 사이인지"를
// 전날 개시분까지 포함해서 판정한다.
function isWithinRange(minutes: number, startMin: number, endMinRaw: number): boolean {
  const endMin = endMinRaw <= startMin ? endMinRaw + 24 * 60 : endMinRaw;
  if (minutes >= startMin && minutes < endMin) return true;
  // 전날부터 이어진 영업(자정 넘김)에 지금이 걸쳐 있는 경우
  if (endMinRaw <= startMin && minutes < endMinRaw) return true;
  return false;
}

export function getOpenStatus(hours: BusinessHours | null | undefined, now: Date = new Date()): OpenStatus {
  if (!hours) return "unknown";

  const { dayKey, minutes } = nowInKst(now);
  const today = hours[dayKey];

  // 전날 영업이 자정을 넘겨 오늘 새벽까지 이어지는 경우도 확인해야 하므로 전날도 함께 본다.
  const prevDayKey = DAY_KEYS[(DAY_KEYS.indexOf(dayKey) + 6) % 7];
  const prevDay = hours[prevDayKey];

  if (prevDay) {
    const start = toMinutes(prevDay.open);
    const end = toMinutes(prevDay.close);
    if (end <= start && minutes < end) {
      // 전날 영업이 자정을 넘겨 지금까지 이어지는 중
      if (prevDay.breakStart && prevDay.breakEnd) {
        const bStart = toMinutes(prevDay.breakStart);
        const bEnd = toMinutes(prevDay.breakEnd);
        if (isWithinRange(minutes, bStart, bEnd)) return "break";
      }
      return "open";
    }
  }

  if (!today) return "closed";

  const startMin = toMinutes(today.open);
  const endMin = toMinutes(today.close);
  if (!isWithinRange(minutes, startMin, endMin)) return "closed";

  if (today.breakStart && today.breakEnd) {
    const bStart = toMinutes(today.breakStart);
    const bEnd = toMinutes(today.breakEnd);
    if (isWithinRange(minutes, bStart, bEnd)) return "break";
  }

  return "open";
}

export const DAY_LABELS: Record<DayKey, string> = {
  mon: "월",
  tue: "화",
  wed: "수",
  thu: "목",
  fri: "금",
  sat: "토",
  sun: "일",
};

export function formatDayHours(day: DayHours): string {
  if (!day) return "휴무";
  const base = `${day.open}~${day.close}`;
  if (day.breakStart && day.breakEnd) {
    return `${base} (브레이크 ${day.breakStart}~${day.breakEnd})`;
  }
  return base;
}
