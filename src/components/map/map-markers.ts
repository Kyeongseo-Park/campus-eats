function svgDataUri(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// 📍 필터링된 식당 마커 (기본)
export const RESTAURANT_MARKER = {
  src: svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 26 34"><path d="M13 0C5.82 0 0 5.82 0 13c0 8.94 13 21 13 21s13-12.06 13-21C26 5.82 20.18 0 13 0z" fill="#EF4444"/><circle cx="13" cy="13" r="5" fill="white"/></svg>`,
  ),
  width: 26,
  height: 34,
};

// 🔴 선택된 식당 마커
export const RESTAURANT_MARKER_SELECTED = {
  src: svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 26 34"><path d="M13 0C5.82 0 0 5.82 0 13c0 8.94 13 21 13 21s13-12.06 13-21C26 5.82 20.18 0 13 0z" fill="#B91C1C"/><circle cx="13" cy="13" r="6" fill="white"/></svg>`,
  ),
  width: 32,
  height: 42,
};

// 🔵 내 위치 마커
export const USER_LOCATION_MARKER = {
  src: svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="10" fill="#3B82F6" fill-opacity="0.25"/><circle cx="11" cy="11" r="6" fill="#2563EB" stroke="white" stroke-width="2.5"/></svg>`,
  ),
  width: 22,
  height: 22,
};
