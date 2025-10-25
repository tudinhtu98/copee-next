"use client"

import { useEffect, useState } from 'react'

type AdminSummary = {
  users: number
  spent: number
}

export default function AdminHome(){
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const res = await fetch('/api/proxy/admin/summary', { cache: 'no-store' })
        if (!res.ok) {
          const data = await res.json().catch(() => ({ message: 'Không thể tải thống kê' }))
          throw new Error(data.message || 'Không thể tải thống kê')
        }
        const data = (await res.json()) as AdminSummary
        if (mounted) {
          setSummary(data)
          setError(null)
        }
      } catch (e: any) {
        if (mounted) setError(e.message)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  return <div className="space-y-3">
    <h1 className="text-2xl font-semibold">Thống kê</h1>
    {error && <div className="rounded-md border border-destructive text-destructive px-3 py-2 text-sm">{error}</div>}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-md border p-4">Số user: {summary ? summary.users : '...'}</div>
      <div className="rounded-md border p-4">
        Tiền user đã dùng:{' '}
        {summary
          ? new Intl.NumberFormat('vi-VN').format(summary.spent) + '₫'
          : '...'}
      </div>
      <div className="rounded-md border p-4">Top user dùng nhiều</div>
      <div className="rounded-md border p-4">Top website</div>
    </div>
  </div>
}
