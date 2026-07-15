'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Search, MapPin, Star, SlidersHorizontal, Heart, ChevronDown, Utensils, X } from 'lucide-react'

const ZONES = ['전체', '정문', '상대', '예대', '후문', '공대쪽문']
const CATEGORIES = ['전체', '한식', '중식', '일식', '양식', '분식', '카페', '패스트푸드', '기타']
const PRICE_RANGES = ['전체', '~5000', '~10000', '~20000', '20000~']
const PRICE_LABELS: Record<string, string> = {
  '전체': '전체',
  '~5000': '~5천원',
  '~10000': '~1만원',
  '~20000': '~2만원',
  '20000~': '2만원~',
}
const SORTS = ['평점순', '가격순', '거리순']

interface Restaurant {
  id: string
  name: string
  category: string
  zone: string
  address: string
  minPrice: number
  avgRating: number
  reviewCount: number
  hasPartnership: boolean
  partnershipInfo: string | null
}

export default function MainPage() {
  const { data: session } = useSession()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [zone, setZone] = useState('전체')
  const [category, setCategory] = useState('전체')
  const [priceRange, setPriceRange] = useState('전체')
  const [sort, setSort] = useState('평점순')
  const [partnershipOnly, setPartnershipOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const fetchRestaurants = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (zone !== '전체') params.set('zone', zone)
    if (category !== '전체') params.set('category', category)
    if (priceRange !== '전체') params.set('price_range', priceRange)
    if (partnershipOnly) params.set('partnership_only', 'true')
    if (sort) params.set('sort', sort)
    if (search) params.set('search', search)
    params.set('t', Date.now().toString())

    const res = await fetch(`/api/restaurants?${params.toString()}`, {
      cache: 'no-store'
    })
    const data = await res.json()
    setRestaurants(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchRestaurants()
  }, [zone, category, priceRange, sort, partnershipOnly])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchRestaurants()
  }

  const categoryEmojis: Record<string, string> = {
    '한식': '🍚', '중식': '🥟', '일식': '🍣', '양식': '🍝', '분식': '🍢', '카페': '☕', '패스트푸드': '🍔', '기타': '🍽️',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-orange-100 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-md">
              <Utensils className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">학식 말고 뭐 먹지?</span>
          </Link>
          <div className="flex items-center gap-2">
            {session ? (
              <Link href="/mypage" className="text-sm text-gray-600 hover:text-orange-600 transition-colors font-medium">
                마이페이지
              </Link>
            ) : (
              <Link href="/login" className="text-sm bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1.5 rounded-full hover:shadow-lg transition-all font-medium">
                로그인
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pb-24">
        {/* Hero Map Placeholder */}
        <div className="mt-4 rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 relative h-44">
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <MapPin className="w-8 h-8 text-emerald-600 animate-bounce" />
            <p className="text-emerald-700 font-medium text-sm mt-1">캠퍼스 주변 식당 지도</p>
            <p className="text-emerald-500 text-xs">카카오 맵 API 연동 시 표시됩니다</p>
          </div>
          {/* Decorative dots */}
          <div className="absolute top-6 left-8 w-2 h-2 bg-orange-400 rounded-full opacity-60" />
          <div className="absolute top-12 right-12 w-2 h-2 bg-red-400 rounded-full opacity-60" />
          <div className="absolute bottom-8 left-16 w-2 h-2 bg-blue-400 rounded-full opacity-60" />
          <div className="absolute bottom-12 right-8 w-2 h-2 bg-purple-400 rounded-full opacity-60" />
          <div className="absolute top-16 left-1/2 w-2 h-2 bg-yellow-400 rounded-full opacity-60" />
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mt-4 relative">
          <div className="flex items-center bg-white rounded-2xl shadow-md border border-orange-100 overflow-hidden focus-within:ring-2 focus-within:ring-orange-300 transition-all">
            <Search className="w-5 h-5 text-gray-400 ml-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="식당명 또는 메뉴명으로 검색"
              className="flex-1 px-3 py-3 text-sm outline-none bg-transparent"
            />
            <button type="submit" className="px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium hover:opacity-90 transition-opacity">
              검색
            </button>
          </div>
        </form>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="mt-3 flex items-center gap-1.5 text-sm text-gray-600 hover:text-orange-600 transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>필터 {showFilters ? '닫기' : '열기'}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {/* Filters */}
        {showFilters && (
          <div className="mt-2 p-4 bg-white rounded-2xl shadow-md border border-orange-100 space-y-3 animate-in fade-in slide-in-from-top-2">
            {/* Zone Filter */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">구역</label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {ZONES.map((z) => (
                  <button
                    key={z}
                    onClick={() => setZone(z)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      zone === z
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                    }`}
                  >
                    {z}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">카테고리</label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      category === c
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                    }`}
                  >
                    {c !== '전체' ? `${categoryEmojis[c]} ${c}` : c}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">가격대</label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {PRICE_RANGES.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriceRange(p)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      priceRange === p
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                    }`}
                  >
                    {PRICE_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>

            {/* Partnership Filter */}
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={partnershipOnly}
                onChange={(e) => setPartnershipOnly(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-300"
              />
              <span className="text-sm text-gray-700 group-hover:text-orange-600 transition-colors">🎉 제휴이벤트 중인 식당만 보기</span>
            </label>
          </div>
        )}

        {/* Active Filter Tags */}
        {(zone !== '전체' || category !== '전체' || priceRange !== '전체' || partnershipOnly) && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {zone !== '전체' && (
              <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-xs font-medium">
                📍 {zone}
                <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => setZone('전체')} />
              </span>
            )}
            {category !== '전체' && (
              <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-xs font-medium">
                {categoryEmojis[category]} {category}
                <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => setCategory('전체')} />
              </span>
            )}
            {priceRange !== '전체' && (
              <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-xs font-medium">
                💰 {PRICE_LABELS[priceRange]}
                <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => setPriceRange('전체')} />
              </span>
            )}
            {partnershipOnly && (
              <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-xs font-medium">
                🎉 제휴이벤트
                <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => setPartnershipOnly(false)} />
              </span>
            )}
          </div>
        )}

        {/* Sort Tabs */}
        <div className="flex gap-1 mt-4 bg-gray-100 rounded-xl p-1">
          {SORTS.map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                sort === s
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Restaurant Results */}
        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
              <p className="text-gray-400 text-sm mt-3">식당을 불러오는 중...</p>
            </div>
          ) : restaurants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                <Search className="w-7 h-7 text-orange-400" />
              </div>
              <p className="text-gray-600 font-medium">검색 결과가 없어요.</p>
              <p className="text-gray-400 text-sm mt-1">새로운 식당을 제보해보세요!</p>
              {session && (
                <Link href="/report" className="mt-3 text-sm text-orange-600 font-medium hover:underline">
                  식당 제보하기 →
                </Link>
              )}
            </div>
          ) : (
            restaurants.map((r) => (
              <Link
                key={r.id}
                href={`/restaurants/${r.id}`}
                className="block bg-white rounded-2xl p-4 shadow-sm border border-orange-50 hover:shadow-md hover:border-orange-200 transition-all group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{r.name}</h3>
                      {r.hasPartnership && (
                        <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-[10px] font-bold rounded-full shadow-sm">
                          제휴
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{r.category}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-500">📍 {r.zone}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-bold text-gray-800">{r.avgRating}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-0.5">리뷰 {r.reviewCount}개</span>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-orange-600 font-medium">
                    최저 {r.minPrice.toLocaleString()}원~
                  </span>
                  {r.hasPartnership && r.partnershipInfo && (
                    <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      🎉 {r.partnershipInfo.slice(0, 20)}...
                    </span>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 z-50">
        <div className="max-w-md mx-auto flex justify-around py-2">
          <Link href="/" className="flex flex-col items-center gap-0.5 text-orange-600">
            <Utensils className="w-5 h-5" />
            <span className="text-[10px] font-medium">홈</span>
          </Link>
          <Link href="/report" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-orange-600 transition-colors">
            <MapPin className="w-5 h-5" />
            <span className="text-[10px] font-medium">식당 제보</span>
          </Link>
          <Link href="/mypage" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-orange-600 transition-colors">
            <Heart className="w-5 h-5" />
            <span className="text-[10px] font-medium">마이</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
