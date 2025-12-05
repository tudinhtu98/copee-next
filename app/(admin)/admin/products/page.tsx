"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetcher } from "@/src/lib/fetcher";
import { ExternalLinkIcon } from "lucide-react";

const statusDisplay: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  DRAFT: { label: "Nháp", variant: "outline" },
  READY: { label: "Sẵn sàng", variant: "secondary" },
  UPLOADED: { label: "Đã đăng", variant: "default" },
  FAILED: { label: "Lỗi", variant: "destructive" },
};

type Product = {
  id: string;
  title: string | null;
  sourceUrl: string;
  status: keyof typeof statusDisplay;
  category: string | null;
  price: number | null;
  originalPrice: number | null;
  createdAt: string;
  user?: {
    email: string;
    username: string | null;
  };
};

type ProductsResponse = {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export default function AdminProducts() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const search = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status") || "";
  const categoryFilter = searchParams.get("category") || "";
  const userIdFilter = searchParams.get("userId") || "";
  const [searchInput, setSearchInput] = useState(search);

  // Fetch users and categories for filters
  const { data: usersData } = useSWR<{ users: Array<{ id: string; email: string; username: string | null }> }>(
    "/admin/users?limit=1000",
    fetcher
  );
  const users = usersData?.users || [];

  const { data: categoriesData } = useSWR<{ categories: Array<{ category: string }> }>(
    "/admin/categories?limit=1000",
    fetcher
  );
  const categories = categoriesData?.categories || [];

  // Create query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
      ...(search && { search }),
      ...(statusFilter && { status: statusFilter }),
      ...(categoryFilter && { category: categoryFilter }),
      ...(userIdFilter && { userId: userIdFilter }),
    });
    return params.toString();
  }, [page, search, statusFilter, categoryFilter, userIdFilter]);

  const { data, error, isLoading } = useSWR<ProductsResponse>(
    `/admin/products?${queryParams}`,
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

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const products = data?.products || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Quản lý sản phẩm</h1>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
        <Input
          placeholder="Tìm kiếm theo tên, mô tả, danh mục..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={statusFilter || undefined}
          onValueChange={(value) => handleFilterChange("status", value === "all" ? "" : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Lọc theo trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {Object.entries(statusDisplay).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={categoryFilter || undefined}
          onValueChange={(value) => handleFilterChange("category", value === "all" ? "" : value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Lọc theo danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.category} value={cat.category}>
                {cat.category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={userIdFilter || undefined}
          onValueChange={(value) => handleFilterChange("userId", value === "all" ? "" : value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Lọc theo user" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả users</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {(error as Error).message || "Không thể tải danh sách sản phẩm"}
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
                  <TableHead>Tên sản phẩm</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Link gốc</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Không có sản phẩm nào
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium max-w-md">
                        <div className="line-clamp-2">{product.title || "Sản phẩm"}</div>
                      </TableCell>
                      <TableCell>
                        {product.category ? (
                          <Badge variant="outline">{product.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusDisplay[product.status]?.variant || "outline"}>
                          {statusDisplay[product.status]?.label || product.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {product.price ? (
                          <div>
                            <div className="font-semibold">
                              {new Intl.NumberFormat("vi-VN").format(product.price)}₫
                            </div>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <div className="text-sm text-muted-foreground line-through">
                                {new Intl.NumberFormat("vi-VN").format(product.originalPrice)}₫
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.user ? (
                          <div>
                            <div className="font-medium">{product.user.email}</div>
                            {product.user.username && (
                              <div className="text-sm text-muted-foreground">{product.user.username}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.sourceUrl ? (
                          <a
                            href={product.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                          >
                            Xem link
                            <ExternalLinkIcon className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(product.createdAt).toLocaleDateString("vi-VN")}
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

