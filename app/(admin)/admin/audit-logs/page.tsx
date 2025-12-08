"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/src/lib/fetcher";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { XIcon } from "lucide-react";


type AuditLog = {
  id: string;
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  method: string;
  endpoint: string;
  ipAddress?: string;
  userAgent?: string;
  requestBody?: any;
  response?: any;
  status: number;
  errorMessage?: string;
  createdAt: string;
};

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [resourceFilter, setResourceFilter] = useState<string>("ALL");
  const [userEmailFilter, setUserEmailFilter] = useState<string>("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const pageSize = 50;

  const queryParams = new URLSearchParams();
  queryParams.set("skip", ((page - 1) * pageSize).toString());
  queryParams.set("take", pageSize.toString());
  if (actionFilter && actionFilter !== "ALL") queryParams.set("action", actionFilter);
  if (resourceFilter && resourceFilter !== "ALL") queryParams.set("resource", resourceFilter);

  const { data, error, isLoading } = useSWR<{
    logs: AuditLog[];
    total: number;
  }>(`/audit-logs?${queryParams.toString()}`, fetcher, {
    refreshInterval: 30000, // Refresh every 30s
  });

  const filteredLogs = data?.logs.filter((log) => {
    if (userEmailFilter && !log.userEmail.toLowerCase().includes(userEmailFilter.toLowerCase())) {
      return false;
    }
    return true;
  });

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  // Check if any filter is changed from default
  const hasActiveFilters = userEmailFilter !== "" || actionFilter !== "ALL" || resourceFilter !== "ALL";

  // Reset all filters
  const handleClearFilters = () => {
    setUserEmailFilter("");
    setActionFilter("ALL");
    setResourceFilter("ALL");
    setPage(1);
  };

  const getActionBadgeColor = (action: string) => {
    if (action.startsWith("CREATE")) return "bg-green-500";
    if (action.startsWith("UPDATE")) return "bg-blue-500";
    if (action.startsWith("DELETE")) return "bg-red-500";
    return "bg-gray-500";
  };

  const getStatusBadgeColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-green-500";
    if (status >= 400 && status < 500) return "bg-yellow-500";
    if (status >= 500) return "bg-red-500";
    return "bg-gray-500";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">
          Theo dõi các thao tác của ADMIN và MOD trong hệ thống
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-md border p-4 space-y-4">
        <h2 className="text-lg font-semibold">Lọc</h2>
        <div className="flex flex-wrap items-start gap-4">
          <div className="min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Email</label>
            <Input
              placeholder="Lọc theo email..."
              value={userEmailFilter}
              onChange={(e) => setUserEmailFilter(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Hành động</label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="CREATE_USER">CREATE_USER</SelectItem>
                <SelectItem value="UPDATE_USER">UPDATE_USER</SelectItem>
                <SelectItem value="DELETE_USER">DELETE_USER</SelectItem>
                <SelectItem value="BAN_USER">BAN_USER</SelectItem>
                <SelectItem value="UNBAN_USER">UNBAN_USER</SelectItem>
                <SelectItem value="CREDIT_USER">CREDIT_USER</SelectItem>
                <SelectItem value="CREATE_SITE">CREATE_SITE</SelectItem>
                <SelectItem value="UPDATE_SITE">UPDATE_SITE</SelectItem>
                <SelectItem value="DELETE_SITE">DELETE_SITE</SelectItem>
                <SelectItem value="CREATE_PRODUCT">CREATE_PRODUCT</SelectItem>
                <SelectItem value="UPDATE_PRODUCT">UPDATE_PRODUCT</SelectItem>
                <SelectItem value="DELETE_PRODUCT">DELETE_PRODUCT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Resource</label>
            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="Site">Site</SelectItem>
                <SelectItem value="Product">Product</SelectItem>
                <SelectItem value="User">User</SelectItem>
                <SelectItem value="Transaction">Transaction</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {hasActiveFilters && (
            <div className="flex items-end self-end">
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="whitespace-nowrap border-destructive text-destructive hover:bg-destructive/10"
              >
                <XIcon className="mr-2 h-4 w-4" />
                Bỏ lọc
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-md border">
        {isLoading && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Đang tải...
          </div>
        )}
        {error && (
          <div className="p-4 text-center text-sm text-destructive">
            Không thể tải audit logs
          </div>
        )}
        {filteredLogs && filteredLogs.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Hành động</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Chi tiết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs">
                    {new Date(log.createdAt).toLocaleString("vi-VN")}
                  </TableCell>
                  <TableCell className="text-sm">{log.userEmail}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {log.userRole}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${getActionBadgeColor(log.action)} text-white text-xs`}
                    >
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{log.resource}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {log.method}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${getStatusBadgeColor(log.status)} text-white text-xs`}
                    >
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.ipAddress || "-"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                    >
                      Xem
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {filteredLogs && filteredLogs.length === 0 && !isLoading && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Không có audit log nào
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Trang {page} / {totalPages} (Tổng: {data?.total} logs)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết Audit Log</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Thời gian</label>
                  <div className="text-sm text-muted-foreground">
                    {new Date(selectedLog.createdAt).toLocaleString("vi-VN")}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">User</label>
                  <div className="text-sm text-muted-foreground">
                    {selectedLog.userEmail}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <div>
                    <Badge variant="secondary">{selectedLog.userRole}</Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Action</label>
                  <div>
                    <Badge
                      className={`${getActionBadgeColor(selectedLog.action)} text-white`}
                    >
                      {selectedLog.action}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Resource</label>
                  <div className="text-sm text-muted-foreground">
                    {selectedLog.resource}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Resource ID</label>
                  <div className="text-sm text-muted-foreground font-mono">
                    {selectedLog.resourceId || "-"}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Method</label>
                  <div>
                    <Badge variant="outline">{selectedLog.method}</Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div>
                    <Badge
                      className={`${getStatusBadgeColor(selectedLog.status)} text-white`}
                    >
                      {selectedLog.status}
                    </Badge>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Endpoint</label>
                  <div className="text-sm text-muted-foreground font-mono">
                    {selectedLog.endpoint}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">IP Address</label>
                  <div className="text-sm text-muted-foreground">
                    {selectedLog.ipAddress || "-"}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">User Agent</label>
                  <div className="text-sm text-muted-foreground break-all">
                    {selectedLog.userAgent || "-"}
                  </div>
                </div>
              </div>

              {selectedLog.errorMessage && (
                <div>
                  <label className="text-sm font-medium text-red-600">
                    Error Message
                  </label>
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded mt-1">
                    {selectedLog.errorMessage}
                  </div>
                </div>
              )}

              {selectedLog.requestBody && (
                <div>
                  <label className="text-sm font-medium">Request Body</label>
                  <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(selectedLog.requestBody, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.response && (
                <div>
                  <label className="text-sm font-medium">Response</label>
                  <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(selectedLog.response, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
