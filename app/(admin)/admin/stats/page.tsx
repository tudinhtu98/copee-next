"use client"

import { useState } from 'react'
import useSWR from 'swr'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

type AdminStatsResponse = {
  range: 'week' | 'month' | 'quarter' | 'year'
  topUsers: Array<{ userId: string; username: string; email: string; spent: number }>
  topSites: Array<{ siteId: string; name: string; baseUrl: string; uploads: number }>
  topProducts: Array<{ productId: string; title: string; sourceUrl: string; uploads: number }>
  topCategories: Array<{ category: string; count: number }>
}

const rangeOptions: Array<{ value: AdminStatsResponse['range']; label: string }> = [
  { value: 'week', label: '7 ngày gần đây' },
  { value: 'month', label: '30 ngày gần đây' },
  { value: 'quarter', label: '3 tháng gần đây' },
  { value: 'year', label: '1 năm gần đây' },
]

export default function AdminStats() {
  const [range, setRange] = useState<AdminStatsResponse['range']>('week')
  const { data, error, isLoading } = useSWR<AdminStatsResponse>(
    `/admin/stats?range=${range}`,
    fetcher,
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold">Top thống kê</h1>
        <Select value={range} onValueChange={(value) => setRange(value as AdminStatsResponse['range'])}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Chọn khoảng thời gian" />
          </SelectTrigger>
          <SelectContent>
            {rangeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {(error as Error).message || 'Không thể tải dữ liệu'}
        </div>
      )}

      {isLoading && (
        <div className="text-sm text-muted-foreground">Đang tải thống kê...</div>
      )}

      {data && (
        <div className="grid gap-4 lg:grid-cols-2">
          <StatsCard
            title="Top user chi tiêu"
            emptyMessage="Chưa có dữ liệu"
            hasData={data.topUsers.length > 0}
          >
            <ul className="space-y-2 text-sm">
              {data.topUsers.map((user) => (
                <li
                  key={user.userId}
                  className="flex items-center justify-between rounded border px-3 py-2"
                >
                  <div>
                    <div className="font-medium">{user.username}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  <div className="text-sm font-semibold">
                    {new Intl.NumberFormat('vi-VN').format(user.spent)}₫
                  </div>
                </li>
              ))}
            </ul>
          </StatsCard>

          <StatsCard
            title="Top site WooCommerce"
            emptyMessage="Chưa có dữ liệu"
            hasData={data.topSites.length > 0}
          >
            <ul className="space-y-2 text-sm">
              {data.topSites.map((site) => (
                <li
                  key={site.siteId}
                  className="flex items-center justify-between rounded border px-3 py-2"
                >
                  <div>
                    <div className="font-medium">{site.name}</div>
                    <div className="text-xs text-muted-foreground">{site.baseUrl}</div>
                  </div>
                  <div className="text-sm font-semibold">{site.uploads} upload</div>
                </li>
              ))}
            </ul>
          </StatsCard>

          <StatsCard
            title="Top sản phẩm được upload"
            emptyMessage="Chưa có dữ liệu"
            hasData={data.topProducts.length > 0}
          >
            <ul className="space-y-2 text-sm">
              {data.topProducts.map((product) => (
                <li
                  key={product.productId}
                  className="flex items-center justify-between rounded border px-3 py-2"
                >
                  <div className="max-w-[60%]">
                    <div className="font-medium line-clamp-2">{product.title}</div>
                    {product.sourceUrl && (
                      <a
                        href={product.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Link gốc
                      </a>
                    )}
                  </div>
                  <div className="text-sm font-semibold">{product.uploads} lần</div>
                </li>
              ))}
            </ul>
          </StatsCard>

          <StatsCard
            title="Top ngành hàng"
            emptyMessage="Chưa có dữ liệu"
            hasData={data.topCategories.length > 0}
          >
            <ul className="space-y-2 text-sm">
              {data.topCategories.map((category) => (
                <li
                  key={category.category}
                  className="flex items-center justify-between rounded border px-3 py-2"
                >
                  <div className="font-medium">{category.category}</div>
                  <div className="text-sm font-semibold">{category.count} sản phẩm</div>
                </li>
              ))}
            </ul>
          </StatsCard>
        </div>
      )}
    </div>
  )
}

function StatsCard({
  title,
  emptyMessage,
  hasData,
  children,
}: {
  title: string
  emptyMessage: string
  hasData: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3 rounded-md border p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {hasData ? (
        children
      ) : (
        <div className="text-sm text-muted-foreground">{emptyMessage}</div>
      )}
    </div>
  )
}
