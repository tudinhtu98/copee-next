"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import useSWR from "swr";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// Select components temporarily replaced with native <select> to prevent re-render loop
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch("/api/proxy" + url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    try {
      const parsed = JSON.parse(text);
      throw new Error(parsed.message || "Không thể tải dữ liệu");
    } catch {
      throw new Error("Không thể tải dữ liệu");
    }
  }
  return (await res.json()) as T;
};

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
  price: number | null; // Sale price (giá đã giảm)
  originalPrice: number | null; // Regular price (giá gốc)
  description: string | null;
  images?: string[] | null;
  currency?: string | null;
  createdAt: string;
  updatedAt?: string;
};

type Site = {
  id: string;
  name: string;
  baseUrl: string;
};

type ProcessResponse = {
  processed: number;
  success: number;
};

type ProductFormValues = {
  title: string;
  category: string;
  price: string;
  description: string;
};

type ProductCreateFormValues = {
  sourceUrl: string;
  title: string;
  category: string;
  price: string;
  description: string;
  images: string;
};

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const isInitializing = useRef(true);
  const isUpdatingFromURL = useRef(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Initialize from URL params on mount or when URL changes
  useEffect(() => {
    const nextPage = Number(searchParams.get("page")) || 1;
    const nextPerPage =
      Number(searchParams.get("perPage")) ||
      Number(searchParams.get("limit")) ||
      20;
    const nextSearch = searchParams.get("search") || "";
    const nextStatus = searchParams.get("status") || "";
    const nextSortBy = searchParams.get("sortBy") || "createdAt";
    const nextSortOrder =
      (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

    // Check if values actually changed to avoid unnecessary updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (
      page !== nextPage ||
      pageSize !== nextPerPage ||
      search !== nextSearch ||
      status !== nextStatus ||
      sortBy !== nextSortBy ||
      sortOrder !== nextSortOrder
    ) {
      isUpdatingFromURL.current = true;
      setPage(nextPage);
      setPageSize(nextPerPage);
      setSearchInput(nextSearch);
      setSearch(nextSearch);
      setStatus(nextStatus);
      setSortBy(nextSortBy);
      setSortOrder(nextSortOrder);
      // Reset flag after state updates
      setTimeout(() => {
        isUpdatingFromURL.current = false;
      }, 0);
    }
    isInitializing.current = false;
    // Only depend on searchParams to avoid infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Debounce search input: update search state after 300ms
  useEffect(() => {
    // Don't reset page if we're updating from URL
    if (isUpdatingFromURL.current) return;

    const timer = setTimeout(() => {
      setSearch(searchInput);
      // Only reset to page 1 if search actually changed (not from URL)
      if (search !== searchInput) {
        setPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  // Update URL when state changes (but not when initializing from URL)
  useEffect(() => {
    // Skip URL update during initialization or when updating from URL
    if (isInitializing.current || isUpdatingFromURL.current) {
      return;
    }

    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (pageSize !== 20) params.set("perPage", String(pageSize));
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (sortBy !== "createdAt") params.set("sortBy", sortBy);
    if (sortOrder !== "desc") params.set("sortOrder", sortOrder);

    const query = params.toString();
    const newUrl = query ? `${pathname}?${query}` : pathname;

    // Compare with current URL params
    const currentParams = new URLSearchParams(searchParams.toString());
    const currentQuery = currentParams.toString();
    const currentUrl = currentQuery ? `${pathname}?${currentQuery}` : pathname;

    // Only update URL if it's different from current URL
    if (newUrl !== currentUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [
    page,
    pageSize,
    search,
    status,
    sortBy,
    sortOrder,
    pathname,
    router,
    searchParams,
  ]);

  // Create query params with useMemo to prevent re-render loop
  const queryParams = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(pageSize),
      ...(search && { search }),
      ...(status && { status }),
      sortBy,
      sortOrder,
    });
    return params.toString();
  }, [page, pageSize, search, status, sortBy, sortOrder]);

  const {
    data: productsData,
    error,
    isLoading,
    mutate: mutateProducts,
  } = useSWR<{
    items: Product[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(`/products?${queryParams}`, fetcher);

  const { data: sites } = useSWR<Site[]>("/sites", fetcher);

  const products = productsData?.items || [];
  const pagination = productsData?.pagination;

  const [selected, setSelected] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  useEffect(() => {
    const currentProductIds = products.map((p) => p.id);
    setSelected((prev) => prev.filter((id) => currentProductIds.includes(id)));
  }, [productsData?.items]);

  const allSelected = useMemo(() => {
    if (!products || products.length === 0) return false;
    return selected.length === products.length;
  }, [products, selected]);

  const selectedCount = selected.length;

  const toggleSelectAll = () => {
    if (!products) return;
    if (allSelected) {
      setSelected([]);
    } else {
      setSelected(products.map((p) => p.id));
    }
  };

  const toggleProduct = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value); // Update input value immediately
  };

  const handleStatusChange = (value: string) => {
    setStatus(value === "all" ? "" : value);
    setPage(1);
  };

  const handleSortByChange = (value: string) => {
    setSortBy(value);
    setPage(1);
  };

  const handleSortOrderChange = (value: "asc" | "desc") => {
    setSortOrder(value);
    setPage(1);
  };


  async function onProcessUploads() {
    try {
      setIsProcessing(true);
      const res = await fetch("/api/proxy/products/process-uploads", {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ message: "Không thể xử lý" }));
        throw new Error(data.message || "Không thể xử lý uploads");
      }
      const data = (await res.json()) as ProcessResponse;
      toast.success(`Đã xử lý ${data.processed} sản phẩm, thành công ${data.success}`);
      mutateProducts();
    } catch (e: any) {
      toast.error(e.message || "Không thể xử lý uploads");
    } finally {
      setIsProcessing(false);
    }
  }

  async function onDeleteProduct() {
    if (!deletingProduct) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/proxy/products/${deletingProduct.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ message: "Không thể xóa sản phẩm" }));
        throw new Error(data.message || "Không thể xóa sản phẩm");
      }
      toast.success("Đã xóa sản phẩm");
      setDeletingProduct(null);
      mutateProducts();
      // Remove from selected if it was selected
      setSelected((prev) => prev.filter((id) => id !== deletingProduct.id));
    } catch (e: any) {
      toast.error(e.message || "Không thể xóa sản phẩm");
    } finally {
      setIsDeleting(false);
    }
  }

  async function onBulkDelete() {
    if (selected.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một sản phẩm để xóa");
      return;
    }

    try {
      setIsBulkDeleting(true);
      const res = await fetch("/api/proxy/products/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: selected }),
      });
      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ message: "Không thể xóa sản phẩm" }));
        throw new Error(data.message || "Không thể xóa sản phẩm");
      }
      const data = await res.json();
      toast.success(data.message || `Đã xóa ${selected.length} sản phẩm`);
      setSelected([]);
      setShowBulkDeleteConfirm(false);
      mutateProducts();
    } catch (e: any) {
      toast.error(e.message || "Không thể xóa sản phẩm");
    } finally {
      setIsBulkDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
    <h1 className="text-2xl font-semibold">Sản phẩm</h1>
        <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
          Thêm sản phẩm
        </Button>
    </div>
      <p className="text-sm text-muted-foreground">
        Chọn sản phẩm, cấu hình site và tạo job upload lên WooCommerce.
      </p>

      {/* Search and Filter */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Input
          placeholder="Tìm kiếm..."
          value={searchInput}
          onChange={handleSearchChange}
        />
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          value={status || "all"}
          onChange={(e) => handleStatusChange(e.target.value)}
        >
          <option value="all">Tất cả</option>
          <option value="DRAFT">Nháp</option>
          <option value="READY">Sẵn sàng</option>
          <option value="UPLOADED">Đã đăng</option>
          <option value="FAILED">Lỗi</option>
        </select>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          value={sortBy}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            handleSortByChange(e.target.value)
          }
        >
          <option value="createdAt">Ngày tạo</option>
          <option value="title">Tiêu đề</option>
          <option value="price">Giá</option>
          <option value="status">Status</option>
        </select>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          value={sortOrder}
          onChange={(e) =>
            handleSortOrderChange(e.target.value as "asc" | "desc")
          }
        >
          <option value="desc">Giảm dần</option>
          <option value="asc">Tăng dần</option>
        </select>
      </div>

      <div className="flex gap-2 sm:justify-end">
        <Button
          variant="secondary"
          onClick={toggleSelectAll}
          disabled={!products || products.length === 0}
        >
          {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
        </Button>
        <Button
          variant="destructive"
          onClick={() => setShowBulkDeleteConfirm(true)}
          disabled={selected.length === 0}
        >
          Xóa đã chọn ({selected.length})
        </Button>
        <Button
          onClick={() => {
            if (selected.length === 0) {
              toast.warning("Vui lòng chọn ít nhất một sản phẩm");
              return;
            }
            setShowUploadDialog(true);
          }}
          disabled={selected.length === 0}
        >
          Upload ({selected.length})
        </Button>
      </div>

    <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <span className="text-sm text-muted-foreground">
            Đã chọn {selectedCount} sản phẩm
          </span>
        )}
    </div>

      <PaginationControls
        pagination={pagination}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Chọn tất cả"
                />
              </TableHead>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6}>Đang tải...</TableCell>
              </TableRow>
            )}
            {error && (
              <TableRow>
                <TableCell colSpan={6} className="text-destructive">
                  {(error as Error).message || "Lỗi tải dữ liệu"}
                </TableCell>
              </TableRow>
            )}
            {products && products.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={6}>Chưa có sản phẩm</TableCell>
              </TableRow>
            )}
            {products?.map((product) => {
              const status =
                statusDisplay[product.status] ?? statusDisplay.DRAFT;
              return (
                <TableRow
                  key={product.id}
                  data-state={
                    selected.includes(product.id) ? "selected" : undefined
                  }
                >
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(product.id)}
                      onCheckedChange={() => toggleProduct(product.id)}
                      aria-label={`Chọn sản phẩm ${
                        product.title ?? product.sourceUrl
                      }`}
                    />
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="font-medium line-clamp-2">
                      {product.title || "Chưa có tiêu đề"}
    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell>{product.category || "-"}</TableCell>
                  <TableCell>
                    {product.originalPrice != null || product.price != null ? (
                      <div className="flex flex-col gap-0.5">
                        {product.originalPrice != null && product.price != null && product.price < product.originalPrice ? (
                          <>
                            <span className="text-sm text-gray-500 line-through">
                              {new Intl.NumberFormat("vi-VN").format(product.originalPrice)}₫
                            </span>
                            <span className="text-base font-semibold text-red-600">
                              {new Intl.NumberFormat("vi-VN").format(product.price)}₫
                            </span>
                          </>
                        ) : product.price != null ? (
                          <span className="text-base">
                            {new Intl.NumberFormat("vi-VN").format(product.price)}₫
                          </span>
                        ) : product.originalPrice != null ? (
                          <span className="text-base">
                            {new Intl.NumberFormat("vi-VN").format(product.originalPrice)}₫
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingProduct(product)}
                      >
                        Xem chi tiết
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingProduct(product)}
                      >
                        Chỉnh sửa
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeletingProduct(product)}
                      >
                        Xóa
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} /{" "}
            {pagination.total}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-muted-foreground">
              Trang size:
              <select
                className="ml-2 rounded-md border border-input bg-background px-2 py-1 text-sm"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
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
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                }
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((prev) => Math.min(pagination.totalPages, prev + 1))
                }
                disabled={page === pagination.totalPages}
              >
                Sau
              </Button>
            </div>
          </div>
        </div>
      )}

      <ProductEditDialog
        product={editingProduct}
        open={Boolean(editingProduct)}
        onClose={() => setEditingProduct(null)}
        onSaved={() => {
          setEditingProduct(null);
          mutateProducts();
        }}
      />
      <ProductCreateDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreated={() => {
          mutateProducts();
        }}
      />
      <ProductDetailDialog
        product={viewingProduct}
        open={Boolean(viewingProduct)}
        onClose={() => setViewingProduct(null)}
      />
      <DeleteConfirmationDialog
        product={deletingProduct}
        open={Boolean(deletingProduct)}
        onClose={() => setDeletingProduct(null)}
        onConfirm={onDeleteProduct}
        isDeleting={isDeleting}
      />
      <BulkDeleteConfirmationDialog
        open={showBulkDeleteConfirm}
        count={selected.length}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={onBulkDelete}
        isDeleting={isBulkDeleting}
      />
      <UploadDialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        selectedProducts={products.filter((p) => selected.includes(p.id))}
        sites={sites || []}
        onUploadSuccess={() => {
          setShowUploadDialog(false);
          setSelected([]);
          mutateProducts();
        }}
      />
    </div>
  );
}

