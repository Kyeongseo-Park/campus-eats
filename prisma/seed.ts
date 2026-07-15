import { PrismaClient } from '../src/generated/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const KAKAO_REST_API_KEY = 'aa4fc64f9dc721b724b5674f6cebdd6f'

// CNU Gate Anchors for final Zone partitioning
const ANCHORS = {
  '후문': '전남대학교 스포츠센터',
  '공대쪽문': '전남대학교 공과대학 5호관',
  '예대': '전남대학교 예술대학 3호관',
  '상대': '전남대학교 진리관',
  '정문': '전남대학교 광주캠퍼스 정문'
}

// CNU Campus Center Library for strict 1km radial filter
const LIBRARY_ANCHOR = '전남대학교 도서관 본관'

// Distance computation using Haversine formula
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance in km
}

// Kakao category description mapper
function mapCategory(categoryName: string): string {
  if (categoryName.includes('한식')) return '한식'
  if (categoryName.includes('중식') || categoryName.includes('중화요리')) return '중식'
  if (categoryName.includes('일식') || categoryName.includes('돈까스') || categoryName.includes('초밥')) return '일식'
  if (categoryName.includes('양식') || categoryName.includes('파스타') || categoryName.includes('패밀리레스토랑')) return '양식'
  if (categoryName.includes('분식') || categoryName.includes('떡볶이')) return '분식'
  // Map bakeries and baker shops into Cafe category
  if (categoryName.includes('카페') || categoryName.includes('커피') || categoryName.includes('제과') || categoryName.includes('베이커리')) return '카페'
  if (categoryName.includes('패스트푸드') || categoryName.includes('햄버거') || categoryName.includes('피자')) return '패스트푸드'
  return '기타'
}

