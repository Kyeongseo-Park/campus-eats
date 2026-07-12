import Link from "next/link";

import { Button } from "@/components/ui/button";

export function AdminPager({
  page,
  totalPages,
  total,
  buildHref,
}: {
  page: number;
  totalPages: number;
  total: number;
  buildHref: (page: number) => string;
}) {
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        총 {total}개 · {page} / {totalPages} 페이지
      </span>
      <div className="flex gap-2">
        {page <= 1 ? (
          <Button size="sm" variant="outline" disabled>
            이전
          </Button>
        ) : (
          <Button nativeButton={false} render={<Link href={buildHref(page - 1)} />} size="sm" variant="outline">
            이전
          </Button>
        )}
        {page >= totalPages ? (
          <Button size="sm" variant="outline" disabled>
            다음
          </Button>
        ) : (
          <Button nativeButton={false} render={<Link href={buildHref(page + 1)} />} size="sm" variant="outline">
            다음
          </Button>
        )}
      </div>
    </div>
  );
}
