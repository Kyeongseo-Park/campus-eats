'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Utensils, MessageSquare, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface RequestItem {
  id: string
  restaurantName: string
  address: string
  category: string
  menuInfo: string | null
  status: string
  createdAt: string
  user: { nickname: string; email: string }
}

interface RestaurantItem {
  id: string
  name: string
  category: string
  zone: string
  address: string
  _count: { reviews: number }
}

export default function AdminPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'requests' | 'restaurants'>('requests')
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!session?.user?.id) return
    checkAdmin()
  }, [session])

  const checkAdmin = async () => {
    const res = await fetch('/api/restaurant-requests')
    if (res.status === 403) { router.push('/'); return }
    setIsAdmin(true)
    const data = await res.json()
    setRequests(data)
    const rRes = await fetch('/api/restaurants')
    if (rRes.ok) setRestaurants(await rRes.json())
    setLoading(false)
  }

  const handleApprove = async (id: string, approve: boolean) => {
    await fetch(`/api/admin/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: approve ? '승인' : '반려' }),
    })
    const res = await fetch('/api/restaurant-requests')
    setRequests(await res.json())
  }

  const handleDeleteRestaurant = async (id: string) => {
    if (!confirm('이 식당을 삭제하시겠습니까?')) return
    await fetch(`/api/restaurants/${id}`, { method: 'DELETE' })
    const res = await fetch('/api/restaurants')
    setRestaurants(await res.json())
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center">
          <p className="text-gray-600">로그인이 필요합니다.</p>
          <Link href="/login" className="mt-4 block text-orange-600 font-medium">로그인하기</Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
      </div>
    )
  }

  const pendingCount = requests.filter((r) => r.status === '대기').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.push('/')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="font-bold text-gray-900">관리자 대시보드</h1>
            <p className="text-xs text-gray-500">학식 말고 뭐 먹지? 관리 시스템</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <FileText className="w-6 h-6 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
            <p className="text-xs text-gray-500">전체 제보</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-yellow-100 text-center">
            <AlertCircle className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            <p className="text-xs text-gray-500">승인 대기</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-green-100 text-center">
            <Utensils className="w-6 h-6 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{restaurants.length}</p>
            <p className="text-xs text-gray-500">등록 식당</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-4">
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-xl transition-all ${
              activeTab === 'requests' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            <FileText className="w-4 h-4" />
            식당 제보 관리
            {pendingCount > 0 && (
              <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('restaurants')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-xl transition-all ${
              activeTab === 'restaurants' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            <Utensils className="w-4 h-4" />
            식당 목록
          </button>
        </div>

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <FileText className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">제보된 식당이 없습니다.</p>
              </div>
            ) : (
              requests.map((r) => (
                <div key={r.id} className={`bg-white rounded-2xl p-4 shadow-sm border ${
                  r.status === '대기' ? 'border-yellow-200' : r.status === '승인' ? 'border-green-200' : 'border-red-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">{r.restaurantName}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === '대기' ? 'bg-yellow-100 text-yellow-700' : r.status === '승인' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {r.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{r.category} · {r.address}</p>
                      {r.menuInfo && <p className="text-xs text-gray-400 mt-0.5">메뉴: {r.menuInfo}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        제보자: {r.user?.nickname} ({r.user?.email}) · {new Date(r.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>

                  {r.status === '대기' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleApprove(r.id, true)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        승인
                      </button>
                      <button
                        onClick={() => handleApprove(r.id, false)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        반려
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Restaurants Tab */}
        {activeTab === 'restaurants' && (
          <div className="space-y-2">
            {restaurants.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{r.name}</h3>
                  <p className="text-xs text-gray-500">{r.category} · {r.zone} · {r.address}</p>
                </div>
                <button
                  onClick={() => handleDeleteRestaurant(r.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
