import { PrismaClient } from '../src/generated/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.favorite.deleteMany()
  await prisma.review.deleteMany()
  await prisma.menu.deleteMany()
  await prisma.restaurantRequest.deleteMany()
  await prisma.restaurant.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  const passwordHash = await bcrypt.hash('test1234', 10)
  const adminHash = await bcrypt.hash('admin1234', 10)

  const user1 = await prisma.user.create({
    data: { email: 'student@example.com', passwordHash, nickname: '학생1', role: 'user' },
  })
  const user2 = await prisma.user.create({
    data: { email: 'student2@example.com', passwordHash, nickname: '밥친구', role: 'user' },
  })
  const admin = await prisma.user.create({
    data: { email: 'admin@example.com', passwordHash: adminHash, nickname: '관리자', role: 'admin' },
  })

  // Create restaurants with menus
  const restaurants = [
    {
      name: '김밥천국 정문점',
      category: '분식',
      zone: '정문',
      address: '대학로 12-3',
      latitude: 35.8895,
      longitude: 128.6115,
      minPrice: 3500,
      partnershipStartDate: new Date('2026-07-01'),
      partnershipEndDate: new Date('2026-08-31'),
      partnershipInfo: '학생증 제시 시 김밥류 500원 할인',
      menus: [
        { name: '참치김밥', price: 4500 },
        { name: '라볶이', price: 5500 },
        { name: '떡볶이', price: 3500 },
        { name: '순대', price: 4000 },
      ],
    },
    {
      name: '맛있는 중화반점',
      category: '중식',
      zone: '정문',
      address: '대학로 15-7',
      latitude: 35.8900,
      longitude: 128.6120,
      minPrice: 7000,
      menus: [
        { name: '짜장면', price: 7000 },
        { name: '짬뽕', price: 8000 },
        { name: '탕수육(소)', price: 15000 },
        { name: '볶음밥', price: 8000 },
      ],
    },
    {
      name: '스시오마카세 예대점',
      category: '일식',
      zone: '예대',
      address: '예술관길 5',
      latitude: 35.8870,
      longitude: 128.6090,
      minPrice: 12000,
      partnershipStartDate: new Date('2026-07-10'),
      partnershipEndDate: new Date('2026-07-31'),
      partnershipInfo: '총학생회 제휴 - 런치 코스 20% 할인',
      menus: [
        { name: '런치 초밥세트', price: 12000 },
        { name: '사시미 정식', price: 18000 },
        { name: '우동', price: 9000 },
      ],
    },
    {
      name: '후문 파스타집',
      category: '양식',
      zone: '후문',
      address: '후문로 22',
      latitude: 35.8860,
      longitude: 128.6140,
      minPrice: 9000,
      menus: [
        { name: '토마토 파스타', price: 9000 },
        { name: '크림 파스타', price: 10000 },
        { name: '스테이크', price: 22000 },
        { name: '리조또', price: 11000 },
      ],
    },
    {
      name: '엄마손 한식당',
      category: '한식',
      zone: '상대',
      address: '상대로 8-2',
      latitude: 35.8910,
      longitude: 128.6100,
      minPrice: 6000,
      partnershipStartDate: new Date('2026-06-01'),
      partnershipEndDate: new Date('2026-12-31'),
      partnershipInfo: '학생증 제시 시 국밥류 1000원 할인',
      menus: [
        { name: '된장찌개', price: 7000 },
        { name: '김치찌개', price: 7000 },
        { name: '제육볶음', price: 8000 },
        { name: '순두부찌개', price: 6000 },
      ],
    },
    {
      name: '공대 커피하우스',
      category: '카페',
      zone: '공대쪽문',
      address: '공학로 3',
      latitude: 35.8880,
      longitude: 128.6150,
      minPrice: 2500,
      menus: [
        { name: '아메리카노', price: 2500 },
        { name: '카페라떼', price: 3500 },
        { name: '바닐라라떼', price: 4000 },
        { name: '딸기스무디', price: 5000 },
      ],
    },
    {
      name: '정문 돈까스',
      category: '일식',
      zone: '정문',
      address: '대학로 18',
      latitude: 35.8898,
      longitude: 128.6118,
      minPrice: 8000,
      menus: [
        { name: '등심돈까스', price: 8000 },
        { name: '치즈돈까스', price: 9500 },
        { name: '생선까스', price: 8500 },
      ],
    },
    {
      name: '상대 국밥집',
      category: '한식',
      zone: '상대',
      address: '상대로 15',
      latitude: 35.8915,
      longitude: 128.6105,
      minPrice: 7000,
      menus: [
        { name: '돼지국밥', price: 7000 },
        { name: '순대국밥', price: 8000 },
        { name: '수육', price: 25000 },
      ],
    },
    {
      name: '예대 카페 봄날',
      category: '카페',
      zone: '예대',
      address: '예술관길 12',
      latitude: 35.8868,
      longitude: 128.6085,
      minPrice: 3000,
      partnershipStartDate: new Date('2026-07-01'),
      partnershipEndDate: new Date('2026-07-20'),
      partnershipInfo: '예대 학생회 제휴 - 음료 전메뉴 500원 할인',
      menus: [
        { name: '핸드드립', price: 4500 },
        { name: '아이스티', price: 3000 },
        { name: '케이크 세트', price: 8000 },
      ],
    },
    {
      name: '후문 치킨&피자',
      category: '양식',
      zone: '후문',
      address: '후문로 30',
      latitude: 35.8855,
      longitude: 128.6145,
      minPrice: 9000,
      menus: [
        { name: '후라이드치킨', price: 18000 },
        { name: '양념치킨', price: 19000 },
        { name: '페퍼로니피자', price: 15000 },
        { name: '치킨텐더', price: 9000 },
      ],
    },
  ]

  for (const r of restaurants) {
    const { menus, ...restaurantData } = r
    const restaurant = await prisma.restaurant.create({
      data: restaurantData,
    })
    for (const m of menus) {
      await prisma.menu.create({
        data: { ...m, restaurantId: restaurant.id },
      })
    }
  }

  // Get created restaurants for reviews
  const allRestaurants = await prisma.restaurant.findMany()

  // Create some reviews
  const reviewData = [
    { userId: user1.id, restaurantId: allRestaurants[0].id, rating: 4, content: '가성비 최고! 학교 앞에서 이 가격이면 훌륭합니다.' },
    { userId: user2.id, restaurantId: allRestaurants[0].id, rating: 5, content: '떡볶이가 맛있어요. 점심시간에 빨리 먹기 좋아요.' },
    { userId: user1.id, restaurantId: allRestaurants[1].id, rating: 3, content: '짜장면 양이 좀 적은 편이에요. 맛은 괜찮습니다.' },
    { userId: user2.id, restaurantId: allRestaurants[2].id, rating: 5, content: '런치 세트가 정말 좋아요! 제휴 할인까지 받으면 가성비 최고.' },
    { userId: user1.id, restaurantId: allRestaurants[3].id, rating: 4, content: '크림 파스타 추천합니다. 분위기도 좋아요.' },
    { userId: user2.id, restaurantId: allRestaurants[4].id, rating: 5, content: '된장찌개가 진짜 엄마 맛이에요. 밥 리필도 됩니다.' },
    { userId: user1.id, restaurantId: allRestaurants[4].id, rating: 4, content: '제육볶음도 맛있어요. 학생 할인도 해줘서 자주 가요.' },
    { userId: user2.id, restaurantId: allRestaurants[5].id, rating: 4, content: '조용하고 커피 맛도 좋아요. 과제하기 딱입니다.' },
    { userId: user1.id, restaurantId: allRestaurants[7].id, rating: 5, content: '국밥 국물이 진하고 맛있습니다. 해장으로 최고!' },
    { userId: user2.id, restaurantId: allRestaurants[8].id, rating: 4, content: '분위기 좋고 케이크가 맛있어요.' },
  ]

  for (const review of reviewData) {
    await prisma.review.create({ data: review })
  }

  // Create a restaurant request
  await prisma.restaurantRequest.create({
    data: {
      userId: user1.id,
      restaurantName: '새로운 맛집',
      address: '정문로 45',
      category: '한식',
      menuInfo: '부대찌개 8000원, 김치볶음밥 7000원',
      status: '대기',
    },
  })

  // Create favorites
  await prisma.favorite.create({
    data: { userId: user1.id, restaurantId: allRestaurants[0].id },
  })
  await prisma.favorite.create({
    data: { userId: user1.id, restaurantId: allRestaurants[4].id },
  })

  console.log('✅ Seed data created successfully!')
  console.log(`  - Users: 3 (student@example.com / student2@example.com / admin@example.com)`)
  console.log(`  - Restaurants: ${allRestaurants.length}`)
  console.log(`  - Reviews: ${reviewData.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
