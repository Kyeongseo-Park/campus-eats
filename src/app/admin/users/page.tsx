"use client";

import { useEffect, useState } from "react";

import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { AdminUserItem } from "@/lib/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserItem[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data: { users: AdminUserItem[] }) => setUsers(data.users ?? []))
      .catch((error) => console.error(error));
  }, []);

  return (
    <AdminGuard>
      <AdminShell title="회원 관리">
        {users === null ? (
          <p className="p-10 text-center text-sm text-muted-foreground">불러오는 중...</p>
        ) : users.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">등록된 회원이 없습니다.</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {users.map((user) => (
              <li key={user.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{user.nickname}</p>
                  <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    {user.role === "admin" ? "관리자" : "일반회원"}
                  </Badge>
                  <span>{formatDate(user.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminShell>
    </AdminGuard>
  );
}
