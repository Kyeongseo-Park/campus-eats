import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import db from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const restaurant = await db.restaurant.findUnique({
      where: { id },
      include: {
        menus: true,
        reviews: {
          include: { user: { select: { id: true, nickname: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!restaurant) return NextResponse.json({ error: '존재하지 않는 식당입니다.' }, { status: 404 })
    const avgRating = restaurant.reviews.length > 0
      ? restaurant.reviews.reduce((sum, r) => sum + r.rating, 0) / restaurant.reviews.length
      : 0
    const today = new Date()
    const hasPartnership = restaurant.partnershipStartDate && restaurant.partnershipEndDate
      ? restaurant.partnershipStartDate <= today && restaurant.partnershipEndDate >= today
      : false
    return NextResponse.json({ ...restaurant, avgRating: Math.round(avgRating * 10) / 10, hasPartnership })
  } catch (error) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    const user = await db.user.findUnique({ where: { id: session.user.id } })
    if (user?.role !== 'admin') return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    const { id } = await params
    await db.restaurant.delete({ where: { id } })
    return NextResponse.json({ message: '식당이 삭제되었습니다.' })
  } catch (error) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
