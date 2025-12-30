"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from "react";
import useSWR from "swr";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetcher } from "@/src/lib/fetcher";
import { XIcon } from "lucide-react";

type Category = {
  category: string;
  count: number;
};

type CategoriesResponse = {
  categories: Category[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export default function AdminCategories() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const search = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(search);

  // Create query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
      ...(search && { search }),
    });
    return params.toString();
  }, [page, search]);

  const { data, error, isLoading } = useSWR<CategoriesResponse>(
    `/admin/categories?${queryParams}`,
    fetcher
  );

  // Update search in URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchInput) {
        params.set("search", searchInput);
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, router, pathname, searchParams]);

  // Sync searchInput with URL search param
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const categories = data?.categories || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Quản lý danh mục</h1>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="group relative max-w-sm">
          <Input
            placeholder="Tìm kiếm theo tên danh mục..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput.trim() && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-muted p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted/80 hover:text-foreground group-hover:opacity-100"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {(error as Error).message || "Không thể tải danh sách danh mục"}
        </div>
      )}

      {isLoading && (
        <div className="text-sm text-muted-foreground">Đang tải...</div>
      )}

      {data && (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Danh mục</TableHead>
                  <TableHead className="text-right">Số sản phẩm</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                      Không có danh mục nào
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category, index) => (
                    <TableRow key={category.category || index}>
                      <TableCell className="font-medium">{category.category}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="default">{category.count} sản phẩm</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} /{" "}
                {pagination.total}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("page", String(Math.max(1, page - 1)));
                    router.push(`${pathname}?${params.toString()}`);
                  }}
                  disabled={page === 1}
                >
                  Trước
                </Button>
                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const params = new URLSearchParams(searchParams.toString());
                          params.set("page", String(pageNum));
                          router.push(`${pathname}?${params.toString()}`);
                        }}
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("page", String(Math.min(pagination.totalPages, page + 1)));
                    router.push(`${pathname}?${params.toString()}`);
                  }}
                  disabled={page === pagination.totalPages}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

