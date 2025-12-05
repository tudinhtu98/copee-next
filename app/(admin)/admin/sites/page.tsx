"use client";

import { useEffect, useState, useMemo } from "react";
import useSWR from "swr";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { fetcher } from "@/src/lib/fetcher";
import { ExternalLinkIcon } from "lucide-react";

type Site = {
  id: string;
  name: string;
  baseUrl: string;
  userId: string;
  createdAt: string;
  user?: {
    email: string;
    username: string | null;
  };
};

type SitesResponse = {
  sites: Site[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export default function AdminSites() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const search = searchParams.get("search") || "";
  const userIdFilter = searchParams.get("userId") || "";
  const [searchInput, setSearchInput] = useState(search);

  // Fetch users for filter
  const { data: usersData } = useSWR<{ users: Array<{ id: string; email: string; username: string | null }> }>(
    "/admin/users?limit=1000",
    fetcher
  );
  const users = usersData?.users || [];

  // Create query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
      ...(search && { search }),
      ...(userIdFilter && { userId: userIdFilter }),
    });
    return params.toString();
  }, [page, search, userIdFilter]);

  const { data, error, isLoading } = useSWR<SitesResponse>(
    `/admin/sites?${queryParams}`,
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

  const sites = data?.sites || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Quản lý Site</h1>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Input
          placeholder="Tìm kiếm theo tên hoặc URL..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-sm"
        />
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
          {(error as Error).message || "Không thể tải danh sách site"}
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
                  <TableHead>Tên site</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sites.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Không có site nào
                    </TableCell>
                  </TableRow>
                ) : (
                  sites.map((site) => (
                    <TableRow key={site.id}>
                      <TableCell className="font-medium">{site.name}</TableCell>
                      <TableCell>
                        <a
                          href={site.baseUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {site.baseUrl}
                          <ExternalLinkIcon className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell>
                        {site.user ? (
                          <div>
                            <div className="font-medium">{site.user.email}</div>
                            {site.user.username && (
                              <div className="text-sm text-muted-foreground">{site.user.username}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(site.createdAt).toLocaleDateString("vi-VN")}
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

