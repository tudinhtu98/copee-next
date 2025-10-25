"use client"

import useSWR from 'swr'

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

type Product = {
  id: string
  status: 'DRAFT' | 'READY' | 'UPLOADED' | 'FAILED'
}

type BalanceResponse = {
  balance: number
}

type SpendingResponse = {
  amount: number
}

export default function DashboardHome() {
  const { data: productsResponse, error: productError } = useSWR<{
    items: Product[]
    pagination: { total: number }
  }>('/products?limit=1000', fetcher)
  
  const { data: balance, error: balanceError } = useSWR<BalanceResponse>(
    '/billing/balance',
    fetcher,
  )
  const { data: spending } = useSWR<SpendingResponse>(
    '/billing/spending?range=week',
    fetcher,
  )

  const products = productsResponse?.items || []
  const copiedCount = products.length
  const uploadedCount = products.filter((product) => product.status === 'UPLOADED').length

  const hasProductError = Boolean(productError)
  const hasBalanceError = Boolean(balanceError)

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Tổng quan</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border p-4">
          <div className="text-sm text-muted-foreground">Số dư</div>
          <div className="text-lg font-semibold">
            {hasBalanceError
              ? 'Không thể tải'
              : balance
              ? new Intl.NumberFormat('vi-VN').format(balance.balance) + '₫'
              : '...'}
          </div>
        </div>
        <div className="rounded-md border p-4">
          <div className="text-sm text-muted-foreground">Sản phẩm đã copy</div>
          <div className="text-lg font-semibold">
            {hasProductError ? 'Không thể tải' : copiedCount}
          </div>
        </div>
        <div className="rounded-md border p-4">
          <div className="text-sm text-muted-foreground">Upload thành công</div>
          <div className="text-lg font-semibold">
            {hasProductError ? 'Không thể tải' : uploadedCount}
          </div>
        </div>
        <div className="rounded-md border p-4">
          <div className="text-sm text-muted-foreground">Chi tiêu 7 ngày gần nhất</div>
          <div className="text-lg font-semibold">
            {spending
              ? new Intl.NumberFormat('vi-VN').format(spending.amount) + '₫'
              : '...'}
          </div>
        </div>
      </div>
    </div>
  )
}
