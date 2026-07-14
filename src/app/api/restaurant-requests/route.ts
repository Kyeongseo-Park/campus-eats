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
    // Check admin
    const user = await db.user.findUnique({ where: { id: session.user.id } })
    if (user?.role !== 'admin') {
      // Regular user: get their own requests
      const requests = await db.restaurantRequest.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(requests)
    }
    // Admin: get all
    const requests = await db.restaurantRequest.findMany({
      include: { user: { select: { nickname: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(requests)
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
    const { restaurantName, address, category, menuInfo } = await req.json()
    if (!restaurantName || !address || !category) {
      return NextResponse.json({ error: '식당명, 위치, 카테고리는 필수입니다.' }, { status: 400 })
    }
    const request = await db.restaurantRequest.create({
      data: {
        userId: session.user.id,
        restaurantName,
        address,
        category,
        menuInfo: menuInfo || null,
      },
    })
    return NextResponse.json(request, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