// Smart menu generator depending on restaurant name keywords and category
function generateSmartMenus(restaurantName: string, category: string): { name: string; price: number }[] {
  // 1. Cutlet / Japanese Fried Cutlet
  if (restaurantName.includes('돈까스') || restaurantName.includes('돈카츠') || restaurantName.includes('카츠') || restaurantName.includes('가츠')) {
    return [
      { name: '로스(등심) 카츠 정식', price: 9500 },
      { name: '히레(안심) 카츠 정식', price: 10500 },
      { name: '치즈 고구마 카츠', price: 11500 },
      { name: '냉모밀 + 등심카츠 세트', price: 12500 },
      { name: '매콤 카츠 동 (덮밥)', price: 9000 },
      { name: '사이드 미니 우동', price: 3000 },
    ]
  }
  // 2. Korean Soup / Rice Soup
  if (restaurantName.includes('국밥') || restaurantName.includes('해장국') || restaurantName.includes('설렁탕') || restaurantName.includes('곰탕') || restaurantName.includes('찌개')) {
    return [
      { name: '가마솥 돼지국밥', price: 8500 },
      { name: '얼큰 순대국밥', price: 8500 },
      { name: '전통 뼈해장국', price: 9000 },
      { name: '모듬 순대 한접시', price: 7000 },
      { name: '한우 소머리곰탕', price: 11000 },
      { name: '공기밥 추가', price: 1000 },
    ]
  }
  // 3. Roast Meat / Samgyeopsal / BBQ
  if (restaurantName.includes('갈비') || restaurantName.includes('고기') || restaurantName.includes('삼겹살') || restaurantName.includes('구이') || restaurantName.includes('숯불')) {
    return [
      { name: '참숯 삼겹살 (180g)', price: 14000 },
      { name: '양념 돼지갈비 (200g)', price: 15000 },
      { name: '대패 삼겹살 정식 (점심)', price: 9000 },
      { name: '물냉면 / 비빔냉면', price: 6500 },
      { name: '차돌 된장찌개', price: 5000 },
      { name: '계란찜', price: 3000 },
    ]
  }
  // 4. Chicken / Fried Chicken
  if (restaurantName.includes('치킨') || restaurantName.includes('통닭') || restaurantName.includes('강정') || restaurantName.includes('닭')) {
    return [
      { name: '바삭 후라이드 치킨', price: 17000 },
      { name: '달콤 양념 치킨', price: 18000 },
      { name: '갈릭 간장 치킨', price: 18000 },
      { name: '순살 반반 치킨 L', price: 19000 },
      { name: '치즈볼 (5p)', price: 5000 },
      { name: '콜라 1.25L', price: 3000 },
    ]
  }
  // 5. Pizza & Burger / Fastfood
  if (restaurantName.includes('피자') || restaurantName.includes('버거') || restaurantName.includes('맥도날드') || restaurantName.includes('롯데리아') || restaurantName.includes('맘스터치') || restaurantName.includes('리아')) {
    return [
      { name: '시그니처 비프버거 세트', price: 8500 },
      { name: '통가슴살 스파이시 버거 세트', price: 7900 },
      { name: '치즈버거 단품', price: 4900 },
      { name: '페퍼로니 피자 R', price: 14900 },
      { name: '베이컨 포테이토 피자 L', price: 19900 },
      { name: '어니언링 튀김', price: 3500 },
    ]
  }
  // 6. Chinese / Noodles / Dumplings
  if (restaurantName.includes('반점') || restaurantName.includes('중국') || restaurantName.includes('성') || restaurantName.includes('객') || restaurantName.includes('마라')) {
    return [
      { name: '정통 짜장면', price: 6000 },
      { name: '삼선 해물 짬뽕', price: 8000 },
      { name: '게살 볶음밥', price: 7500 },
      { name: '바삭 탕수육 (소)', price: 15000 },
      { name: '군만두 (8p)', price: 5000 },
      { name: '마라탕 (기본)', price: 8000 },
    ]
  }
  // 7. Sushi / Seafood / Raw Fish
  if (restaurantName.includes('스시') || restaurantName.includes('초밥') || restaurantName.includes('회') || restaurantName.includes('바다') || restaurantName.includes('연어')) {
    return [
      { name: '모듬 초밥 (10p)', price: 14000 },
      { name: '특선 초밥 (12p)', price: 18000 },
      { name: '생연어 초밥 (8p)', price: 15000 },
      { name: '회덮밥', price: 9000 },
      { name: '가쓰오 우동', price: 7000 },
      { name: '새우튀김 (4p)', price: 6000 },
    ]
  }

  // Fallbacks by Category
  if (category === '한식') {
    return [
      { name: '어머니 김치찌개 정식', price: 8000 },
      { name: '불맛 제육볶음 백반', price: 9000 },
      { name: '보글보글 된장찌개', price: 7500 },
      { name: '뚝배기 불고기', price: 9500 },
      { name: '비빔밥과 후라이', price: 8000 },
    ]
  }
  if (category === '중식') {
    return [
      { name: '수제 짜장면', price: 6500 },
      { name: '얼큰 해물짬뽕', price: 8000 },
      { name: '정통 짜장밥', price: 7500 },
      { name: '찹쌀 탕수육 (소)', price: 15000 },
      { name: '바삭 군만두', price: 5000 },
    ]
  }
  if (category === '일식') {
    return [
      { name: '모듬 초밥 세트', price: 14000 },
      { name: '바삭 등심 돈카츠', price: 9500 },
      { name: '돈까스 덮밥 (가츠동)', price: 8500 },
      { name: '뜨끈한 튀김우동', price: 7500 },
    ]
  }
  if (category === '양식') {
    return [
      { name: '까르보나라 베이컨 파스타', price: 11500 },
      { name: '매콤 토마토 아라비아따', price: 12000 },
      { name: '치즈 마르게리따 피자', price: 14500 },
      { name: '베이컨 김치 필라프', price: 10500 },
      { name: '그린 가든 샐러드', price: 7500 },
    ]
  }
  if (category === '분식') {
    return [
      { name: '매콤 쌀 떡볶이', price: 4500 },
      { name: '바삭 모듬 튀김', price: 5000 },
      { name: '참치 마요 뚱김밥', price: 4000 },
      { name: '야채 김밥', price: 3000 },
      { name: '쫄깃한 찰순대', price: 4500 },
      { name: '양은 냄비라면', price: 4000 },
    ]
  }
  if (category === '카페') {
    return [
      { name: '시그니처 아메리카노', price: 3500 },
      { name: '카페 라떼', price: 4200 },
      { name: '바닐라 빈 라떼', price: 4800 },
      { name: '청귤 에이드', price: 5000 },
      { name: '부드러운 티라미수 케이크', price: 5800 },
      { name: '초코칩 아메리칸 쿠키', price: 2500 },
    ]
  }
  if (category === '패스트푸드') {
    return [
      { name: '더블 빅치즈버거 세트', price: 8500 },
      { name: '핫스파이시 치킨버거 세트', price: 7900 },
      { name: '포테이토 후라이 M', price: 2500 },
      { name: '치즈 가득 롱스틱', price: 3000 },
    ]
  }

  return [
    { name: '셰프 추천 스페셜 요리', price: 12000 },
    { name: '데일리 특제 파스타', price: 10500 },
    { name: '오늘의 수제 음료', price: 4500 },
  ]
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function getCoordinates(keyword: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(keyword)}`
    await sleep(100) // Delay to prevent Rate-Limiting
    const response = await fetch(url, {
      headers: {
        'Authorization': `KakaoAK ${KAKAO_REST_API_KEY}`,
        'KA': 'sdk/1.0.0 os/javascript lang/ko device/web origin/http://localhost:3000'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Kakao API request failed for: ${keyword} (Status: ${response.status}, Details: ${errorText})`)
      return null
    }

    const data = await response.json()
    if (!data.documents || data.documents.length === 0) {
      console.error(`No search result found on Kakao for: ${keyword}`)
      return null
    }

    // Get coordinates
    const doc = data.documents[0]
    return {
      lat: parseFloat(doc.y),
      lng: parseFloat(doc.x)
    }
  } catch (err: any) {
    console.error(`❌ getCoordinates network error for keyword [${keyword}]:`, err.message || err)
    return null
  }
}

