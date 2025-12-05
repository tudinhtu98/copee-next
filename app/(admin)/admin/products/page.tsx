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
import { cn } from "@/lib/utils";
import { ExternalLinkIcon, SearchIcon, CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

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

  const handleClearFilters = () => {
    setSearchInput("");
    setCategorySearch("");
    setCategoryOpen(false);
    // Reset all filters by navigating to clean URL
    router.replace(pathname);
  };

  const hasActiveFilters = search || statusFilter || categoryFilter || userIdFilter;

  const products = data?.products || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Quản lý sản phẩm</h1>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="group relative max-w-sm">
          <Input
            placeholder="Tìm kiếm theo tên, mô tả, danh mục..."
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
        <Select
          key={`status-${statusFilter || "none"}`}
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
        <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-[200px] justify-between"
            >
              <span className="truncate flex-1 text-left">
                {categoryFilter
                  ? categories.find((cat) => cat.category === categoryFilter)?.category || "Chọn danh mục"
                  : "Lọc theo danh mục"}
              </span>
              <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <div className="flex items-center border-b px-3">
              <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Input
                placeholder="Tìm danh mục..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="border-0 focus-visible:ring-0"
              />
            </div>
            <div className="max-h-[300px] overflow-auto p-1">
              <div
                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  handleFilterChange("category", "");
                  setCategoryOpen(false);
                  setCategorySearch("");
                }}
              >
                <CheckIcon
                  className={cn(
                    "mr-2 h-4 w-4",
                    !categoryFilter ? "opacity-100" : "opacity-0"
                  )}
                />
                Tất cả danh mục
              </div>
              {categories
                .filter((cat) => {
                  if (!categorySearch) return true;
                  const searchLower = categorySearch.toLowerCase();
                  const catLower = cat.category.toLowerCase();
                  // Simple Vietnamese diacritics removal for client-side search
                  const removeDiacritics = (str: string) => {
                    return str
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .toLowerCase();
                  };
                  return (
                    catLower.includes(searchLower) ||
                    removeDiacritics(cat.category).includes(removeDiacritics(categorySearch))
                  );
                })
                .map((cat) => (
                  <div
                    key={cat.category}
                    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
                      handleFilterChange("category", cat.category);
                      setCategoryOpen(false);
                      setCategorySearch("");
                    }}
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 h-4 w-4",
                        categoryFilter === cat.category ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {cat.category}
                  </div>
                ))}
              {categories.filter((cat) =>
                categorySearch
                  ? cat.category.toLowerCase().includes(categorySearch.toLowerCase())
                  : true
              ).length === 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Không tìm thấy danh mục
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
        <Select
          key={`user-${userIdFilter || "none"}`}
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
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={handleClearFilters}
            className="whitespace-nowrap border-destructive text-destructive hover:bg-destructive/10"
          >
            <XIcon className="mr-2 h-4 w-4" />
            Bỏ lọc
          </Button>
        )}
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
                          <Badge
                            variant="outline"
                            className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFilterChange("category", product.category || "");
                            }}
                          >
                            {product.category}
                          </Badge>
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

