"use client"

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

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

type Transaction = {
  id: string
  amount: number
  type: 'CREDIT' | 'DEBIT'
  reference: string | null
  description: string | null
  createdAt: string
}

export default function BillingHistoryPage() {
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Create query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: '20',
      ...(typeFilter && { type: typeFilter }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    })
    return params.toString()
  }, [page, typeFilter, startDate, endDate])

  const {
    data: transactionsData,
    error,
    isLoading,
  } = useSWR<{
    items: Transaction[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }>(`/billing/transactions?${queryParams}`, fetcher)

  const transactions = transactionsData?.items || []
  const pagination = transactionsData?.pagination

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(Math.abs(amount)) + '₫'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold">Lịch sử giao dịch</h1>
      </div>

      {/* Filters */}
      <div className="grid gap-3 sm:grid-cols-4">
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value)
            setPage(1)
          }}
        >
          <option value="">Tất cả loại</option>
          <option value="CREDIT">Nạp tiền</option>
          <option value="DEBIT">Trừ tiền</option>
        </select>
        <Input
          type="date"
          placeholder="Từ ngày"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value)
            setPage(1)
          }}
        />
        <Input
          type="date"
          placeholder="Đến ngày"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value)
            setPage(1)
          }}
        />
        <Button
          variant="outline"
          onClick={() => {
            setTypeFilter('')
            setStartDate('')
            setEndDate('')
            setPage(1)
          }}
        >
          Xóa bộ lọc
        </Button>
      </div>

      {/* Transactions Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ngày giờ</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Số tiền</TableHead>
              <TableHead>Tham chiếu</TableHead>
              <TableHead>Mô tả</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5}>Đang tải...</TableCell>
              </TableRow>
            )}
            {error && (
              <TableRow>
                <TableCell colSpan={5} className="text-destructive">
                  {(error as Error).message || 'Lỗi tải dữ liệu'}
                </TableCell>
              </TableRow>
            )}
            {transactions && transactions.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={5}>Chưa có giao dịch nào</TableCell>
              </TableRow>
            )}
            {transactions?.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                <TableCell>
                  <Badge variant={transaction.type === 'CREDIT' ? 'default' : 'destructive'}>
                    {transaction.type === 'CREDIT' ? 'Nạp tiền' : 'Trừ tiền'}
                  </Badge>
                </TableCell>
                <TableCell className={transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}>
                  {transaction.type === 'CREDIT' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </TableCell>
                <TableCell>{transaction.reference || '-'}</TableCell>
                <TableCell>{transaction.description || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Hiển thị {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Trước
            </Button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum
              if (pagination.totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              )
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.totalPages}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