async function searchCategory(lat: number, lng: number, code: string, radius: number = 1000): Promise<any[]> {
  let allDocs: any[] = []

  // Loop pages to collect enough records
  for (let page = 1; page <= 3; page++) {
    try {
      const url = `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=${code}&x=${lng}&y=${lat}&radius=${radius}&page=${page}`
      await sleep(100) // Rate-Limiting protection delay
      const response = await fetch(url, {
        headers: {
          'Authorization': `KakaoAK ${KAKAO_REST_API_KEY}`,
          'KA': 'sdk/1.0.0 os/javascript lang/ko device/web origin/http://localhost:3000'
        }
      })

      if (!response.ok) break
      const data = await response.json()
      if (!data.documents || data.documents.length === 0) break
      allDocs = allDocs.concat(data.documents)
    } catch (err: any) {
      console.warn(`⚠️ searchCategory warning on page ${page} near ${lat},${lng}:`, err.message || err)
      break // Skip mapping to allow partial seeding
    }
  }

  return allDocs
}

async function main() {
  console.log('🔄 Purging old database tables...')
  // Delete cascading records first due to foreign key constraints
  await prisma.favorite.deleteMany()
  await prisma.review.deleteMany()
  await prisma.menu.deleteMany()
  await prisma.restaurantRequest.deleteMany()
  await prisma.restaurant.deleteMany()
  await prisma.user.deleteMany()
  console.log('🗑️ DB purge complete.')

  console.log('\n🔄 Creating development users (Admin and Students)...')
  const passwordHash = await bcrypt.hash('test1234', 10)
  const adminHash = await bcrypt.hash('admin1234', 10)

  await prisma.user.create({
    data: { email: 'student@example.com', passwordHash, nickname: '학생1', role: 'user' },
  })
  await prisma.user.create({
    data: { email: 'student2@example.com', passwordHash, nickname: '밥친구', role: 'user' },
  })
  await prisma.user.create({
    data: { email: 'admin@example.com', passwordHash: adminHash, nickname: '관리자', role: 'admin' },
  })
  console.log('👤 Development users created.')

  console.log('\n🔄 Fetching coordinates of CNU Campus Library (Campus Center)...')
  const libraryCenter = await getCoordinates(LIBRARY_ANCHOR)
  if (!libraryCenter) {
    console.error('❌ Failed to resolve CNU Library Center coordinate. Seeding aborted.')
    return
  }
  console.log(`📍 Library Center: ${libraryCenter.lat}, ${libraryCenter.lng}`)

  console.log('\n🔄 Fetching coordinates of CNU Campus Gate Anchors...')
  const anchorCoordinates: Record<string, { lat: number; lng: number }> = {}

  for (const [zoneName, keyword] of Object.entries(ANCHORS)) {
    const coords = await getCoordinates(keyword)
    if (coords) {
      anchorCoordinates[zoneName] = coords
      console.log(`📍 Gate Anchor [${zoneName}]: ${coords.lat}, ${coords.lng} (${keyword})`)
    }
  }

  console.log('\n🔄 Gathering restaurant and cafe entries near Library Center from Kakao API...')
  const uniqueRestaurants = new Map<string, any>()
  const categories = ['FD6', 'CE7']

  // Scan surrounding using libraryCenter as the main core to cover campus bounds
  for (const catCode of categories) {
    const docs = await searchCategory(libraryCenter.lat, libraryCenter.lng, catCode, 1200)
    console.log(`- Retrieved ${docs.length} spots in category [${catCode}] near Library`)

    for (const doc of docs) {
      const categoryStr = doc.category_name || ''
      const nameStr = doc.place_name || ''

      // Filter out bars, beer houses, pubs, and izakayas
      const isAlcoholSpot = categoryStr.includes('술집') || categoryStr.includes('호프') || 
                            categoryStr.includes('주점') || categoryStr.includes('포장마차') || 
                            categoryStr.includes('이자카야') || categoryStr.includes('바(bar)') ||
                            nameStr.includes('포차') || nameStr.includes('맥주') || nameStr.includes('호프')

      if (isAlcoholSpot) continue

      const key = doc.id || doc.road_address_name || doc.place_name
      if (!uniqueRestaurants.has(key)) {
        uniqueRestaurants.set(key, doc)
      }
    }
  }

  // Also query gate anchors to capture all edge dining blocks
  for (const [zoneName, center] of Object.entries(anchorCoordinates)) {
    for (const catCode of categories) {
      const docs = await searchCategory(center.lat, center.lng, catCode, 500)
      for (const doc of docs) {
        const categoryStr = doc.category_name || ''
        const nameStr = doc.place_name || ''

        // Alcohol exclusion check
        const isAlcoholSpot = categoryStr.includes('술집') || categoryStr.includes('호프') || 
                              categoryStr.includes('주점') || categoryStr.includes('포장마차') || 
                              categoryStr.includes('이자카야') || categoryStr.includes('바(bar)') ||
                              nameStr.includes('포차') || nameStr.includes('맥주') || nameStr.includes('호프')

        if (isAlcoholSpot) continue

        const key = doc.id || doc.road_address_name || doc.place_name
        if (!uniqueRestaurants.has(key)) {
          uniqueRestaurants.set(key, doc)
        }
      }
    }
  }

  console.log(`\n✅ Raw unique collection complete: ${uniqueRestaurants.size} places found around campus bounds.`)

  console.log('\n🔄 Enforcing strict 1.0 km radius limit from Library Center and mapping zones...')
  const mappedRestaurants: any[] = []

  for (const doc of uniqueRestaurants.values()) {
    const docLat = parseFloat(doc.y)
    const docLng = parseFloat(doc.x)

    // Calculate distance to Library Center
    const distanceToLibrary = getDistance(docLat, docLng, libraryCenter.lat, libraryCenter.lng)

    // Accept only within 1.0 km of Library Center (approx. 15min walk from heart of campus)
    if (distanceToLibrary <= 1.0) {
      let closestZone = ''
      let minDistanceToGate = Infinity

      // Map to the closest CNU gate zone
      for (const [zoneName, center] of Object.entries(anchorCoordinates)) {
        const dist = getDistance(docLat, docLng, center.lat, center.lng)
        if (dist < minDistanceToGate) {
          minDistanceToGate = dist
          closestZone = zoneName
        }
      }

      mappedRestaurants.push({
        id: doc.id,
        name: doc.place_name,
        category: mapCategory(doc.category_name),
        zone: closestZone || '정문', // Fallback to 정문
        address: doc.road_address_name || doc.address_name,
        latitude: docLat,
        longitude: docLng,
      })
    }
  }

  console.log(`✅ Filtered: Assigned ${mappedRestaurants.length} clean spots inside CNU Library 1.0 km radius bounds.`)

  console.log('\n🔄 Seeding CNU restaurant data and Smart-Generated Menus into DB...')
  let seedCount = 0

  for (const spot of mappedRestaurants) {
    // Generate smart menu details based on name keywords and category type
    const menus = generateSmartMenus(spot.name, spot.category)
    const minPrice = Math.min(...menus.map(m => m.price).filter(p => p > 0)) || 0

    await prisma.restaurant.create({
      data: {
        name: spot.name,
        category: spot.category,
        zone: spot.zone,
        address: spot.address,
        latitude: spot.latitude,
        longitude: spot.longitude,
        minPrice: minPrice > 0 ? minPrice : 5000,
        menus: {
          create: menus
        }
      }
    })
    seedCount++
    if (seedCount % 50 === 0) {
      console.log(`- Seeding Progress: ${seedCount}/${mappedRestaurants.length} restaurants...`)
    }
  }

  console.log(`\n🎉 CNU Seeding successfully completed! Inserted ${seedCount} clean restaurants and smart menus into sqlite DB.`)
}

main()
  .catch(e => {
    console.error('❌ Seeding crawler error:', e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
