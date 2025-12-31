"use client"

import useSWR from 'swr'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

import { fetcher } from '@/src/lib/fetcher'

type BalanceResponse = {
  balance: number
}

type SpendingResponse = {
  amount: number
}

export default function BillingPage() {
  const {
    data: balance,
    error,
  } = useSWR<BalanceResponse>('/billing/balance', fetcher)
  const { data: spending } = useSWR<SpendingResponse>(
    '/billing/spending?range=week',
    fetcher,
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Nạp tiền</h1>
          <p className="text-sm text-muted-foreground">
            Số dư sẽ được sử dụng để trừ mỗi khi upload sản phẩm thành công.
          </p>
        </div>
        <Link href="/dashboard/billing/history">
          <Button variant="outline">Xem lịch sử giao dịch</Button>
        </Link>
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
        <div className="rounded-md bg-muted p-4 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Tính năng nạp tiền đang được cập nhật
          </p>
          <p className="text-lg font-semibold mt-1">Sắp có mặt</p>
          <p className="text-xs text-muted-foreground mt-2">
            Vui lòng liên hệ Admin để nạp tiền vào tài khoản
          </p>
        </div>
      </div>
    </div>
  )
}
