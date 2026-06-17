"use client"

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { HistoryIcon } from 'lucide-react'
import { fetcher } from '@/src/lib/fetcher'

type BalanceResponse = {
  balance: number
}

type SpendingResponse = {
  amount: number
}

const AMOUNTS = [
  { value: 10000, discount: 0 },
  { value: 20000, discount: 0 },
  { value: 50000, discount: 0 },
  { value: 100000, discount: 0 },
  { value: 200000, discount: 0 },
  { value: 300000, discount: 5 },
  { value: 500000, discount: 15 },
  { value: 1000000, discount: 20 },
]

function getDiscount(amount: number) {
  return AMOUNTS.find((a) => a.value === amount)?.discount ?? 0
}

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
  const [notifyState, setNotifyState] = useState<'idle' | 'sending' | 'sent'>('idle')

  async function notifyTransferred() {
    if (notifyState === 'sending') return
    setNotifyState('sending')
    try {
      const res = await fetch('/api/proxy/billing/deposit-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: selectedAmount }),
      })
      if (!res.ok) throw new Error('failed')
      setNotifyState('sent')
    } catch {
      setNotifyState('idle')
      alert('Không gửi được thông báo, vui lòng thử lại hoặc liên hệ hỗ trợ.')
    }
  }

  const {
    data: balance,
    error,
  } = useSWR<BalanceResponse>('/billing/balance', fetcher)
  const { data: spending } = useSWR<SpendingResponse>(
    '/billing/spending?range=week',
    fetcher,
  )

  return (
    <div className="space-y-4 pb-28">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Nạp tiền</h1>
          <p className="text-sm text-muted-foreground">
            Số dư sẽ được sử dụng để trừ mỗi khi upload sản phẩm thành công.
          </p>
        </div>
        <Link href="/dashboard/billing/history">
          <Button variant="outline"><HistoryIcon className="h-4 w-4" />Xem lịch sử giao dịch</Button>
        </Link>
      </div>
      <div className="rounded-md border p-4 space-y-3">
        <div className="text-lg font-semibold">
          Số dư hiện tại:{' '}
          {error
            ? 'Không thể tải'
            : balance
            ? new Intl.NumberFormat('vi-VN').format(balance.balance) + ' điểm'
            : '...'}
        </div>
        <div className="text-sm text-muted-foreground">
          Chi tiêu 7 ngày gần nhất:{' '}
          {spending
            ? new Intl.NumberFormat('vi-VN').format(spending.amount) + ' điểm'
            : '...'}
        </div>
      </div>

      <div className="rounded-md border p-4 space-y-4">
        <h2 className="text-lg font-semibold">Chọn số tiền nạp</h2>
        <div className="flex flex-wrap gap-2">
          {AMOUNTS.map(({ value, discount }) => (
            <Button
              key={value}
              variant={selectedAmount === value ? 'default' : 'outline'}
              onClick={() => {
                setSelectedAmount(value)
                setNotifyState('idle')
              }}
              className="relative"
            >
              {new Intl.NumberFormat('vi-VN').format(value)}₫
              {discount > 0 && (
                <span className="absolute -top-2 -right-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                  +{discount}%
                </span>
              )}
            </Button>
          ))}
          <Button variant="outline" asChild>
            <a href="https://hoanglongteam.bio.link" target="_blank" rel="noopener noreferrer">
              Nạp nhiều hơn (liên hệ)
            </a>
          </Button>
        </div>

        {username && (
          <div className="flex flex-col items-center gap-4 pt-4">
            <p className="text-lg text-muted-foreground">
              Quét mã QR để chuyển khoản{' '}
              <span className="font-bold text-foreground text-xl">
                {new Intl.NumberFormat('vi-VN').format(selectedAmount)}₫
              </span>
              {getDiscount(selectedAmount) > 0 && (
                <span className="ml-2 text-sm font-semibold text-green-600">
                  (được cộng {new Intl.NumberFormat('vi-VN').format(selectedAmount * (1 + getDiscount(selectedAmount) / 100))} điểm)
                </span>
              )}
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
            {notifyState === 'sent' ? (
              <p className="text-sm font-medium text-green-600">
                ✓ Đã báo admin. Số dư sẽ được cộng sau khi đối soát chuyển khoản.
              </p>
            ) : (
              <Button
                onClick={notifyTransferred}
                disabled={notifyState === 'sending'}
              >
                {notifyState === 'sending' ? 'Đang gửi...' : 'Tôi đã chuyển khoản — báo admin'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
