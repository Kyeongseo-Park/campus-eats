import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/next-auth";

export function LogoutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <Button type="submit" variant="ghost" size="sm">
        로그아웃
      </Button>
    </form>
  );
}
