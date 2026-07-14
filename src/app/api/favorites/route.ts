import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import db from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }
    const favorites = await db.favorite.findMany({
      where: { userId: session.user.id },
      include: {
        restaurant: {
          include: {
            reviews: { select: { rating: true } },
            _count: { select: { reviews: true } },
          },
        },
      },
    })
    const result = favorites.map((f) => {
      const r = f.restaurant
      const avgRating = r.reviews.length > 0
        ? r.reviews.reduce((sum, rev) => sum + rev.rating, 0) / r.reviews.length
        : 0
      const today = new Date()
      const hasPartnership = r.partnershipStartDate && r.partnershipEndDate
        ? r.partnershipStartDate <= today && r.partnershipEndDate >= today
        : false
      return {
        favoriteId: f.id,
        id: r.id,
        name: r.name,
        category: r.category,
        zone: r.zone,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: r._count.reviews,
        hasPartnership,
      }
    })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }
    const { restaurantId } = await req.json()
    const existing = await db.favorite.findUnique({
      where: { userId_restaurantId: { userId: session.user.id, restaurantId } },
    })
    if (existing) {
      // Toggle: remove favorite
      await db.favorite.delete({ where: { id: existing.id } })
      return NextResponse.json({ message: '즐겨찾기가 해제되었습니다.', favorited: false })
    }
    await db.favorite.create({
      data: { userId: session.user.id, restaurantId },
    })
    return NextResponse.json({ message: '즐겨찾기에 추가되었습니다.', favorited: true }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