function ProductDetailDialog({
  product,
  open,
  onClose,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!product) return null;

  const productImages = Array.isArray(product.images) ? product.images : [];
  const status = statusDisplay[product.status] ?? statusDisplay.DRAFT;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiết sản phẩm</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Images */}
          {productImages.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Hình ảnh</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {productImages.map((imgUrl, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-md overflow-hidden border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgUrl}
                      alt={`${product.title || "Sản phẩm"} - ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src =
                          "https://via.placeholder.com/300?text=Image+Error";
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tiêu đề</label>
              <div className="text-sm">
                {product.title || "Chưa có tiêu đề"}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Trạng thái</label>
              <div>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Danh mục</label>
              <div className="text-sm">{product.category || "-"}</div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Giá</label>
              <div className="text-sm">
                {product.originalPrice != null || product.price != null ? (
                  <div className="flex flex-col gap-1">
                    {product.originalPrice != null && product.price != null && product.price < product.originalPrice ? (
                      <>
                        <span className="text-gray-500 line-through">
                          Giá gốc: {new Intl.NumberFormat("vi-VN").format(product.originalPrice)}{product.currency || "₫"}
                        </span>
                        <span className="font-semibold text-red-600">
                          Giá đã giảm: {new Intl.NumberFormat("vi-VN").format(product.price)}{product.currency || "₫"}
                        </span>
                      </>
                    ) : product.price != null ? (
                      <span>
                        {new Intl.NumberFormat("vi-VN").format(product.price)}{product.currency || "₫"}
                      </span>
                    ) : product.originalPrice != null ? (
                      <span>
                        {new Intl.NumberFormat("vi-VN").format(product.originalPrice)}{product.currency || "₫"}
                      </span>
                    ) : null}
                  </div>
                ) : (
                  "-"
                )}
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Link nguồn</label>
              <div className="text-sm">
                <a
                  href={product.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline break-all"
                >
                  {product.sourceUrl}
                </a>
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Mô tả</label>
              <div className="text-sm whitespace-pre-wrap border rounded-md p-3 bg-muted/50 max-h-60 overflow-y-auto">
                {product.description}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Ngày tạo
              </label>
              <div className="text-sm">
                {new Date(product.createdAt).toLocaleString("vi-VN", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
            {product.updatedAt && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Ngày cập nhật
                </label>
                <div className="text-sm">
                  {new Date(product.updatedAt).toLocaleString("vi-VN", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProductEditDialog({
  product,
  open,
  onClose,
  onSaved,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ProductFormValues>({
    defaultValues: {
      title: "",
      category: "",
      price: "",
      description: "",
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        title: product.title ?? "",
        category: product.category ?? "",
        price: product.price != null ? String(product.price) : "",
        description: product.description ?? "",
      });
    }
  }, [product, reset]);

  if (!product) return null;

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload: {
        title?: string;
        category?: string | null;
        price?: number | null;
        description?: string;
      } = {
        title: values.title.trim(),
        description: values.description.trim(),
      };
      const category = values.category.trim();
      payload.category = category ? category : null;
      const priceValue = values.price.trim();
      if (priceValue) {
        const parsed = Number(priceValue);
        if (Number.isNaN(parsed)) {
          toast.error("Giá không hợp lệ");
          return;
        }
        payload.price = parsed;
      } else {
        payload.price = null;
      }

      const res = await fetch(`/api/proxy/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ message: "Không thể cập nhật sản phẩm" }));
        throw new Error(data.message || "Không thể cập nhật sản phẩm");
      }
      toast.success("Đã cập nhật sản phẩm");
      onSaved();
    } catch (e: any) {
      toast.error(e.message || "Không thể cập nhật sản phẩm");
    }
  });

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cập nhật sản phẩm</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Chỉnh sửa thông tin trước khi upload lên WooCommerce.
          </p>
        </DialogHeader>
        <form className="grid gap-3" onSubmit={onSubmit}>
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">Tiêu đề</label>
            <Input placeholder="Tiêu đề sản phẩm" {...register("title")} />
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">Danh mục</label>
            <Input placeholder="Danh mục" {...register("category")} />
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">Giá (VND)</label>
            <Input placeholder="Ví dụ: 199000" {...register("price")} />
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">Mô tả</label>
            <Textarea rows={4} {...register("description")} />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Huỷ
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProductCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ProductCreateFormValues>({
    defaultValues: {
      sourceUrl: "",
      title: "",
      category: "",
      price: "",
      description: "",
      images: "",
    },
  });

  useEffect(() => {
    if (!open) {
      reset({
        sourceUrl: "",
        title: "",
        category: "",
        price: "",
        description: "",
        images: "",
      });
    }
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload: {
        sourceUrl: string;
        title?: string;
        description?: string;
        category?: string;
        price?: number;
        images?: string[];
      } = {
        sourceUrl: values.sourceUrl.trim(),
      };

      if (!payload.sourceUrl) {
        toast.warning("Vui lòng nhập link sản phẩm Shopee");
        return;
      }

      if (values.title.trim()) payload.title = values.title.trim();
      if (values.description.trim())
        payload.description = values.description.trim();
      if (values.category.trim()) payload.category = values.category.trim();
      if (values.images.trim()) {
        payload.images = values.images
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
      }
      if (values.price.trim()) {
        const parsed = Number(values.price);
        if (Number.isNaN(parsed)) {
          toast.error("Giá không hợp lệ");
          return;
        }
        payload.price = parsed;
      }

      const res = await fetch("/api/proxy/products/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ message: "Không thể thêm sản phẩm" }));
        throw new Error(data.message || "Không thể thêm sản phẩm");
      }
      toast.success("Đã thêm sản phẩm từ Shopee");
      onCreated();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Không thể thêm sản phẩm");
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm sản phẩm từ Shopee</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Dán link và thông tin sản phẩm đã copy từ extension.
          </p>
        </DialogHeader>
        <form className="grid gap-3" onSubmit={onSubmit}>
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">Link sản phẩm</label>
            <Input
              placeholder="https://shopee.vn/..."
              {...register("sourceUrl")}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">Tiêu đề</label>
            <Input placeholder="Tiêu đề sản phẩm" {...register("title")} />
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">Danh mục</label>
            <Input placeholder="Danh mục" {...register("category")} />
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">Giá (VND)</label>
            <Input placeholder="Ví dụ: 99000" {...register("price")} />
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">
              Ảnh (mỗi dòng một URL)
            </label>
            <Textarea
              rows={3}
              placeholder="https://..."
              {...register("images")}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm font-medium">Mô tả</label>
            <Textarea rows={4} {...register("description")} />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Huỷ
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : "Thêm sản phẩm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteConfirmationDialog({
  product,
  open,
  onClose,
  onConfirm,
  isDeleting,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận xóa sản phẩm</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn
            tác.
          </p>
        </DialogHeader>
        <div className="py-4">
          <div className="font-medium">
            {product.title || "Chưa có tiêu đề"}
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            Huỷ
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Đang xóa..." : "Xóa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BulkDeleteConfirmationDialog({
  open,
  count,
  onClose,
  onConfirm,
  isDeleting,
}: {
  open: boolean;
  count: number;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận xóa nhiều sản phẩm</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Bạn có chắc chắn muốn xóa {count} sản phẩm đã chọn? Hành động này
            không thể hoàn tác.
          </p>
        </DialogHeader>
        <div className="py-4">
          <div className="text-sm">
            Số lượng sản phẩm sẽ bị xóa:{" "}
            <span className="font-semibold">{count}</span>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            Huỷ
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Đang xóa..." : `Xóa ${count} sản phẩm`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UploadDialog({
  open,
  onClose,
  selectedProducts,
  sites,
  onUploadSuccess,
}: {
  open: boolean;
  onClose: () => void;
  selectedProducts: Product[];
  sites: Site[];
  onUploadSuccess: () => void;
}) {
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [categories, setCategories] = useState<WooCommerceCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [productCategories, setProductCategories] = useState<
    Record<string, string>
  >({});
  const [newCategoryName, setNewCategoryName] = useState<Record<string, string>>(
    {}
  );
  const [isCreatingCategory, setIsCreatingCategory] = useState<
    Record<string, boolean>
  >({});
  const [isUploading, setIsUploading] = useState(false);

  // Auto-select first site when dialog opens and sites are available
  useEffect(() => {
    if (open && sites.length > 0 && !selectedSiteId) {
      setSelectedSiteId(sites[0].id);
    }
  }, [open, sites, selectedSiteId]);

  type WooCommerceCategory = {
    id: string;
    wooId: string;
    name: string;
    slug: string | null;
    parentId: string | null;
    count: number;
    syncedAt: string;
  };

  const loadCategories = useCallback(async () => {
    if (!selectedSiteId) return;
    try {
      setIsLoadingCategories(true);
      const res = await fetch(`/api/proxy/sites/${selectedSiteId}/categories`);
      if (!res.ok) throw new Error("Failed to load categories");
      const data = await res.json();
      setCategories(data);
    } catch (error: any) {
      toast.error(error.message || "Không thể tải categories");
    } finally {
      setIsLoadingCategories(false);
    }
  }, [selectedSiteId]);

  // Load categories when site is selected
  useEffect(() => {
    if (selectedSiteId && open) {
      loadCategories();
    } else {
      setCategories([]);
    }
  }, [selectedSiteId, open, loadCategories]);

  // Auto-match product categories with WooCommerce categories
  useEffect(() => {
    if (categories.length > 0 && selectedProducts.length > 0) {
      const autoMatched: Record<string, string> = {};
      
      selectedProducts.forEach((product) => {
        if (!product.category) return;
        
        const productCatLower = product.category.toLowerCase().trim();
        
        // First, try exact match (highest priority)
        let matchedCategory = categories.find((wcCat) => {
          const wcNameLower = wcCat.name.toLowerCase().trim();
          const wcSlugLower = (wcCat.slug || "").toLowerCase().trim();
          return (
            productCatLower === wcNameLower ||
            productCatLower === wcSlugLower
          );
        });
        
        // If no exact match, try partial match
        if (!matchedCategory) {
          matchedCategory = categories.find((wcCat) => {
            const wcNameLower = wcCat.name.toLowerCase().trim();
            const wcSlugLower = (wcCat.slug || "").toLowerCase().trim();
            return (
              productCatLower.includes(wcNameLower) ||
              wcNameLower.includes(productCatLower) ||
              (wcSlugLower && productCatLower.includes(wcSlugLower)) ||
              (wcSlugLower && wcSlugLower.includes(productCatLower))
            );
          });
        }
        
        if (matchedCategory) {
          autoMatched[product.id] = matchedCategory.wooId;
        }
      });
      
      // Only update if there are matches and not already set
      if (Object.keys(autoMatched).length > 0) {
        setProductCategories((prev) => {
          const updated = { ...prev };
          Object.keys(autoMatched).forEach((productId) => {
            // Only auto-set if not already manually selected
            if (!updated[productId]) {
              updated[productId] = autoMatched[productId];
            }
          });
          return updated;
        });
      }
    }
  }, [categories, selectedProducts]);

  // Initialize newCategoryName with Shopee categories when dialog opens
  useEffect(() => {
    if (open && selectedProducts.length > 0) {
      const initialCategories: Record<string, string> = {};
      selectedProducts.forEach((product) => {
        // Pre-fill with Shopee category if available
        if (product.category) {
          initialCategories[product.id] = product.category;
        }
      });
      if (Object.keys(initialCategories).length > 0) {
        setNewCategoryName((prev) => {
          // Only set if not already set (don't overwrite user input)
          const updated = { ...prev };
          Object.keys(initialCategories).forEach((productId) => {
            if (!updated[productId]) {
              updated[productId] = initialCategories[productId];
            }
          });
          return updated;
        });
      }
    }
    // Reset when dialog closes
    if (!open) {
      setNewCategoryName({});
      setProductCategories({});
    }
  }, [open, selectedProducts]);

  async function syncCategories() {
    if (!selectedSiteId) {
      toast.warning("Vui lòng chọn site trước");
      return;
    }
    try {
      setIsSyncing(true);
      const res = await fetch(
        `/api/proxy/sites/${selectedSiteId}/categories/sync`,
        { method: "POST" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Lỗi sync" }));
        throw new Error(data.message || "Lỗi sync");
      }
      const data = await res.json();
      toast.success(data.message || `Đã sync ${data.count} categories`);
      loadCategories();
    } catch (e: any) {
      toast.error(e.message || "Lỗi sync categories");
    } finally {
      setIsSyncing(false);
    }
  }

  async function createCategory(productId: string) {
    if (!selectedSiteId) {
      toast.warning("Vui lòng chọn site trước");
      return;
    }
    const categoryName = newCategoryName[productId]?.trim();
    if (!categoryName) {
      toast.warning("Vui lòng nhập tên category");
      return;
    }

    try {
      setIsCreatingCategory((prev) => ({ ...prev, [productId]: true }));
      const res = await fetch(`/api/proxy/sites/${selectedSiteId}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({
          message: "Lỗi tạo category",
        }));
        throw new Error(data.message || "Lỗi tạo category");
      }
      const newCategory = await res.json();
      setCategories((prev) => [...prev, newCategory]);
      setProductCategories((prev) => ({
        ...prev,
        [productId]: newCategory.wooId,
      }));
      setNewCategoryName((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      toast.success("Đã tạo category thành công");
    } catch (e: any) {
      toast.error(e.message || "Lỗi tạo category");
    } finally {
      setIsCreatingCategory((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
    }
  }

  async function handleUpload() {
    if (!selectedSiteId) {
      toast.warning("Vui lòng chọn site đích");
      return;
    }

    // Check if all products have categories selected
    const productsWithoutCategory = selectedProducts.filter(
      (p) => !productCategories[p.id]
    );
    if (productsWithoutCategory.length > 0) {
      toast.warning(
        `Vui lòng chọn category cho tất cả sản phẩm. Còn ${productsWithoutCategory.length} sản phẩm chưa có category.`
      );
      return;
    }

    try {
      setIsUploading(true);
      // Create upload jobs for each product with its category
      const uploadPromises = selectedProducts.map((product) => {
        const categoryId = productCategories[product.id];
        // targetCategory must always be ID (wooId), never name
        if (!categoryId) {
          throw new Error(`Sản phẩm "${product.title}" chưa có category được chọn`);
        }

        return fetch("/api/proxy/products/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productIds: [product.id],
            siteId: selectedSiteId,
            targetCategory: categoryId, // Always ID
          }),
        });
      });

      const results = await Promise.all(uploadPromises);
      const errors = results.filter((r) => !r.ok);
      if (errors.length > 0) {
        throw new Error(
          `Có ${errors.length} sản phẩm không thể tạo job upload`
        );
      }

      const successCount = results.length;
      toast.success(`Đã tạo ${successCount} job upload thành công. Vui lòng vào trang Xử lý Upload để upload sản phẩm lên WordPress.`);
      onUploadSuccess();
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi upload");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload sản phẩm lên WooCommerce</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Chọn site đích và category cho từng sản phẩm
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Site Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Chọn trang đích</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
            >
              <option value="">Chọn site...</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
            {selectedSiteId && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={syncCategories}
                  disabled={isSyncing}
                >
                  {isSyncing ? "Đang sync..." : "Sync Categories"}
                </Button>
                {isLoadingCategories && (
                  <span className="text-sm text-muted-foreground">
                    Đang tải categories...
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Products List */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Danh sách sản phẩm ({selectedProducts.length})
            </label>
            <div className="border rounded-md divide-y max-h-96 overflow-y-auto">
              {selectedProducts.map((product) => (
                <div key={product.id} className="p-4 space-y-3">
                  <div className="font-medium line-clamp-2">
                    {product.title || "Chưa có tiêu đề"}
                  </div>
                  <div className="flex gap-2 items-center">
                    <label className="text-sm text-muted-foreground min-w-[100px]">
                      Category:
                    </label>
                    <select
                      className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm"
                      value={productCategories[product.id] || ""}
                      onChange={(e) =>
                        setProductCategories((prev) => ({
                          ...prev,
                          [product.id]: e.target.value,
                        }))
                      }
                      disabled={!selectedSiteId}
                    >
                      <option value="">Chọn category...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.wooId}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 items-center">
                    <label className="text-sm text-muted-foreground min-w-[100px]">
                      Hoặc tạo mới:
                    </label>
                    <div className="flex-1 space-y-1">
                      <Input
                        placeholder={
                          product.category
                            ? `Gợi ý: ${product.category} (từ Shopee)`
                            : "Tên category mới"
                        }
                        value={newCategoryName[product.id] || ""}
                        onChange={(e) =>
                          setNewCategoryName((prev) => ({
                            ...prev,
                            [product.id]: e.target.value,
                          }))
                        }
                        disabled={!selectedSiteId || isCreatingCategory[product.id]}
                      />
                      {product.category && 
                       !newCategoryName[product.id] && 
                       !productCategories[product.id] && (
                        <button
                          type="button"
                          onClick={() =>
                            setNewCategoryName((prev) => ({
                              ...prev,
                              [product.id]: product.category || "",
                            }))
                          }
                          className="text-xs text-primary hover:underline"
                        >
                          Dùng category từ Shopee: {product.category}
                        </button>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => createCategory(product.id)}
                      disabled={
                        !selectedSiteId ||
                        !newCategoryName[product.id]?.trim() ||
                        isCreatingCategory[product.id]
                      }
                    >
                      {isCreatingCategory[product.id]
                        ? "Đang tạo..."
                        : "Tạo"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={isUploading}>
            Huỷ
          </Button>
          <Button onClick={handleUpload} disabled={isUploading || !selectedSiteId}>
            {isUploading ? "Đang upload..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PaginationControls({
  pagination,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  if (!pagination) return null;

  const totalPages = pagination.totalPages;

  const getPageNumbers = () => {
    const visible = Math.min(5, totalPages);
    const pages: number[] = [];
    for (let i = 0; i < visible; i++) {
      let pageNum: number;
      if (totalPages <= 5) {
        pageNum = i + 1;
      } else if (page <= 3) {
        pageNum = i + 1;
      } else if (page >= totalPages - 2) {
        pageNum = totalPages - 4 + i;
      } else {
        pageNum = page - 2 + i;
      }
      pages.push(pageNum);
    }
    return pages;
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{" "}
        {Math.min(pagination.page * pagination.limit, pagination.total)} /{" "}
        {pagination.total}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm text-muted-foreground">
          Trang size:
          <select
            className="ml-2 rounded-md border border-input bg-background px-2 py-1 text-sm"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {[10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Trước
          </Button>
          {getPageNumbers().map((pageNum) => (
            <Button
              key={pageNum}
              variant={page === pageNum ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}
