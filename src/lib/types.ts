// GET /api/restaurants 응답의 식당 항목 (src/app/api/restaurants/route.ts 참고).
export interface RestaurantListItem {
  id: string;
  name: string;
  category: string;
  zone: string;
  address: string;
  latitude: number;
  longitude: number;
  minPrice: number | null;
  avgRating: number;
  distanceKm: number;
}

// GET /api/restaurants/[id] 응답 (src/app/api/restaurants/[id]/route.ts 참고).
export interface RestaurantDetail {
  id: string;
  name: string;
  category: string;
  zone: string;
  address: string;
  latitude: number;
  longitude: number;
  minPrice: number | null;
  menus: { id: string; name: string; price: number }[];
}

// GET /api/restaurants/[id]/reviews 응답 항목.
export interface ReviewWithAuthor {
  id: string;
  rating: number;
  content: string;
  createdAt: string;
  user: { nickname: string };
}

// GET /api/auth/me, POST /api/auth/login, POST /api/auth/signup 응답의 사용자 정보 (비밀번호 해시 제외).
export interface SafeUser {
  id: string;
  email: string;
  nickname: string;
  role: string;
}

// GET /api/restaurant-requests (내 제보 목록) 응답 항목.
export interface RestaurantRequestItem {
  id: string;
  restaurantName: string;
  address: string;
  category: string;
  menuInfo: string | null;
  status: string;
  createdAt: string;
}

// GET /api/reviews (내 리뷰 목록) 응답 항목.
export interface MyReviewItem {
  id: string;
  rating: number;
  content: string;
  createdAt: string;
  restaurant: { id: string; name: string };
}

// GET /api/admin/users 응답 항목.
export interface AdminUserItem {
  id: string;
  email: string;
  nickname: string;
  role: string;
  createdAt: string;
}

// GET /api/admin/reviews 응답 항목.
export interface AdminReviewItem {
  id: string;
  rating: number;
  content: string;
  createdAt: string;
  user: { id: string; nickname: string; email: string };
  restaurant: { id: string; name: string };
}

// GET /api/admin/restaurants 응답 항목 및 POST/PUT 요청 바디 (menus 제외).
export interface AdminRestaurantItem {
  id: string;
  name: string;
  category: string;
  zone: string;
  address: string;
  latitude: number;
  longitude: number;
  minPrice: number | null;
}

// GET /api/admin/requests 응답 항목 (전체 사용자의 제보, 모든 상태 포함).
export interface AdminRequestItem {
  id: string;
  restaurantName: string;
  address: string;
  category: string;
  menuInfo: string | null;
  status: string;
  createdAt: string;
  user: { id: string; nickname: string; email: string };
}
