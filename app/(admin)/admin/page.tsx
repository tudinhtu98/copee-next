"use client";

import useSWR from "swr";
import { fetcher } from "@/src/lib/fetcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type AdminSummary = {
  users: {
    total: number;
    active: number;
    banned: number;
  };
  products: {
    total: number;
    ready: number;
    uploaded: number;
  };
  sites: {
    total: number;
  };
  uploadJobs: {
    total: number;
    pending: number;
    success: number;
    failed: number;
  };
  transactions: {
    total: number;
  spent: number;
    credited: number;
  };
};

export default function AdminHome() {
  const { data, error, isLoading } = useSWR<AdminSummary>(
    "/admin/summary",
    fetcher
  );

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Thống kê tổng quan</h1>
        <div className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {(error as Error).message || "Không thể tải thống kê"}
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Thống kê tổng quan</h1>
        <div className="text-sm text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  // Ensure data structure is correct
  const users = data.users || { total: 0, active: 0, banned: 0 };
  const products = data.products || { total: 0, ready: 0, uploaded: 0 };
  const sites = data.sites || { total: 0 };
  const uploadJobs = data.uploadJobs || { total: 0, pending: 0, success: 0, failed: 0 };
  const transactions = data.transactions || { total: 0, spent: 0, credited: 0 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Thống kê tổng quan</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tổng quan về hệ thống và hoạt động của người dùng
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Users Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Người dùng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tổng số</span>
                <span className="text-lg font-semibold">{users.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Đang hoạt động</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {users.active}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Đã ban</span>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {users.banned}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sản phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tổng số</span>
                <span className="text-lg font-semibold">{products.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sẵn sàng</span>
                <Badge variant="secondary">{products.ready}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Đã đăng</span>
                <Badge variant="default">{products.uploaded}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sites Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Website</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tổng số</span>
                <span className="text-lg font-semibold">{sites.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Jobs Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tổng số</span>
                <span className="text-lg font-semibold">{uploadJobs.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Đang chờ</span>
                <Badge variant="outline">{uploadJobs.pending}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Thành công</span>
                <Badge variant="default" className="bg-green-600">
                  {uploadJobs.success}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Thất bại</span>
                <Badge variant="destructive">{uploadJobs.failed}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Giao dịch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tổng số</span>
                <span className="text-lg font-semibold">{transactions.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Đã chi</span>
                <span className="text-lg font-semibold text-red-600">
                  {new Intl.NumberFormat("vi-VN").format(transactions.spent)}₫
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Đã nạp</span>
                <span className="text-lg font-semibold text-green-600">
                  {new Intl.NumberFormat("vi-VN").format(transactions.credited)}₫
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tỷ lệ thành công</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Upload Jobs</span>
                <span className="text-lg font-semibold">
                  {uploadJobs.total > 0
                    ? ((uploadJobs.success / uploadJobs.total) * 100).toFixed(1)
                    : 0}
                  %
                </span>
        </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${
                      uploadJobs.total > 0
                        ? (uploadJobs.success / uploadJobs.total) * 100
                        : 0
                    }%`,
                  }}
                />
        </div>
        </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
