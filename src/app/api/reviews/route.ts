import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const restaurantId = searchParams.get('restaurantId')
    const my = searchParams.get('my') === 'true'

    if (my) {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
      }
      const reviews = await db.review.findMany({
        where: { userId: session.user.id },
        include: {
          restaurant: {
            select: { id: true, name: true, category: true, zone: true }
          }
        },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(reviews)
    }

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId가 필요합니다.' }, { status: 400 })
    }

    const reviews = await db.review.findMany({
      where: { restaurantId },
      include: { user: { select: { id: true, nickname: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(reviews)
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
    const { restaurantId, rating, content } = await req.json()
    if (!restaurantId || !rating || !content) {
      return NextResponse.json({ error: '모든 항목을 입력해주세요.' }, { status: 400 })
    }
    const review = await db.review.create({
      data: { userId: session.user.id, restaurantId, rating, content },
    })
    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }
    const { id, rating, content } = await req.json()
    const review = await db.review.findUnique({ where: { id } })
    if (!review || review.userId !== session.user.id) {
      return NextResponse.json({ error: '본인의 리뷰만 수정할 수 있습니다.' }, { status: 403 })
    }
    const updated = await db.review.update({
      where: { id },
      data: { rating, content },
    })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: '리뷰 ID가 필요합니다.' }, { status: 400 })
    }
    const review = await db.review.findUnique({ where: { id } })
    if (!review || review.userId !== session.user.id) {
      return NextResponse.json({ error: '본인의 리뷰만 삭제할 수 있습니다.' }, { status: 403 })
    }
    await db.review.delete({ where: { id } })
    return NextResponse.json({ message: '리뷰가 삭제되었습니다.' })
  } catch (error) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
