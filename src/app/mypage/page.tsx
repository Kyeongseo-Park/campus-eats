'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star, Heart, FileText, LogOut, ChevronRight } from 'lucide-react'

interface Review {
  id: string
  rating: number
  content: string
  createdAt: string
  restaurant: { id: string; name: string }
}

interface FavoriteRestaurant {
  favoriteId: string
  id: string
  name: string
  category: string
  zone: string
  avgRating: number
  hasPartnership: boolean
}

interface RequestItem {
  id: string
  restaurantName: string
  address: string
  category: string
  status: string
  createdAt: string
}

export default function MyPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'reviews' | 'favorites' | 'requests'>('favorites')
  const [reviews, setReviews] = useState<Review[]>([])
  const [favorites, setFavorites] = useState<FavoriteRestaurant[]>([])
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const t = Date.now()
    try {
      const [favRes, reqRes, revRes] = await Promise.all([
        fetch(`/api/favorites?t=${t}`, { cache: 'no-store' }),
        fetch(`/api/restaurant-requests?t=${t}`, { cache: 'no-store' }),
        fetch(`/api/reviews?my=true&t=${t}`, { cache: 'no-store' })
      ])
      if (favRes.ok) setFavorites(await favRes.json())
      if (reqRes.ok) setRequests(await reqRes.json())
      if (revRes.ok) setReviews(await revRes.json())
    } catch (e) {
      console.error("데이터 로드 실패", e)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!session) return
    fetchData()
  }, [session])

  if (!session) {
    return (
      <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 shadow-xl text-center max-w-sm w-full">
          <div className="text-5xl mb-4">👤</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">로그인이 필요합니다</h2>
          <Link href="/login" className="block w-full py-3 mt-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-sm text-center">로그인하기</Link>
        </div>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    '대기': 'bg-yellow-100 text-yellow-700',
    '승인': 'bg-green-100 text-green-700',
    '반려': 'bg-red-100 text-red-700',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-orange-100 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="font-bold text-gray-900">마이페이지</h1>
          <button onClick={() => signOut({ callbackUrl: '/' })} className="p-2 -mr-2 text-gray-400 hover:text-red-500 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pb-24">
        {/* Profile Card */}
        <div className="mt-4 bg-white rounded-3xl p-5 shadow-xl border border-orange-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-md">
              <span className="text-2xl font-bold text-white">{session.user?.name?.[0] ?? '학'}</span>
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">{session.user?.name}</h2>
              <p className="text-sm text-gray-500">{session.user?.email}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="bg-orange-50 rounded-2xl p-3 text-center cursor-pointer hover:bg-orange-100 transition-colors" onClick={() => setActiveTab('favorites')}>
              <Heart className="w-5 h-5 text-orange-500 mx-auto mb-1" />
              <span className="text-xs text-gray-600 font-medium">즐겨찾기</span>
              <p className="text-lg font-bold text-orange-600">{favorites.length}</p>
            </div>
            <div className="bg-orange-50 rounded-2xl p-3 text-center cursor-pointer hover:bg-orange-100 transition-colors" onClick={() => setActiveTab('reviews')}>
              <Star className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <span className="text-xs text-gray-600 font-medium">내 리뷰</span>
              <p className="text-lg font-bold text-orange-600">{reviews.length}</p>
            </div>
            <div className="bg-orange-50 rounded-2xl p-3 text-center cursor-pointer hover:bg-orange-100 transition-colors" onClick={() => setActiveTab('requests')}>
              <FileText className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <span className="text-xs text-gray-600 font-medium">제보</span>
              <p className="text-lg font-bold text-orange-600">{requests.length}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 bg-gray-100 rounded-2xl p-1">
          {(['favorites', 'reviews', 'requests'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-medium rounded-xl transition-all ${
                activeTab === tab ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'favorites' ? '❤️ 즐겨찾기' : tab === 'reviews' ? '⭐ 내 리뷰' : '📋 내 제보'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="mt-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
            </div>
          ) : activeTab === 'favorites' ? (
            <div className="space-y-3">
              {favorites.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                  <Heart className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">즐겨찾기한 식당이 없습니다.</p>
                  <Link href="/" className="inline-block mt-2 text-sm text-orange-600 font-medium hover:underline">식당 탐색하기 →</Link>
                </div>
              ) : (
                favorites.map((r) => (
                  <Link
                    key={r.id}
                    href={`/restaurants/${r.id}`}
                    className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-orange-50 hover:shadow-md transition-all group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{r.name}</span>
                        {r.hasPartnership && (
                          <span className="px-1.5 py-0.5 bg-amber-400 text-white text-[10px] font-bold rounded-full">제휴</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs text-gray-600">{r.avgRating} · {r.category} · {r.zone}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                ))
              )}
            </div>
          ) : activeTab === 'reviews' ? (
            <div className="space-y-3">
              {reviews.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                  <Star className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">작성한 리뷰가 없습니다.</p>
                  <Link href="/" className="inline-block mt-2 text-sm text-orange-600 font-medium hover:underline">식당 리뷰 남기기 →</Link>
                </div>
              ) : (
                reviews.map((rev) => (
                  <Link
                    key={rev.id}
                    href={`/restaurants/${rev.restaurant.id}`}
                    className="block bg-white rounded-2xl p-4 shadow-sm border border-orange-50 hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-gray-950 group-hover:text-orange-600 transition-colors text-sm">{rev.restaurant.name}</h4>
                        <div className="flex gap-0.5 my-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400">{new Date(rev.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                    <p className="text-xs text-gray-700 mt-1 line-clamp-2">{rev.content}</p>
                  </Link>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {requests.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                  <FileText className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">제보한 식당이 없습니다.</p>
                  <Link href="/report" className="inline-block mt-2 text-sm text-orange-600 font-medium hover:underline">식당 제보하기 →</Link>
                </div>
              ) : (
                requests.map((r) => (
                  <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm border border-orange-50">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900">{r.restaurantName}</h3>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[r.status]}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{r.category} · {r.address}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString('ko-KR')} 제보</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
