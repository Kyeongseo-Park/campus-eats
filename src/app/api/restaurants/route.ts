import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const zone = searchParams.get('zone')
    const category = searchParams.get('category')
    const priceRange = searchParams.get('price_range')
    const partnershipOnly = searchParams.get('partnership_only') === 'true'
    const sort = searchParams.get('sort') || '평점순'
    const search = searchParams.get('search')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')

    // Build where clause
    const where: any = {}
    if (zone && zone !== '전체') where.zone = zone
    if (category && category !== '전체') where.category = category

    if (priceRange && priceRange !== '전체') {
      switch (priceRange) {
        case '~5000': where.minPrice = { lte: 5000 }; break
        case '~10000': where.minPrice = { gt: 5000, lte: 10000 }; break
        case '~20000': where.minPrice = { gt: 10000, lte: 20000 }; break
        case '20000~': where.minPrice = { gt: 20000 }; break
      }
    }

    if (partnershipOnly) {
      const today = new Date()
      where.partnershipStartDate = { lte: today }
      where.partnershipEndDate = { gte: today }
    }

    if (search) {
      // Search restaurant name or menu name
      where.OR = [
        { name: { contains: search } },
        { menus: { some: { name: { contains: search } } } },
      ]
    }

    const restaurants = await db.restaurant.findMany({
      where,
      include: {
        menus: true,
        reviews: { select: { rating: true } },
        _count: { select: { reviews: true } },
      },
    })

    // Calculate avg rating and add to each restaurant
    let result = restaurants.map((r) => {
      const avgRating = r.reviews.length > 0
        ? r.reviews.reduce((sum, rev) => sum + rev.rating, 0) / r.reviews.length
        : 0
      const today = new Date()
      const hasPartnership = r.partnershipStartDate && r.partnershipEndDate
        ? r.partnershipStartDate <= today && r.partnershipEndDate >= today
        : false
      return {
        id: r.id,
        name: r.name,
        category: r.category,
        zone: r.zone,
        address: r.address,
        latitude: r.latitude,
        longitude: r.longitude,
        minPrice: r.minPrice,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: r._count.reviews,
        hasPartnership,
        partnershipInfo: hasPartnership ? r.partnershipInfo : null,
      }
    })

    // Sort
    if (sort === '평점순') {
      result.sort((a, b) => b.avgRating - a.avgRating)
    } else if (sort === '가격순') {
      result.sort((a, b) => a.minPrice - b.minPrice)
    } else if (sort === '거리순' && lat && lng) {
      const userLat = parseFloat(lat)
      const userLng = parseFloat(lng)
      result.sort((a, b) => {
        const distA = haversine(userLat, userLng, a.latitude, a.longitude)
        const distB = haversine(userLat, userLng, b.latitude, b.longitude)
        return distA - distB
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
