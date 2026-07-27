import { Badge } from "@/components/ui/badge";
import type { OpenStatus } from "@/lib/business-hours";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<Exclude<OpenStatus, "unknown">, string> = {
  open: "영업중",
  break: "브레이크타임",
  closed: "영업종료",
};

const STATUS_CLASS: Record<Exclude<OpenStatus, "unknown">, string> = {
  open: "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  break: "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  closed: "border-transparent bg-muted text-muted-foreground",
};

// 영업시간 데이터가 없는 식당("unknown")은 아무 것도 표시하지 않는다 — 잘못된 정보를
// 보여주는 것보다 표시하지 않는 편이 낫다.
export function OpenStatusBadge({ status, className }: { status: OpenStatus; className?: string }) {
  if (status === "unknown") return null;

  return (
    <Badge variant="outline" className={cn(STATUS_CLASS[status], className)}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
