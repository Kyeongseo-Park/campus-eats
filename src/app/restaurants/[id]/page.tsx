'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, Star, MapPin, Heart, Utensils, Clock, ChevronRight, Edit2, Trash2 } from 'lucide-react'

interface Menu {
  id: string
  name: string
  price: number
}

interface Review {
  id: string
  userId: string
  rating: number
  content: string
  createdAt: string
  user: { id: string; nickname: string }
}

interface RestaurantDetail {
  id: string
  name: string
  category: string
  zone: string
  address: string
  latitude: number
  longitude: number
  minPrice: number
  avgRating: number
  partnershipInfo: string | null
  partnershipStartDate: string | null
  partnershipEndDate: string | null
  hasPartnership: boolean
  menus: Menu[]
  reviews: Review[]
}

const STAR_LABELS = ['', '별로예요', '그저 그래요', '보통이에요', '좋아요', '완벽해요']

export default function RestaurantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFavorited, setIsFavorited] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewContent, setReviewContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null)
  const [editRating, setEditRating] = useState(5)
  const [editContent, setEditContent] = useState('')
  const [activeTab, setActiveTab] = useState<'menu' | 'review' | 'info'>('menu')

  const fetchRestaurant = async () => {
    const res = await fetch(`/api/restaurants/${params.id}?t=${Date.now()}`, {
      cache: 'no-store'
    })
    if (!res.ok) { router.push('/'); return }
    const data = await res.json()
    setRestaurant(data)
    setIsFavorited(data.isFavorited || false)
    setLoading(false)
  }

  useEffect(() => {
    fetchRestaurant()
  }, [params.id, session])

  const handleFavorite = async () => {
    if (!session) { router.push('/login'); return }
    const res = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurantId: params.id }),
    })
    const data = await res.json()
    setIsFavorited(data.favorited)
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) { router.push('/login'); return }
    if (!reviewContent.trim()) return
    setSubmitting(true)
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurantId: params.id, rating: reviewRating, content: reviewContent }),
    })
    setReviewContent('')
    setReviewRating(5)
    setSubmitting(false)
    fetchRestaurant()
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('리뷰를 삭제하시겠습니까?')) return
    await fetch(`/api/reviews?id=${reviewId}`, { method: 'DELETE' })
    fetchRestaurant()
  }

  const handleEditReview = async (reviewId: string) => {
    await fetch('/api/reviews', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: reviewId, rating: editRating, content: editContent }),
    })
    setEditingReviewId(null)
    fetchRestaurant()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="w-8 h-8 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!restaurant) return null

  const today = new Date()
  const partnershipActive = restaurant.partnershipStartDate && restaurant.partnershipEndDate
    ? new Date(restaurant.partnershipStartDate) <= today && new Date(restaurant.partnershipEndDate) >= today
    : false

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <span className="font-bold text-gray-900 truncate max-w-[200px]">{restaurant.name}</span>
          <button
            onClick={handleFavorite}
            className={`p-2 -mr-2 rounded-full transition-all ${isFavorited ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
          >
            <Heart className={`w-5 h-5 ${isFavorited ? 'fill-red-500' : ''}`} />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto pb-8">
        {/* Restaurant Info Card */}
        <div className="bg-white px-4 py-5 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{restaurant.name}</h1>
                {partnershipActive && (
                  <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-[10px] font-bold rounded-full">
                    제휴
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">{restaurant.category}</span>
                <span className="text-gray-300">·</span>
                <span className="text-sm text-gray-500">📍 {restaurant.zone}</span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="font-bold text-gray-800">{restaurant.avgRating}</span>
                <span className="text-sm text-gray-400">({restaurant.reviews.length}개 리뷰)</span>
              </div>
            </div>
            <div className="text-right">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl flex items-center justify-center">
                <span className="text-3xl">
                  {restaurant.category === '한식' ? '🍚' : restaurant.category === '중식' ? '🥟' : restaurant.category === '일식' ? '🍣' : restaurant.category === '양식' ? '🍝' : restaurant.category === '분식' ? '🍢' : restaurant.category === '카페' ? '☕' : restaurant.category === '패스트푸드' ? '🍔' : '🍽️'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-1.5 mt-3">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-gray-600">{restaurant.address}</span>
          </div>
          <div className="mt-1 text-sm text-orange-600 font-medium">
            최저가 {restaurant.minPrice.toLocaleString()}원~
          </div>
        </div>

        {/* Partnership Event Banner */}
        {partnershipActive && restaurant.partnershipInfo && (
          <div className="mx-4 mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🎉</span>
              <span className="font-bold text-amber-800 text-sm">학생회 제휴이벤트 진행 중!</span>
            </div>
            <p className="text-amber-700 text-sm">{restaurant.partnershipInfo}</p>
            {restaurant.partnershipEndDate && (
              <p className="text-amber-500 text-xs mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(restaurant.partnershipEndDate).toLocaleDateString('ko-KR')}까지
              </p>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="mt-4 flex bg-white border-b border-gray-200">
          {(['menu', 'review', 'info'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'menu' ? '메뉴' : tab === 'review' ? `리뷰 (${restaurant.reviews.length})` : '위치'}
            </button>
          ))}
        </div>

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div className="bg-white mt-2 divide-y divide-gray-50">
            {restaurant.menus.length === 0 ? (
              <p className="py-8 text-center text-gray-400 text-sm">등록된 메뉴가 없습니다.</p>
            ) : (
              restaurant.menus.map((menu) => (
                <div key={menu.id} className="flex justify-between items-center px-4 py-3.5 hover:bg-orange-50 transition-colors">
                  <span className="text-gray-800 text-sm font-medium">{menu.name}</span>
                  <span className="text-orange-600 font-bold text-sm">{menu.price.toLocaleString()}원</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Review Tab */}
        {activeTab === 'review' && (
          <div className="mt-2">
            {/* Review Write Form */}
            {session ? (
              <div className="bg-white px-4 py-4 border-b border-gray-100">
                <p className="font-semibold text-gray-800 text-sm mb-3">리뷰 작성</p>
                <form onSubmit={handleSubmitReview}>
                  {/* Star Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setReviewRating(s)}
                          className="text-2xl transition-transform hover:scale-110"
                        >
                          {s <= reviewRating ? '⭐' : '☆'}
                        </button>
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">{STAR_LABELS[reviewRating]}</span>
                  </div>
                  <textarea
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="이 식당에 대한 솔직한 리뷰를 남겨주세요!"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-200 transition-all"
                    rows={3}
                  />
                  <button
                    type="submit"
                    disabled={submitting || !reviewContent.trim()}
                    className="mt-2 w-full py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {submitting ? '등록 중...' : '리뷰 등록'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-orange-50 mx-4 mt-2 p-4 rounded-2xl text-center">
                <p className="text-gray-600 text-sm">리뷰를 작성하려면 로그인이 필요합니다.</p>
                <Link href="/login" className="inline-block mt-2 text-sm text-orange-600 font-medium hover:underline">
                  로그인하기 →
                </Link>
              </div>
            )}

            {/* Review List */}
            <div className="bg-white mt-2 divide-y divide-gray-50">
              {restaurant.reviews.length === 0 ? (
                <p className="py-8 text-center text-gray-400 text-sm">첫 번째 리뷰를 남겨보세요!</p>
              ) : (
                restaurant.reviews.map((review) => (
                  <div key={review.id} className="px-4 py-4">
                    {editingReviewId === review.id ? (
                      <div>
                        <div className="flex gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button key={s} type="button" onClick={() => setEditRating(s)} className="text-xl">
                              {s <= editRating ? '⭐' : '☆'}
                            </button>
                          ))}
                        </div>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none outline-none focus:border-orange-300"
                          rows={3}
                        />
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => handleEditReview(review.id)} className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium">수정 완료</button>
                          <button onClick={() => setEditingReviewId(null)} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">취소</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800 text-sm">{review.user.nickname}</span>
                            <div className="flex">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                              ))}
                            </div>
                          </div>
                          {session?.user?.id === review.user.id && (
                            <div className="flex gap-1">
                              <button onClick={() => { setEditingReviewId(review.id); setEditRating(review.rating); setEditContent(review.content) }} className="p-1 text-gray-400 hover:text-orange-500">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteReview(review.id)} className="p-1 text-gray-400 hover:text-red-500">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm">{review.content}</p>
                        <p className="text-gray-400 text-xs mt-1">{new Date(review.createdAt).toLocaleDateString('ko-KR')}</p>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Info/Location Tab */}
        {activeTab === 'info' && (
          <div className="mt-2 bg-white">
            {/* Map Placeholder */}
            <div className="h-52 bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 flex flex-col items-center justify-center">
              <MapPin className="w-8 h-8 text-emerald-600 animate-bounce" />
              <p className="text-emerald-700 font-medium text-sm mt-1">지도</p>
              <p className="text-emerald-500 text-xs">위도: {restaurant.latitude} · 경도: {restaurant.longitude}</p>
            </div>
            <div className="p-4">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-800 font-medium">주소</p>
                  <p className="text-sm text-gray-600 mt-0.5">{restaurant.address}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
