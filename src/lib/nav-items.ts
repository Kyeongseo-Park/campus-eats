import { Heart, Home, Search, User } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "홈", icon: Home },
  { href: "/restaurants", label: "검색", icon: Search },
  { href: "/favorites", label: "찜", icon: Heart },
  { href: "/mypage", label: "마이", icon: User },
] as const;

export function isNavItemActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const STANDALONE_PREFIXES = ["/login", "/signup", "/admin"];
const STANDALONE_PATTERNS = [
  /^\/restaurant-requests\/new$/,
  /^\/restaurants\/[^/]+\/reviews\/new$/,
  /^\/reviews\/[^/]+\/edit$/,
  /^\/mypage\/reviews$/,
];

/** Form/flow and admin screens render without the tab bar / top nav shell. */
export function isStandaloneRoute(pathname: string) {
  return (
    STANDALONE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    ) || STANDALONE_PATTERNS.some((pattern) => pattern.test(pathname))
  );
}
