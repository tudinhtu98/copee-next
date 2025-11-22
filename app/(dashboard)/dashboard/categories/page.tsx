"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import useSWR from 'swr'
import { CategoryMappingsDialog } from '@/components/category-mappings-dialog'

import { fetcher } from '@/src/lib/fetcher'

type Site = {
  id: string
  name: string
  baseUrl: string
}

type WooCommerceCategory = {
  id: string
  wooId: string
  name: string
  slug: string | null
  parentId: string | null
  count: number
  syncedAt: string
}

export default function CategoriesPage() {
  const [selectedSiteId, setSelectedSiteId] = useState<string>('')
  const [isSyncing, setIsSyncing] = useState(false)

  const { data: sites } = useSWR<Site[]>('/sites', fetcher)

  // Auto-select first site when sites are loaded
  useEffect(() => {
    if (sites && sites.length > 0 && !selectedSiteId) {
      setSelectedSiteId(sites[0].id)
    }
  }, [sites, selectedSiteId])

  const { data: categories, mutate: mutateCategories } = useSWR<WooCommerceCategory[]>(
    selectedSiteId ? `/sites/${selectedSiteId}/categories` : null,
    fetcher
  )

  const selectedSite = sites?.find((s) => s.id === selectedSiteId)

  async function onSyncCategories() {
    if (!selectedSiteId) {
      toast.warning('Vui lòng chọn site trước')
      return
    }

    try {
      setIsSyncing(true)
      const res = await fetch(`/api/proxy/sites/${selectedSiteId}/categories/sync`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: 'Lỗi sync' }))
        throw new Error(data.message || 'Lỗi sync')
      }

      const data = await res.json()
      toast.success(data.message || `Đã sync ${data.count} categories`)
      mutateCategories()
    } catch (e: any) {
      toast.error(e.message || 'Lỗi sync categories')
    } finally {
      setIsSyncing(false)
    }
  }

  // Build category tree for hierarchical display
  const categoryMap = new Map<string, WooCommerceCategory>()
  const rootCategories: WooCommerceCategory[] = []

  categories?.forEach((cat) => {
    categoryMap.set(cat.wooId, cat)
  })

  categories?.forEach((cat) => {
    if (!cat.parentId) {
      rootCategories.push(cat)
    }
  })

  function getCategoryPath(category: WooCommerceCategory): string {
    const path: string[] = [category.name]
    let current = category

    while (current.parentId) {
      const parent = categoryMap.get(current.parentId)
      if (parent) {
        path.unshift(parent.name)
        current = parent
      } else {
        break
      }
    }

    return path.join(' > ')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Quản lý Categories</h1>
          <p className="text-sm text-muted-foreground">
            Sync và quản lý categories từ WooCommerce
          </p>
        </div>
        {selectedSite && (
          <CategoryMappingsDialog siteId={selectedSiteId} siteName={selectedSite.name} />
        )}
      </div>

      {/* Site Selection */}
      <div className="flex gap-3 items-end">
        <div className="flex-1 max-w-md">
          <label className="text-sm font-medium mb-1 block">Chọn Site</label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
          >
            <option value="">-- Chọn site --</option>
            {sites?.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </div>
        {selectedSiteId && (
          <Button onClick={onSyncCategories} disabled={isSyncing} variant="outline">
            {isSyncing ? 'Đang sync...' : 'Sync Categories'}
          </Button>
        )}
      </div>

      {/* Categories List */}
      {selectedSiteId && (
        <div className="rounded-md border">
          <div className="p-4 border-b bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Categories - {selectedSite?.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {categories ? `${categories.length} categories` : 'Đang tải...'}
                </p>
              </div>
              {categories && categories.length > 0 && (
                <Badge variant="secondary">
                  Last sync: {new Date(categories[0]?.syncedAt).toLocaleString('vi-VN')}
                </Badge>
              )}
            </div>
          </div>

          {!categories ? (
            <div className="p-8 text-center text-muted-foreground">
              Đang tải categories...
            </div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>Chưa có categories nào.</p>
              <p className="text-sm mt-2">Click "Sync Categories" để tải từ WooCommerce</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead className="text-right">Số sản phẩm</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-mono text-sm">{category.wooId}</TableCell>
                    <TableCell>
                      <div className="font-medium">{category.name}</div>
                      {category.parentId && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {getCategoryPath(category)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {category.slug || '-'}
                      </code>
                    </TableCell>
                    <TableCell>
                      {category.parentId ? (
                        <span className="text-sm text-muted-foreground">
                          {categoryMap.get(category.parentId)?.name || category.parentId}
                        </span>
                      ) : (
                        <Badge variant="outline">Root</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{category.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {!selectedSiteId && (
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          <p>Vui lòng chọn một site để xem categories</p>
        </div>
      )}
    </div>
  )
}

