import { AlertTriangle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// 요청은 갔지만 정상적으로 끝나지 않은 "실패" 상태. destructive(붉은) 톤으로 안내(EmptyState)와 구분한다.
// 화면 전체를 대체하는 에러/404/403 화면에 사용. 폼 안의 인라인 오류 문구는 <InlineError>를 쓴다.
export function ErrorState({
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
      <Icon className="size-10 text-destructive" strokeWidth={1.5} aria-hidden />
      <p className="text-sm font-semibold text-destructive">{title}</p>
      {description && <p className="max-w-xs text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// 폼/업로드 영역 안에 인라인으로 끼워 넣는 짧은 오류 문구 (경고 아이콘 + 텍스트).
export function InlineError({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-start gap-1.5 text-xs text-destructive", className)}>
      <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
