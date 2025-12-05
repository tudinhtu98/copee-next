"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLinkIcon, UsersIcon, GlobeIcon, PackageIcon, TagIcon } from "lucide-react";
import { fetcher } from "@/src/lib/fetcher";
import { cn } from "@/lib/utils";

// Medal Icon Component - Olympic style with serrated edge and laurel wreath
function MedalIcon({ rank, className }: { rank: number; className?: string }) {
  const getMedalColor = () => {
    if (rank === 1) {
      return {
        gradient1: "#FFD700",
        gradient2: "#FFA500",
        dark: "#B8860B",
        light: "#FFF8DC",
        stroke: "#8B6914",
        ribbon: "#8B0000",
        wreath: "#DAA520",
      }; // Gold
    }
    if (rank === 2) {
      return {
        gradient1: "#E8E8E8",
        gradient2: "#C0C0C0",
        dark: "#808080",
        light: "#F5F5F5",
        stroke: "#505050",
        ribbon: "#8B0000",
        wreath: "#A0A0A0",
      }; // Silver
    }
    if (rank === 3) {
      return {
        gradient1: "#CD7F32",
        gradient2: "#B87333",
        dark: "#8B4513",
        light: "#F4E4BC",
        stroke: "#654321",
        ribbon: "#8B0000",
        wreath: "#B8860B",
      }; // Bronze
    }
    return {
      gradient1: "#6B7280",
      gradient2: "#4B5563",
      dark: "#374151",
      light: "#F3F4F6",
      stroke: "#374151",
      ribbon: "#8B0000",
      wreath: "#6B7280",
    };
  };

  const colors = getMedalColor();
  const gradientId = `medal-gradient-${rank}`;
  const ribbonGradientId = `ribbon-gradient-${rank}`;
  const wreathGradientId = `wreath-gradient-${rank}`;

  // Generate serrated edge path (scalloped circle)
  const centerX = 28; // Center of 56 width
  const centerY = 22; // Adjusted for better positioning
  const radius = 14;
  const teeth = 16; // Number of serrations
  const serratedPath = Array.from({ length: teeth }, (_, i) => {
    const angle1 = (i * 360) / teeth - 90;
    const angle2 = ((i + 0.5) * 360) / teeth - 90;
    const angle3 = ((i + 1) * 360) / teeth - 90;
    const rad1 = (angle1 * Math.PI) / 180;
    const rad2 = (angle2 * Math.PI) / 180;
    const rad3 = (angle3 * Math.PI) / 180;
    const x1 = centerX + radius * Math.cos(rad1);
    const y1 = centerY + radius * Math.sin(rad1);
    const x2 = centerX + (radius * 0.9) * Math.cos(rad2);
    const y2 = centerY + (radius * 0.9) * Math.sin(rad2);
    const x3 = centerX + radius * Math.cos(rad3);
    const y3 = centerY + radius * Math.sin(rad3);
    return i === 0 ? `M ${x1} ${y1}` : `L ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3}`;
  }).join(" ") + " Z";

  // Laurel wreath path (adjusted for new center)
  const wreathPath = `
    M 18 22 Q 18 18 20 16 Q 22 14 24 16 Q 26 14 28 16 Q 30 18 30 22
    Q 30 26 28 28 Q 26 30 24 28 Q 22 30 20 28 Q 18 26 18 22
  `;

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg
        width="56"
        height="60"
        viewBox="0 0 56 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.gradient1} />
            <stop offset="50%" stopColor={colors.gradient2} />
            <stop offset="100%" stopColor={colors.dark} />
          </linearGradient>
          <linearGradient id={ribbonGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A00000" />
            <stop offset="100%" stopColor={colors.ribbon} />
          </linearGradient>
          <linearGradient id={wreathGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.wreath} />
            <stop offset="100%" stopColor={colors.dark} />
          </linearGradient>
          <filter id={`shadow-${rank}`}>
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Medal body - serrated edge circle */}
        <path
          d={serratedPath}
          fill={`url(#${gradientId})`}
          stroke="white"
          strokeWidth="1.5"
          filter={`url(#shadow-${rank})`}
        />

        {/* Inner highlight for 3D effect */}
        <ellipse
          cx={centerX}
          cy={centerY - 2}
          rx="8"
          ry="6"
          fill="white"
          fillOpacity="0.3"
        />

        {/* Laurel wreath */}
        <path
          d={wreathPath}
          fill="none"
          stroke={`url(#${wreathGradientId})`}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Wreath leaves detail */}
        <circle cx="20" cy="18" r="1.5" fill={colors.wreath} opacity="0.8" />
        <circle cx="28" cy="18" r="1.5" fill={colors.wreath} opacity="0.8" />
        <circle cx="22" cy="26" r="1.5" fill={colors.wreath} opacity="0.8" />
        <circle cx="26" cy="26" r="1.5" fill={colors.wreath} opacity="0.8" />

        {/* Background circle for number */}
        <circle
          cx={centerX}
          cy={centerY}
          r="7"
          fill="white"
          stroke={colors.stroke}
          strokeWidth="1.5"
        />

        {/* Inner shadow for depth */}
        <circle
          cx={centerX}
          cy={centerY + 1}
          r="6"
          fill={colors.dark}
          fillOpacity="0.1"
        />

        {/* Number text - sized to fit icon, perfectly centered */}
        <text
          x={centerX}
          y={centerY}
          dy="0.35em"
          textAnchor="middle"
          fontSize="16"
          fontWeight="900"
          fill={colors.stroke}
          fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
          className="select-none"
          style={{
            textShadow: "0 2px 4px rgba(0,0,0,0.3), 0 0 2px rgba(255,255,255,0.9)",
            letterSpacing: "-0.5px",
          }}
        >
          {rank}
        </text>

        {/* Shine effect on top */}
        <ellipse
          cx={centerX}
          cy={centerY - 4}
          rx="5"
          ry="3"
          fill="white"
          fillOpacity="0.5"
        />

        {/* Bottom ribbon - V-shaped, positioned correctly below medal */}
        <path
          d="M 28 40 L 32 36 L 28 34 L 24 36 Z"
          fill={`url(#${ribbonGradientId})`}
          filter={`url(#shadow-${rank})`}
        />
        <path
          d="M 28 40 L 32 36 L 28 34 L 24 36 Z"
          fill="white"
          fillOpacity="0.1"
        />
        {/* Ribbon left tail */}
        <path
          d="M 24 36 L 22 38 L 24 40 Z"
          fill={`url(#${ribbonGradientId})`}
        />
        {/* Ribbon right tail */}
        <path
          d="M 32 36 L 34 38 L 32 40 Z"
          fill={`url(#${ribbonGradientId})`}
        />
        {/* Ribbon highlight */}
        <path
          d="M 28 34 L 30 35.5 L 28 37 L 26 35.5 Z"
          fill="white"
          fillOpacity="0.2"
        />
      </svg>
    </div>
  );
}

