"use client";

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
    price: number | null;
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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function UploadJobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("perPage") || "20");
  const status = searchParams.get("status") || "";
  const siteId = searchParams.get("siteId") || "";

  const { data, error, isLoading, mutate } = useSWR<UploadJobsResponse>(
    `/api/proxy/products/upload-jobs?page=${page}&limit=${limit}${status ? `&status=${status}` : ""}${siteId ? `&siteId=${siteId}` : ""}`,
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
    const message = jobIds 
      ? `Bạn có chắc muốn xử lý ${jobIds.length} job đã chọn?\n\nSố tiền dự kiến sẽ thanh toán: ${estimatedCost.toLocaleString('vi-VN')} VND\n(Mỗi job upload thành công sẽ trừ 1.000 VND)`
      : `Bạn có chắc muốn xử lý tất cả jobs PENDING/FAILED (${jobCount} job)?\n\nSố tiền dự kiến sẽ thanh toán: ${estimatedCost.toLocaleString('vi-VN')} VND\n(Mỗi job upload thành công sẽ trừ 1.000 VND)`;
    const confirmed = window.confirm(message);
    if (!confirmed) return;

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
  }, [selectedJobs, mutate, jobs]);

  const handleCancelSelected = useCallback(async () => {
    const jobIds = selectedJobs.size > 0 ? Array.from(selectedJobs) : undefined;
    
    // If no jobs selected, cancel all FAILED jobs
    const message = jobIds 
      ? `Bạn có chắc muốn hủy ${jobIds.length} job đã chọn?`
      : `Bạn có chắc muốn hủy tất cả jobs FAILED?`;
    const confirmed = window.confirm(message);
    if (!confirmed) return;

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
  }, [selectedJobs, mutate]);

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

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      SUCCESS: "bg-green-100 text-green-800",
      FAILED: "bg-red-100 text-red-800",
      CANCELLED: "bg-gray-100 text-gray-800",
      PROCESSING: "bg-blue-100 text-blue-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${
          colors[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status}
      </span>
    );
  };

  const allSelected = useMemo(() => {
    // Check if all PENDING and FAILED jobs are selected
    const selectableJobs = jobs.filter((job) => job.status === "PENDING" || job.status === "FAILED");
    return selectableJobs.length > 0 && selectableJobs.every((job) => selectedJobs.has(job.id));
  }, [jobs, selectedJobs]);


  // Fetch sites for filter
  const { data: sitesData } = useSWR("/api/proxy/sites", fetcher);
  const sites = sitesData || [];

  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Upload Jobs</h1>
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
                : "Xử lý tất cả PENDING/FAILED"}
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
            <option value="PENDING">PENDING</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="PROCESSING">PROCESSING</option>
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
                          {job.product.price !== null
                            ? `${job.product.price.toLocaleString()} ${job.product.currency || "VND"}`
                            : "N/A"}
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
    </div>
  );
}

