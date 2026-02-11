"use client"

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { fetcher } from '@/src/lib/fetcher'

type BalanceResponse = {
  balance: number
}

type SpendingResponse = {
  amount: number
}

const AMOUNTS = [10000, 20000, 50000, 100000, 200000, 500000]

function sanitizeUsername(username: string) {
  return username.replace(/[^a-zA-Z0-9]/g, ' ').trim()
}

function buildQrUrl(amount: number, username: string) {
  const info = `nap copee ${sanitizeUsername(username)}`
  return `https://api.vietqr.io/image/970436-0071001129307-d0xVMVh.jpg?accountName=HOANG%20THANH%20LONG&amount=${amount}&addInfo=${encodeURIComponent(info)}`
}

export default function BillingPage() {
  const { data: session } = useSession() as any
  const username = session?.user?.username || session?.user?.name || ''
  const [selectedAmount, setSelectedAmount] = useState(50000)

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
      </div>

      <div className="rounded-md border p-4 space-y-4">
        <h2 className="text-lg font-semibold">Chọn số tiền nạp</h2>
        <div className="flex flex-wrap gap-2">
          {AMOUNTS.map((amount) => (
            <Button
              key={amount}
              variant={selectedAmount === amount ? 'default' : 'outline'}
              onClick={() => setSelectedAmount(amount)}
            >
              {new Intl.NumberFormat('vi-VN').format(amount)}₫
            </Button>
          ))}
        </div>

        {username && (
          <div className="flex flex-col items-center gap-4 pt-4">
            <p className="text-lg text-muted-foreground">
              Quét mã QR để chuyển khoản{' '}
              <span className="font-bold text-foreground text-xl">
                {new Intl.NumberFormat('vi-VN').format(selectedAmount)}₫
              </span>
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={selectedAmount}
              src={buildQrUrl(selectedAmount, username)}
              alt="QR chuyển khoản"
              className="w-80 rounded-md border"
            />
            <p className="text-base text-muted-foreground">
              Nội dung CK:{' '}
              <span className="font-semibold text-foreground">nap copee {sanitizeUsername(username)}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Số dư sẽ được cộng sau khi chuyển khoản thành công. Có thể nhắn tin thông qua kênh Hỗ trợ để được cộng số dư nhanh hơn.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
