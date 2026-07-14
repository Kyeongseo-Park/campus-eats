'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Utensils, Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (result?.error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl flex items-center justify-center shadow-xl mb-3">
            <Utensils className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
            학식 말고 뭐 먹지?
          </h1>
          <p className="text-gray-500 text-sm mt-1">캠퍼스 맛집 탐험을 시작하세요</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-orange-100">
          <h2 className="text-lg font-bold text-gray-900 mb-5">로그인</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">이메일</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:opacity-95 disabled:opacity-60 transition-all mt-2"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-4 p-3 bg-orange-50 rounded-xl border border-orange-100">
            <p className="text-xs text-orange-700 font-semibold mb-1">🧪 테스트 계정</p>
            <p className="text-xs text-orange-600">학생: student@example.com / test1234</p>
            <p className="text-xs text-orange-600">관리자: admin@example.com / admin1234</p>
          </div>

          <div className="mt-4 text-center">
            <span className="text-sm text-gray-500">계정이 없으신가요?</span>
            <Link href="/signup" className="text-sm text-orange-600 font-semibold ml-1 hover:underline">회원가입</Link>
          </div>
        </div>

        <Link href="/" className="block text-center mt-4 text-sm text-gray-400 hover:text-gray-600">
          ← 홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
