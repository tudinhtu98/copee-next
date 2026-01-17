"use client";

export const dynamic = 'force-dynamic';

import { useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import useSWR from "swr";

type UploadJob = {
  id: string;
  status: string;
  targetCategory: string | null;
  targetCategoryName?: string | null; // Category name for display
  createdAt: string;
  updatedAt: string;
  retryCount: number;
  lastRetryAt: string | null;
  result: { error?: string; [key: string]: unknown } | null; // JSON field containing error or success data
  product: {
    id: string;
    title: string;
    price: number | null; // Sale price (giá đã giảm)
    originalPrice: number | null; // Regular price (giá gốc)
    currency: string | null;
    errorMessage: string | null;
  };
  site: {
    id: string;
    name: string;
    url: string;
  };
};

type UploadJobsResponse = {
  items: UploadJob[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type Site = {
  id: string;
  name: string;
  baseUrl: string;
};

import { fetcher } from '@/src/lib/fetcher';

export default function UploadJobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'process' | 'cancel';
    jobCount: number;
    estimatedCost: number;
    jobIds?: string[];
  }>({
    open: false,
    type: 'process',
    jobCount: 0,
    estimatedCost: 0,
  });

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("perPage") || "20");
  const status = searchParams.get("status") || "";
  const siteId = searchParams.get("siteId") || "";

  const { data, error, isLoading, mutate } = useSWR<UploadJobsResponse>(
    `/products/upload-jobs?page=${page}&limit=${limit}${status ? `&status=${status}` : ""}${siteId ? `&siteId=${siteId}` : ""}`,
    fetcher,
    {
      refreshInterval: 5000, // Auto-refresh every 5 seconds
    }
  );

  const jobs = data?.items || [];
  const pagination = data?.pagination;

  const handleSelectJob = useCallback((jobId: string, checked: boolean) => {
    setSelectedJobs((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(jobId);
      } else {
        next.delete(jobId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    // Select both PENDING and FAILED jobs
    const selectableJobs = jobs.filter((job) => job.status === "PENDING" || job.status === "FAILED");
    if (checked) {
      setSelectedJobs(new Set(selectableJobs.map((job) => job.id)));
    } else {
      setSelectedJobs(new Set());
    }
  }, [jobs]);

  const handleProcessSelected = useCallback(async () => {
    const jobIds = selectedJobs.size > 0 ? Array.from(selectedJobs) : undefined;

    // Calculate number of jobs to process and estimated cost
    let jobCount = 0;
    if (jobIds && jobIds.length > 0) {
      jobCount = jobIds.length;
    } else {
      // Count PENDING and FAILED jobs
      jobCount = jobs.filter((job) => job.status === "PENDING" || job.status === "FAILED").length;
    }

    const estimatedCost = jobCount * 1000; // 1000 VND per successful upload

    // Show confirmation dialog
    setConfirmDialog({
      open: true,
      type: 'process',
      jobCount,
      estimatedCost,
      jobIds,
    });
  }, [selectedJobs, jobs]);

  const handleConfirmProcess = useCallback(async () => {
    const jobIds = confirmDialog.jobIds;

    // Close dialog
    setConfirmDialog({ open: false, type: 'process', jobCount: 0, estimatedCost: 0 });

    try {
      setIsProcessing(true);

      // If no jobs selected, process all pending jobs (loop until done)
      if (!jobIds || jobIds.length === 0) {
        let totalProcessed = 0;
        let totalSuccess = 0;
        let hasMore = true;
        const maxIterations = 100; // Safety limit
        let iterations = 0;

        while (hasMore && iterations < maxIterations) {
          const res = await fetch("/api/proxy/products/process-uploads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}), // No jobIds = process all pending
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({
              message: "Lỗi xử lý upload",
            }));
            throw new Error(errorData.message || "Lỗi xử lý upload");
          }

          const result = await res.json();
          const processedCount = result.processed || result.queued || 0;
          const successCount = result.success || 0;

          totalProcessed += processedCount;
          totalSuccess += successCount;
          hasMore = processedCount > 0;
          iterations++;
        }

        toast.success(
          `Đã xử lý ${totalProcessed} job (${totalSuccess} thành công)`
        );
      } else {
        // Process selected jobs
        const res = await fetch("/api/proxy/products/process-uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobIds }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({
            message: "Lỗi xử lý upload",
          }));
          throw new Error(errorData.message || "Lỗi xử lý upload");
        }

        const result = await res.json();
        toast.success(
          `Đã thêm ${result.processed || result.queued || 0} job vào queue để xử lý song song`
        );
      }

      setSelectedJobs(new Set());
      mutate(); // Refresh data
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi xử lý upload");
    } finally {
      setIsProcessing(false);
    }
  }, [confirmDialog.jobIds, mutate]);

  const handleCancelSelected = useCallback(async () => {
    const jobIds = selectedJobs.size > 0 ? Array.from(selectedJobs) : undefined;

    // Show confirmation dialog
    setConfirmDialog({
      open: true,
      type: 'cancel',
      jobCount: jobIds ? jobIds.length : jobs.filter((job) => job.status === "FAILED").length,
      estimatedCost: 0,
      jobIds,
    });
  }, [selectedJobs, jobs]);

  const handleConfirmCancel = useCallback(async () => {
    const jobIds = confirmDialog.jobIds;

    // Close dialog
    setConfirmDialog({ open: false, type: 'cancel', jobCount: 0, estimatedCost: 0 });

    try {
      setIsCancelling(true);
      const res = await fetch("/api/proxy/products/cancel-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobIds ? { jobIds } : {}), // No jobIds = cancel all FAILED
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({
          message: "Lỗi hủy job",
        }));
        throw new Error(errorData.message || "Lỗi hủy job");
      }

      const result = await res.json();
      toast.success(`Đã hủy ${result.cancelled || 0} job`);
      setSelectedJobs(new Set());
      mutate(); // Refresh data
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi hủy job");
    } finally {
      setIsCancelling(false);
    }
  }, [confirmDialog.jobIds, mutate]);

  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newStatus = e.target.value;
      const params = new URLSearchParams(searchParams.toString());
      if (newStatus) {
        params.set("status", newStatus);
      } else {
        params.delete("status");
      }
      params.set("page", "1");
      router.push(`/dashboard/upload-jobs?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSiteChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newSiteId = e.target.value;
      const params = new URLSearchParams(searchParams.toString());
      if (newSiteId) {
        params.set("siteId", newSiteId);
      } else {
        params.delete("siteId");
      }
      params.set("page", "1");
      router.push(`/dashboard/upload-jobs?${params.toString()}`);
    },
    [router, searchParams]
  );

  const statusDisplay: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Đang chờ", color: "bg-yellow-100 text-yellow-800" },
    SUCCESS: { label: "Thành công", color: "bg-green-100 text-green-800" },
    FAILED: { label: "Thất bại", color: "bg-red-100 text-red-800" },
    CANCELLED: { label: "Đã hủy", color: "bg-gray-100 text-gray-800" },
    PROCESSING: { label: "Đang xử lý", color: "bg-blue-100 text-blue-800" },
  };

  const getStatusBadge = (status: string) => {
    const display = statusDisplay[status] || { label: status, color: "bg-gray-100 text-gray-800" };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${display.color}`}>
        {display.label}
      </span>
    );
  };

  const allSelected = useMemo(() => {
    // Check if all PENDING and FAILED jobs are selected
    const selectableJobs = jobs.filter((job) => job.status === "PENDING" || job.status === "FAILED");
    return selectableJobs.length > 0 && selectableJobs.every((job) => selectedJobs.has(job.id));
  }, [jobs, selectedJobs]);


  // Fetch sites for filter
  const { data: sitesData } = useSWR<Site[]>("/sites", fetcher);
  const sites = sitesData || [];

  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Xử lý Upload</h1>
        <div className="flex gap-2">
          <Button
            onClick={handleCancelSelected}
            disabled={isCancelling || isProcessing}
            variant="destructive"
            className="shrink-0"
          >
            {isCancelling 
              ? "Đang hủy..." 
              : selectedJobs.size > 0 
                ? `Hủy ${selectedJobs.size} job đã chọn`
                : "Hủy job"}
          </Button>
          <Button
            onClick={handleProcessSelected}
            disabled={isProcessing || isCancelling}
            className="bg-blue-600 hover:bg-blue-700 shrink-0"
          >
            {isProcessing 
              ? "Đang xử lý..." 
              : selectedJobs.size > 0
                ? `Xử lý ${selectedJobs.size} job đã chọn`
                : "Xử lý tất cả Đang chờ/Thất bại"}
          </Button>
        </div>
      </div>

      <div className="flex gap-4 items-center flex-wrap">
        <div>
          <label className="text-sm font-medium mr-2">Trạng thái:</label>
          <select
            value={status}
            onChange={handleStatusChange}
            className="border rounded px-2 py-1"
          >
            <option value="">Tất cả</option>
            <option value="PENDING">Đang chờ</option>
            <option value="SUCCESS">Thành công</option>
            <option value="FAILED">Thất bại</option>
            <option value="CANCELLED">Đã hủy</option>
            <option value="PROCESSING">Đang xử lý</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium mr-2">Site:</label>
          <select
            value={siteId}
            onChange={handleSiteChange}
            className="border rounded px-2 py-1 min-w-[200px]"
          >
            <option value="">Tất cả</option>
            {sites.map((site: any) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div>Đang tải...</div>
      ) : error ? (
        <div className="text-red-600">Lỗi: {String(error)}</div>
      ) : jobs.length === 0 ? (
        <div>Không có job nào</div>
      ) : (
        <>
          <div className="border rounded w-full overflow-x-auto">
            <Table className="w-full min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) =>
                        handleSelectAll(checked === true)
                      }
                    />
                  </TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Retry</TableHead>
                  <TableHead>Kết quả</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Cập nhật</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedJobs.has(job.id)}
                        onCheckedChange={(checked) =>
                          handleSelectJob(job.id, checked === true)
                        }
                        disabled={job.status === "SUCCESS" || job.status === "CANCELLED"}
                      />
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="truncate">
                        <div className="font-medium truncate" title={job.product.title}>
                          {job.product.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {job.product.originalPrice != null || job.product.price != null ? (
                            <div className="flex flex-col gap-0.5">
                              {job.product.originalPrice != null && job.product.price != null && job.product.price < job.product.originalPrice ? (
                                <>
                                  <span className="line-through text-gray-400">
                                    {job.product.originalPrice.toLocaleString()} {job.product.currency || "VND"}
                                  </span>
                                  <span className="text-red-600 font-semibold">
                                    {job.product.price.toLocaleString()} {job.product.currency || "VND"}
                                  </span>
                                </>
                              ) : job.product.price != null ? (
                                <span>{job.product.price.toLocaleString()} {job.product.currency || "VND"}</span>
                              ) : job.product.originalPrice != null ? (
                                <span>{job.product.originalPrice.toLocaleString()} {job.product.currency || "VND"}</span>
                              ) : null}
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[180px]">
                      <div className="text-sm">
                        <div className="font-medium truncate" title={job.site.name}>
                          {job.site.name}
                        </div>
                        <div className="text-gray-500 truncate" title={job.site.url}>
                          {job.site.url}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[150px]">
                      <div className="truncate" title={job.targetCategoryName || job.targetCategory || "N/A"}>
                        {job.targetCategoryName || job.targetCategory || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {getStatusBadge(job.status)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {job.retryCount > 0 ? (
                        <div>
                          <div>{job.retryCount}/3</div>
                          {job.lastRetryAt && (
                            <div className="text-gray-500 text-xs">
                              {new Date(job.lastRetryAt).toLocaleDateString("vi-VN")}
                            </div>
                          )}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="max-w-[250px]">
                      {(() => {
                        // Only show error if job status is FAILED or has error in result
                        // Don't use product.errorMessage as it's shared across all jobs for the same product
                        if (job.status === 'FAILED' || job.status === 'PENDING') {
                          const errorMessage = 
                            (job.result && typeof job.result === 'object' && job.result.error) 
                              ? String(job.result.error)
                              : null;
                          
                          if (errorMessage) {
                            return (
                              <div 
                                className="text-red-600 text-xs truncate" 
                                title={errorMessage}
                              >
                                {errorMessage}
                              </div>
                            );
                          }
                        }
                        
                        // Check for success with WooCommerce product ID
                        if (job.status === 'SUCCESS' && job.result && typeof job.result === 'object') {
                          const result = job.result as { productId?: string | number; id?: string | number; permalink?: string };
                          const wcProductId = result.productId || result.id;
                          if (wcProductId) {
                            return (
                              <div className="text-green-600 text-xs">
                                <div>WooCommerce ID: {String(wcProductId)}</div>
                                {result.permalink && typeof result.permalink === 'string' && (
                                  <a 
                                    href={result.permalink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline truncate block"
                                    title={result.permalink}
                                  >
                                    Xem sản phẩm
                                  </a>
                                )}
                              </div>
                            );
                          }
                        }
                        
                        return <span className="text-gray-400">-</span>;
                      })()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {new Date(job.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {new Date(job.updatedAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Trang {pagination.page} / {pagination.totalPages} (Tổng:{" "}
                {pagination.total} job)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("page", String(Math.max(1, page - 1)));
                    router.push(`/dashboard/upload-jobs?${params.toString()}`);
                  }}
                  disabled={page === 1}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("page", String(Math.min(pagination.totalPages, page + 1)));
                    router.push(`/dashboard/upload-jobs?${params.toString()}`);
                  }}
                  disabled={page >= pagination.totalPages}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => {
        if (!open) {
          setConfirmDialog({ open: false, type: 'process', jobCount: 0, estimatedCost: 0 });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.type === 'process' ? 'Xác nhận xử lý' : 'Xác nhận hủy'}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === 'process' ? (
                <>
                  {confirmDialog.jobIds && confirmDialog.jobIds.length > 0 ? (
                    <p className="mb-2">
                      Bạn có chắc muốn xử lý <strong>{confirmDialog.jobIds.length}</strong> job đã chọn?
                    </p>
                  ) : (
                    <p className="mb-2">
                      Bạn có chắc muốn xử lý tất cả jobs <strong>Đang chờ/Thất bại</strong> ({confirmDialog.jobCount} job)?
                    </p>
                  )}
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-3">
                    <p className="text-sm font-medium text-blue-900">
                      Số tiền dự kiến sẽ thanh toán: <strong>{confirmDialog.estimatedCost.toLocaleString('vi-VN')} VND</strong>
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      (Mỗi job upload thành công sẽ trừ 1.000 VND)
                    </p>
                  </div>
                </>
              ) : (
                <p>
                  {confirmDialog.jobIds && confirmDialog.jobIds.length > 0 ? (
                    <>Bạn có chắc muốn hủy <strong>{confirmDialog.jobIds.length}</strong> job đã chọn?</>
                  ) : (
                    <>Bạn có chắc muốn hủy tất cả jobs <strong>Thất bại</strong>?</>
                  )}
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, type: 'process', jobCount: 0, estimatedCost: 0 })}
            >
              Hủy
            </Button>
            <Button
              onClick={confirmDialog.type === 'process' ? handleConfirmProcess : handleConfirmCancel}
              variant={confirmDialog.type === 'process' ? 'default' : 'destructive'}
              className={confirmDialog.type === 'process' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              {confirmDialog.type === 'process' ? 'Xác nhận xử lý' : 'Xác nhận hủy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

