import { signOut } from "@/lib/next-auth";

export function LogoutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button
        type="submit"
        className="h-[30px] rounded-lg border border-gray-200 bg-white px-[11px] text-xs font-semibold text-gray-600 outline-none transition-colors hover:border-gray-300 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-gray-300"
      >
        로그아웃
      </button>
    </form>
  );
}
