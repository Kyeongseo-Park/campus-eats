import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// 데이터는 정상적으로 로드됐지만 항목이 0개인 "안내" 상태. 오렌지(--primary) 톤 힌트.
// 실패/에러 상태는 색으로 구분하기 위해 error-state.tsx의 <ErrorState>를 쓴다.
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-1.5 px-6 py-10 text-center", className)}>
      <Icon className="size-10 text-primary/40" strokeWidth={1.5} aria-hidden />
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="max-w-xs text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
