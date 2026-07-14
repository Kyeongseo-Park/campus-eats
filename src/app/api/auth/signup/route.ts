import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { email, password, nickname } = await req.json()

    if (!email || !password || !nickname) {
      return NextResponse.json({ error: '모든 항목을 입력해주세요.' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await db.user.create({
      data: { email, passwordHash, nickname },
    })

    return NextResponse.json({ message: '회원가입이 완료되었습니다.', userId: user.id }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
