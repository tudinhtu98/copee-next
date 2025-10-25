"use client"

import { useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch('/api/proxy' + url, { cache: 'no-store' })
  if (!res.ok) {
    const text = await res.text()
    try {
      const parsed = JSON.parse(text)
      throw new Error(parsed.message || 'Không thể tải dữ liệu')
    } catch {
      throw new Error('Không thể tải dữ liệu')
    }
  }
  return (await res.json()) as T
}

type BalanceResponse = {
  balance: number
}

type SpendingResponse = {
  amount: number
}

export default function BillingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const {
    data: balance,
    mutate: mutateBalance,
    error,
  } = useSWR<BalanceResponse>('/billing/balance', fetcher)
  const { data: spending } = useSWR<SpendingResponse>(
    '/billing/spending?range=week',
    fetcher,
  )

  async function onTopup() {
    try {
      setIsLoading(true)
      const res = await fetch('/api/proxy/billing/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 100000, reference: 'manual:topup' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: 'Lỗi' }))
        throw new Error(data.message || 'Không thể nạp tiền')
      }
      alert('Đã nạp 100.000đ')
      mutateBalance()
    } catch (e: any) {
      alert(e.message || 'Không thể nạp tiền')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Nạp tiền</h1>
        <p className="text-sm text-muted-foreground">
          Số dư sẽ được sử dụng để trừ mỗi khi upload sản phẩm thành công.
        </p>
      </div>
      <div className="rounded-md border p-4 space-y-3">
        <div className="text-lg font-semibold">
          Số dư hiện tại:{' '}
          {error
            ? 'Không thể tải'
            : balance
            ? new Intl.NumberFormat('vi-VN').format(balance.balance) + '₫'
            : '...'}
        </div>
        <div className="text-sm text-muted-foreground">
          Chi tiêu 7 ngày gần nhất:{' '}
          {spending
            ? new Intl.NumberFormat('vi-VN').format(spending.amount) + '₫'
            : '...'}
        </div>
        <Button onClick={onTopup} disabled={isLoading}>
          {isLoading ? 'Đang xử lý...' : 'Nạp 100.000₫'}
        </Button>
      </div>
    </div>
  )
}
