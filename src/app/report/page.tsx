'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Send } from 'lucide-react'

const CATEGORIES = ['한식', '중식', '일식', '양식', '분식', '카페']

export default function ReportPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [restaurantName, setRestaurantName] = useState('')
  const [address, setAddress] = useState('')
  const [category, setCategory] = useState('')
  const [menuInfo, setMenuInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  if (!session) {
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 shadow-xl text-center max-w-sm w-full">
          <div className="text-5xl mb-4">🍽️</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-500 text-sm mb-5">식당 제보는 로그인한 회원만 이용할 수 있습니다.</p>
          <Link href="/login" className="block w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-sm text-center">
            로그인하기
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!category) { setError('카테고리를 선택해주세요.'); return }
    setError('')
    setSubmitting(true)
    const res = await fetch('/api/restaurant-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurantName, address, category, menuInfo }),
    })
    setSubmitting(false)
    if (res.ok) {
      setSuccess(true)
    } else {
      const data = await res.json()
      setError(data.error)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 shadow-xl text-center max-w-sm w-full">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">제보 완료!</h2>
          <p className="text-gray-500 text-sm mb-5">관리자 검토 후 승인되면 서비스에 등록됩니다.<br />마이페이지에서 처리 현황을 확인할 수 있어요.</p>
          <Link href="/" className="block w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-sm text-center">
            홈으로 돌아가기
          </Link>
          <Link href="/mypage" className="block w-full py-3 mt-2 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm text-center">
            마이페이지에서 확인
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-orange-100 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="font-bold text-gray-900">식당 제보</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-orange-100">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-5 h-5 text-orange-500" />
            <h2 className="font-bold text-gray-900">새로운 식당 제보</h2>
          </div>
          <p className="text-sm text-gray-500 mb-5">찾지 못한 맛집을 알려주세요! 관리자 검토 후 등록됩니다.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                식당명 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="예: 맛있는 식당"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                위치 (주소) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="예: 정문로 12번길 3"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                카테고리 <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                      category === c
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-transparent shadow-md'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                메뉴 및 가격 <span className="text-gray-400 font-normal">(선택)</span>
              </label>
              <textarea
                value={menuInfo}
                onChange={(e) => setMenuInfo(e.target.value)}
                placeholder="예: 된장찌개 7000원, 제육볶음 8000원"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 resize-none transition-all"
                rows={3}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-sm hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 transition-all"
            >
              <Send className="w-4 h-4" />
              {submitting ? '제보 중...' : '식당 제보하기'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
