import type { RestaurantDetail } from "@/lib/types";

export function MenuTab({ menus }: { menus: RestaurantDetail["menus"] }) {
  if (menus.length === 0) {
    return (
      <p className="p-10 text-center text-sm text-muted-foreground">
        등록된 메뉴가 없습니다.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-sm font-semibold">■ 대표 메뉴 및 가격</p>
      <ul className="flex flex-col divide-y">
        {menus.map((menu) => (
          <li key={menu.id} className="flex items-center justify-between py-2.5 text-sm">
            <span>{menu.name}</span>
            <span className="text-muted-foreground">{menu.price.toLocaleString()}원</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