type AdminStatsResponse = {
  range: "week" | "month" | "quarter" | "year";
  topUsers: Array<{
    userId: string;
    username: string;
    email: string;
    spent: number;
  }>;
  topSites: Array<{
    siteId: string;
    name: string;
    baseUrl: string;
    uploads: number;
  }>;
  topProducts: Array<{
    productId: string;
    title: string;
    sourceUrl: string;
    uploads: number;
  }>;
  topCategories: Array<{ category: string; count: number }>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type StatsType = "users" | "sites" | "products" | "categories";

const rangeOptions: Array<{
  value: AdminStatsResponse["range"];
  label: string;
}> = [
  { value: "week", label: "7 ngày gần đây" },
  { value: "month", label: "30 ngày gần đây" },
  { value: "quarter", label: "3 tháng gần đây" },
  { value: "year", label: "1 năm gần đây" },
];

const statsTypes: Array<{
  value: StatsType;
  label: string;
  icon: React.ReactNode;
  description: string;
}> = [
  {
    value: "users",
    label: "Top User Chi Tiêu",
    icon: <UsersIcon className="h-5 w-5" />,
    description: "Người dùng chi tiêu nhiều nhất",
  },
  {
    value: "sites",
    label: "Top Site WooCommerce",
    icon: <GlobeIcon className="h-5 w-5" />,
    description: "Website có nhiều upload nhất",
  },
  {
    value: "products",
    label: "Top Sản Phẩm",
    icon: <PackageIcon className="h-5 w-5" />,
    description: "Sản phẩm được upload nhiều nhất",
  },
  {
    value: "categories",
    label: "Top Ngành Hàng",
    icon: <TagIcon className="h-5 w-5" />,
    description: "Danh mục có nhiều sản phẩm nhất",
  },
];

export default function AdminStats() {
  const [range, setRange] = useState<AdminStatsResponse["range"]>("week");
  const [selectedType, setSelectedType] = useState<StatsType>("users");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, error, isLoading } = useSWR<AdminStatsResponse>(
    `/admin/stats?range=${range}&type=${selectedType}&page=${page}&limit=${limit}`,
    fetcher
  );

  // Reset page when type changes
  const handleTypeChange = (type: StatsType) => {
    setSelectedType(type);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
        <h1 className="text-2xl font-semibold">Top thống kê</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Thống kê các hoạt động nổi bật trong hệ thống
          </p>
        </div>
        <Select
          value={range}
          onValueChange={(value) =>
            setRange(value as AdminStatsResponse["range"])
          }
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Chọn khoảng thời gian" />
          </SelectTrigger>
          <SelectContent>
            {rangeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 4 Button lớn để chọn loại thống kê */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsTypes.map((type) => (
          <Button
            key={type.value}
            variant={selectedType === type.value ? "default" : "outline"}
            className={cn(
              "h-auto flex-col items-start justify-start p-6 gap-3",
              selectedType === type.value && "bg-primary text-primary-foreground"
            )}
            onClick={() => handleTypeChange(type.value)}
          >
            <div className="flex items-center gap-3 w-full">
              {type.icon}
              <div className="flex-1 text-left">
                <div className="font-semibold">{type.label}</div>
                <div className={cn(
                  "text-xs mt-1",
                  selectedType === type.value ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  {type.description}
                </div>
              </div>
            </div>
          </Button>
        ))}
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {(error as Error).message || "Không thể tải dữ liệu"}
        </div>
      )}

      {isLoading && (
        <div className="text-sm text-muted-foreground">Đang tải thống kê...</div>
      )}

      {data && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {selectedType === "users" && (
                  <>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Tổng chi tiêu</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </>
                )}
                {selectedType === "sites" && (
                  <>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Tên site</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead className="text-right">Số lần upload</TableHead>
                  </>
                )}
                {selectedType === "products" && (
                  <>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Tên sản phẩm</TableHead>
                    <TableHead className="text-right">Số lần upload</TableHead>
                    <TableHead>Link gốc</TableHead>
                  </>
                )}
                {selectedType === "categories" && (
                  <>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Ngành hàng</TableHead>
                    <TableHead className="text-right">Số sản phẩm</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedType === "users" && (
                <>
                  {data.topUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Chưa có dữ liệu chi tiêu trong khoảng thời gian này
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.topUsers.map((user, index) => {
                      const rank = (page - 1) * limit + index + 1;
                      const isTop1 = rank === 1;
                      const isTop2 = rank === 2;
                      const isTop3 = rank === 3;
                      const getRankColor = () => {
                        if (isTop1) return "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700";
                        if (isTop2) return "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600";
                        if (isTop3) return "bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700";
                        return "";
                      };
                      return (
                        <TableRow key={user.userId} className={getRankColor()}>
                          <TableCell className="text-center">
                            {rank <= 3 ? (
                              <div className="flex justify-center">
                                <MedalIcon rank={rank} />
                    </div>
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary mx-auto">
                                {rank}
                  </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{user.username || "N/A"}</TableCell>
                          <TableCell className="text-muted-foreground">{user.email}</TableCell>
                          <TableCell className="text-right">
                            <span className="font-semibold text-red-600">
                    {new Intl.NumberFormat("vi-VN").format(user.spent)}₫
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link
                              href={`/admin/users?search=${encodeURIComponent(user.email || user.username || "")}`}
                              className="text-sm text-primary hover:underline"
                            >
                              Xem chi tiết
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </>
              )}

              {selectedType === "sites" && (
                <>
                  {data.topSites.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Chưa có dữ liệu upload trong khoảng thời gian này
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.topSites.map((site, index) => {
                      const rank = (page - 1) * limit + index + 1;
                      const isTop1 = rank === 1;
                      const isTop2 = rank === 2;
                      const isTop3 = rank === 3;
                      const getRankColor = () => {
                        if (isTop1) return "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700";
                        if (isTop2) return "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600";
                        if (isTop3) return "bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700";
                        return "";
                      };
                      return (
                        <TableRow key={site.siteId} className={getRankColor()}>
                          <TableCell className="text-center">
                            {rank <= 3 ? (
                              <div className="flex justify-center">
                                <MedalIcon rank={rank} />
                              </div>
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary mx-auto">
                                {rank}
                  </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{site.name}</TableCell>
                          <TableCell className="text-muted-foreground">
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
                          <TableCell className="text-right">
                            <Badge variant="default">{site.uploads} upload</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </>
              )}

              {selectedType === "products" && (
                <>
                  {data.topProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Chưa có dữ liệu upload trong khoảng thời gian này
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.topProducts.map((product, index) => {
                      const rank = (page - 1) * limit + index + 1;
                      const isTop1 = rank === 1;
                      const isTop2 = rank === 2;
                      const isTop3 = rank === 3;
                      const getRankColor = () => {
                        if (isTop1) return "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700";
                        if (isTop2) return "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600";
                        if (isTop3) return "bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700";
                        return "";
                      };
                      return (
                        <TableRow key={product.productId} className={getRankColor()}>
                          <TableCell className="text-center">
                            {rank <= 3 ? (
                              <div className="flex justify-center">
                                <MedalIcon rank={rank} />
                    </div>
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary mx-auto">
                                {rank}
                  </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium max-w-md">
                            <div className="line-clamp-2">{product.title || "Sản phẩm"}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{product.uploads} lần</Badge>
                          </TableCell>
                          <TableCell>
                            {product.sourceUrl ? (
                      <a
                        href={product.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                              >
                                Xem chi tiết
                                <ExternalLinkIcon className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </>
              )}

              {selectedType === "categories" && (
                <>
                  {data.topCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        Chưa có dữ liệu sản phẩm trong khoảng thời gian này
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.topCategories.map((category, index) => {
                      const rank = (page - 1) * limit + index + 1;
                      const isTop1 = rank === 1;
                      const isTop2 = rank === 2;
                      const isTop3 = rank === 3;
                      const getRankColor = () => {
                        if (isTop1) return "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700";
                        if (isTop2) return "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600";
                        if (isTop3) return "bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700";
                        return "";
                      };
                      return (
                        <TableRow key={category.category} className={getRankColor()}>
                          <TableCell className="text-center">
                            {rank <= 3 ? (
                              <div className="flex justify-center">
                                <MedalIcon rank={rank} />
                              </div>
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary mx-auto">
                                {rank}
                  </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{category.category}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">{category.count} sản phẩm</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </>
              )}
            </TableBody>
          </Table>
                  </div>
      )}

      {/* Pagination */}
      {data && data.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Hiển thị {(data.pagination.page - 1) * data.pagination.limit + 1} -{" "}
            {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} /{" "}
            {data.pagination.total}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Trước
            </Button>
            {Array.from(
              { length: Math.min(5, data.pagination.totalPages) },
              (_, i) => {
                let pageNum;
                if (data.pagination!.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= data.pagination!.totalPages - 2) {
                  pageNum = data.pagination!.totalPages - 4 + i;
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
              onClick={() => setPage(page + 1)}
              disabled={page === data.pagination!.totalPages}
            >
              Sau
            </Button>
                  </div>
        </div>
      )}
    </div>
  );
}
