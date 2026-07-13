import { z } from "zod";

import { CATEGORIES, ZONES } from "@/lib/constants";

export const restaurantInputSchema = z.object({
  name: z.string().trim().min(1, "식당명을 입력해주세요."),
  category: z.enum(CATEGORIES, { message: "카테고리를 선택해주세요." }),
  zone: z.enum(ZONES, { message: "구역을 선택해주세요." }),
  address: z.string().trim().min(1, "주소를 입력해주세요."),
  latitude: z.number({ message: "위도를 입력해주세요." }),
  longitude: z.number({ message: "경도를 입력해주세요." }),
  minPrice: z.number().int().nonnegative().nullable().optional(),
  phone: z.string().trim().nullable().optional(),
  kakaoPlaceId: z.string().trim().nullable().optional(),
});
