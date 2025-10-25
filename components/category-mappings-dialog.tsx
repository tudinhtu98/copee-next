"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
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

type CategoryMapping = {
  id: string
  sourceName: string
  targetId: string
  targetName: string
  createdAt: string
}

type CategoryMappingsDialogProps = {
  siteId: string
  siteName: string
}

export function CategoryMappingsDialog({ siteId, siteName }: CategoryMappingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ sourceName: '', targetId: '', targetName: '' })
  const [isSaving, setIsSaving] = useState(false)

  const {
    data: mappings,
    mutate,
    error,
  } = useSWR<CategoryMapping[]>(
    open ? `/sites/${siteId}/category-mappings` : null,
    fetcher,
  )

  async function onSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.sourceName || !form.targetId || !form.targetName) {
      alert('Vui lòng điền đầy đủ thông tin')
      return
    }

    try {
      setIsSaving(true)
      const res = await fetch(`/api/proxy/sites/${siteId}/category-mappings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: 'Lỗi lưu' }))
        throw new Error(data.message || 'Lỗi lưu')
      }

      alert('Đã thêm category mapping')
      setForm({ sourceName: '', targetId: '', targetName: '' })
      mutate()
    } catch (e: any) {
      alert(e.message || 'Lỗi lưu')
    } finally {
      setIsSaving(false)
    }
  }

  async function onDelete(mappingId: string) {
    if (!confirm('Bạn có chắc muốn xoá mapping này?')) return

    try {
      const res = await fetch(`/api/proxy/sites/${siteId}/category-mappings/${mappingId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: 'Không thể xoá' }))
        throw new Error(data.message || 'Không thể xoá')
      }

      mutate()
    } catch (e: any) {
      alert(e.message || 'Không thể xoá')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Quản lý categories
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Category Mappings - {siteName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <form className="grid gap-3" onSubmit={onSave}>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Shopee Category Name</label>
              <Input
                placeholder="Ví dụ: Thời trang nữ"
                value={form.sourceName}
                onChange={(e) => setForm((prev) => ({ ...prev, sourceName: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">WooCommerce Category ID</label>
              <Input
                placeholder="Ví dụ: 123"
                value={form.targetId}
                onChange={(e) => setForm((prev) => ({ ...prev, targetId: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">WooCommerce Category Name</label>
              <Input
                placeholder="Ví dụ: Women's Fashion"
                value={form.targetName}
                onChange={(e) => setForm((prev) => ({ ...prev, targetName: e.target.value }))}
              />
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Đang thêm...' : 'Thêm mapping'}
            </Button>
          </form>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">Mappings hiện có</h3>
            {error && (
              <div className="text-sm text-destructive">Không thể tải mappings</div>
            )}
            {mappings && mappings.length === 0 && (
              <div className="text-sm text-muted-foreground">Chưa có mapping nào</div>
            )}
            <div className="space-y-2">
              {mappings?.map((mapping) => (
                <div
                  key={mapping.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{mapping.sourceName}</Badge>
                      <span className="text-muted-foreground">→</span>
                      <Badge>{mapping.targetName}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      ID: {mapping.targetId}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(mapping.id)}
                  >
                    Xoá
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
