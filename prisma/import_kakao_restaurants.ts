import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const KAKAO_REST_API_KEY = 'bda37ace29bd09788dc540872712446e'

const ANCHORS = {
  '후문': '전남대학교 스포츠센터',
  '공대쪽문': '전남대학교 공과대학 5호관',
  '예대': '전남대학교 예술대학 3호관',
  '상대': '전남대학교 진리관',
  '정문': '전남대학교 광주캠퍼스 정문'
}

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
  if (categoryName.includes('카페') || categoryName.includes('커피')) return '카페'
  if (categoryName.includes('패스트푸드') || categoryName.includes('햄버거') || categoryName.includes('피자')) return '패스트푸드'
  return '기타'
}

// Smart menu generator depending on category
function generateMenus(category: string): { name: string; price: number }[] {
  switch (category) {
    case '한식':
      return [
        { name: '김치찌개 정식', price: 8000 },
        { name: '제육볶음 백반', price: 9000 },
        { name: '된장찌개', price: 7500 },
      ]
    case '중식':
      return [
        { name: '짜장면', price: 6500 },
        { name: '짬뽕', price: 7500 },
        { name: '탕수육 (소)', price: 15000 },
      ]
    case '일식':
      return [
        { name: '모듬 초밥 (10p)', price: 14000 },
        { name: '등심 돈카츠', price: 9500 },
        { name: '규동 (소고기 덮밥)', price: 9000 },
      ]
    case '양식':
      return [
        { name: '토마토 파스타', price: 11000 },
        { name: '고르곤졸라 피자', price: 14000 },
        { name: '쉬림프 리조또', price: 12500 },
      ]
    case '분식':
      return [
        { name: '매콤 떡볶이', price: 4500 },
        { name: '모듬 튀김', price: 5000 },
        { name: '참치 마요 김밥', price: 4000 },
      ]
    case '카페':
      return [
        { name: '아메리카노', price: 3500 },
        { name: '카페라떼', price: 4200 },
        { name: '수제 치즈케이크', price: 5500 },
      ]
    case '패스트푸드':
      return [
        { name: '치즈버거 세트', price: 7200 },
        { name: '베이컨 토마토 디럭스', price: 8200 },
        { name: '감자튀김 L', price: 3000 },
      ]
    default:
      return [
        { name: '시그니처 메뉴', price: 9500 },
        { name: '오늘의 요리', price: 11000 },
        { name: '수제 음료', price: 4500 },
      ]
  }
}

async function getCoordinates(keyword: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(keyword)}`
  const response = await fetch(url, {
    headers: {
      'Authorization': `KakaoAK ${KAKAO_REST_API_KEY}`
    }
  })

  if (!response.ok) {
    console.error(`Kakao API request failed for: ${keyword}`)
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
}

async function searchCategory(lat: number, lng: number, code: string, radius: number = 1000): Promise<any[]> {
  let allDocs: any[] = []

  // Loop pages to collect enough records
  for (let page = 1; page <= 3; page++) {
    const url = `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=${code}&x=${lng}&y=${lat}&radius=${radius}&page=${page}`
    const response = await fetch(url, {
      headers: {
        'Authorization': `KakaoAK ${KAKAO_REST_API_KEY}`
      }
    })

    if (!response.ok) break
    const data = await response.json()
    if (!data.documents || data.documents.length === 0) break
    allDocs = allDocs.concat(data.documents)
  }

  return allDocs
}

async function main() {
  console.log('🔄 Fetching coordinates of CNU Campus Anchors...')
  const anchorCoordinates: Record<string, { lat: number; lng: number }> = {}

  for (const [zoneName, keyword] of Object.entries(ANCHORS)) {
    const coords = await getCoordinates(keyword)
    if (coords) {
      anchorCoordinates[zoneName] = coords
      console.log(`📍 Anchor [${zoneName}]: ${coords.lat}, ${coords.lng} (${keyword})`)
    }
  }

  const resolvedZones = Object.keys(anchorCoordinates)
  if (resolvedZones.length === 0) {
    console.error('❌ Failed to resolve any CNU anchor coordinate. Seeding aborted.')
    return
  }

  console.log('\n🔄 Gathering restaurant and cafe entries around anchors from Kakao API...')
  const uniqueRestaurants = new Map<string, any>()

  // FD6: Food / CE7: Cafe
  const categories = ['FD6', 'CE7']

  for (const [zoneName, center] of Object.entries(anchorCoordinates)) {
    for (const catCode of categories) {
      const docs = await searchCategory(center.lat, center.lng, catCode)
      console.log(`- Retrieved ${docs.length} spots in category [${catCode}] near anchor [${zoneName}]`)

      for (const doc of docs) {
        // Unique key mapping by place id or exact road address
        const key = doc.id || doc.road_address_name || doc.place_name
        if (!uniqueRestaurants.has(key)) {
          uniqueRestaurants.set(key, doc)
        }
      }
    }
  }

  console.log(`\n✅ Raw collection complete: Total ${uniqueRestaurants.size} unique places found near CNU.`)

  console.log('\n🔄 Grouping and mapping zones by closest anchor metric...')
  const mappedRestaurants: any[] = []

  for (const doc of uniqueRestaurants.values()) {
    const docLat = parseFloat(doc.y)
    const docLng = parseFloat(doc.x)

    let closestZone = ''
    let minDistance = Infinity

    for (const [zoneName, center] of Object.entries(anchorCoordinates)) {
      const distance = getDistance(docLat, docLng, center.lat, center.lng)
      if (distance < minDistance) {
        minDistance = distance
        closestZone = zoneName
      }
    }

    // Double check if it is within 1km (approximately 1.0 km) of closest anchor
    if (minDistance <= 1.0) {
      mappedRestaurants.push({
        name: doc.place_name,
        category: mapCategory(doc.category_name),
        zone: closestZone,
        address: doc.road_address_name || doc.address_name,
        latitude: docLat,
        longitude: docLng,
      })
    }
  }

  console.log(`✅ Filtered and assigned ${mappedRestaurants.length} spots within 1km radius limit.`)

  console.log('\n🔄 Purging old mockup DB tables...')
  // Delete cascading records first due to foreign key constraints
  await prisma.review.deleteMany()
  await prisma.favorite.deleteMany()
  await prisma.menu.deleteMany()
  await prisma.restaurant.deleteMany()
  await prisma.restaurantRequest.deleteMany()
  console.log('🗑️ DB purge complete.')

  console.log('\n🔄 Seeding CNU restaurant data and menus into DB...')
  let seedCount = 0

  for (const spot of mappedRestaurants) {
    const menus = generateMenus(spot.category)
    const minPrice = Math.min(...menus.map(m => m.price))

    const created = await prisma.restaurant.create({
      data: {
        name: spot.name,
        category: spot.category,
        zone: spot.zone,
        address: spot.address,
        latitude: spot.latitude,
        longitude: spot.longitude,
        minPrice: minPrice,
        avgRating: 0.0,
        menus: {
          create: menus
        }
      }
    })
    seedCount++
  }

  console.log(`\n🎉 CNU Seeding successfully completed! Inserted ${seedCount} restaurants and their menu items into sqlite DB.`)
}

main()
  .catch(e => {
    console.error('❌ Seeding crawler error:', e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
