import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import db from '@/lib/db'

// Admin: approve/reject restaurant request
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    const user = await db.user.findUnique({ where: { id: session.user.id } })
    if (user?.role !== 'admin') return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })

    const { id } = await params
    const body = await req.json()
    const { status, restaurantName, address, category, menuInfo } = body

    const updated = await db.restaurantRequest.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(restaurantName && { restaurantName }),
        ...(address && { address }),
        ...(category && { category }),
        ...(menuInfo !== undefined && { menuInfo }),
      },
    })

    // If approved, create the restaurant
    if (status === '승인') {
      await db.restaurant.create({
        data: {
          name: updated.restaurantName,
          category: updated.category,
          zone: '정문', // default zone
          address: updated.address,
          latitude: 35.8895, // default campus lat
          longitude: 128.6115, // default campus lng
          minPrice: 0,
        },
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("제보 승인 처리 실패:", error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
