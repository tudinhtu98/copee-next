"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from "react";
import useSWR from "swr";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetcher, apiFetch } from "@/src/lib/fetcher";
import { XIcon } from "lucide-react";

type User = {
  id: string;
  email: string;
  username: string;
  role: "USER" | "MOD" | "ADMIN";
  balance: number;
  bannedAt: string | null;
  createdAt: string;
  updatedAt?: string;
};

type UsersResponse = {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type UserFormValues = {
  email: string;
  username: string;
  password: string;
  role: "USER" | "MOD" | "ADMIN";
};

const roleDisplay: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  USER: { label: "User", variant: "outline" },
  MOD: { label: "Moderator", variant: "secondary" },
  ADMIN: { label: "Admin", variant: "default" },
};

export default function AdminUsers() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const search = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(search);
  const { data: session } = useSession() as any;
  const currentUserRole = session?.user?.role as "USER" | "MOD" | "ADMIN" | undefined;
  const isMod = currentUserRole === "MOD";
  const isAdmin = currentUserRole === "ADMIN";

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormValues>({
    email: "",
    username: "",
    password: "",
    role: "USER",
  });

  const { data, error, isLoading, mutate } = useSWR<UsersResponse>(
    `/admin/users?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}`,
    fetcher
  );

  const handleCreate = useCallback(async () => {
    try {
      const res = await apiFetch("/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Không thể tạo user");
      }

      toast.success("Tạo user thành công");
      setIsCreateDialogOpen(false);
      setFormData({ email: "", username: "", password: "", role: "USER" });
      mutate();
    } catch (error: any) {
      toast.error(error.message || "Không thể tạo user");
    }
  }, [formData, mutate]);

  const handleUpdate = useCallback(async () => {
    if (!editingUser) return;

    try {
      const updateData: any = {
        email: formData.email,
        username: formData.username,
        role: formData.role,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const res = await apiFetch(`/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Không thể cập nhật user");
      }

      toast.success("Cập nhật user thành công");
      setIsEditDialogOpen(false);
      setEditingUser(null);
      setFormData({ email: "", username: "", password: "", role: "USER" });
      mutate();
    } catch (error: any) {
      toast.error(error.message || "Không thể cập nhật user");
    }
  }, [editingUser, formData, mutate]);

  const handleDelete = useCallback(
    async (userId: string) => {
      if (!confirm("Bạn có chắc chắn muốn xóa user này?")) return;

      try {
        const res = await apiFetch(`/admin/users/${userId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || "Không thể xóa user");
        }

        toast.success("Xóa user thành công");
        mutate();
      } catch (error: any) {
        toast.error(error.message || "Không thể xóa user");
      }
    },
    [mutate]
  );

  const handleBan = useCallback(
    async (userId: string) => {
      try {
        const res = await apiFetch(`/admin/users/${userId}/ban`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const text = await res.text();
          let error;
          try {
            error = JSON.parse(text);
          } catch {
            error = { message: text || `Lỗi ${res.status}: Không thể ban user` };
          }
          throw new Error(error.message || `Lỗi ${res.status}: Không thể ban user`);
        }

        // Try to parse response, but don't fail if empty
        const text = await res.text();
        if (text) {
          try {
            const data = JSON.parse(text);
          } catch {
            // Response is not JSON, that's okay
          }
        }

        toast.success("Ban user thành công");
        mutate();
      } catch (error: any) {
        toast.error(error.message || "Không thể ban user");
      }
    },
    [mutate]
  );

  const handleUnban = useCallback(
    async (userId: string) => {
      try {
        const res = await apiFetch(`/admin/users/${userId}/unban`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const text = await res.text();
          let error;
          try {
            error = JSON.parse(text);
          } catch {
            error = { message: text || `Lỗi ${res.status}: Không thể unban user` };
          }
          throw new Error(error.message || `Lỗi ${res.status}: Không thể unban user`);
        }

        // Try to parse response, but don't fail if empty
        const text = await res.text();
        if (text) {
          try {
            const data = JSON.parse(text);
          } catch {
            // Response is not JSON, that's okay
          }
        }

        toast.success("Unban user thành công");
        mutate();
      } catch (error: any) {
        toast.error(error.message || "Không thể unban user");
      }
    },
    [mutate]
  );

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      username: user.username,
      password: "",
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold">Quản lý user</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>Thêm user</Button>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-2">
        <div className="group relative max-w-sm">
          <Input
            placeholder="Tìm kiếm theo email hoặc username..."
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
          {(error as Error).message || "Không thể tải danh sách user"}
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
                  <TableHead>Email</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Số dư</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Không có user nào
                    </TableCell>
                  </TableRow>
                ) : (
                  data.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>
                        <Badge variant={roleDisplay[user.role].variant}>
                          {roleDisplay[user.role].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("vi-VN").format(user.balance)}₫
                      </TableCell>
                      <TableCell>
                        {user.bannedAt ? (
                          <Badge variant="destructive">Đã ban</Badge>
                        ) : (
                          <Badge variant="outline">Hoạt động</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                            disabled={isMod && user.role !== "USER"}
                          >
                            Sửa
                          </Button>
                          {user.bannedAt ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnban(user.id)}
                              disabled={isMod && user.role !== "USER"}
                            >
                              Unban
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleBan(user.id)}
                              disabled={isMod && user.role !== "USER"}
                            >
                              Ban
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(user.id)}
                            disabled={isMod && user.role !== "USER"}
                          >
                            Xóa
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Trang {data.pagination.page} / {data.pagination.totalPages} (
                {data.pagination.total} user)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.set("page", String(page - 1));
                    window.location.search = params.toString();
                  }}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);
                    params.set("page", String(page + 1));
                    window.location.search = params.toString();
                  }}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm user mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Username</label>
              <Input
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                placeholder="username"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <Select
                value={formData.role}
                onValueChange={(value: "USER" | "MOD" | "ADMIN") =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  {isAdmin && <SelectItem value="MOD">Moderator</SelectItem>}
                  {isAdmin && <SelectItem value="ADMIN">Admin</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreate}>Tạo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa user</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Username</label>
              <Input
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                placeholder="username"
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                Password (để trống nếu không đổi)
              </label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <Select
                value={formData.role}
                onValueChange={(value: "USER" | "MOD" | "ADMIN") =>
                  setFormData({ ...formData, role: value })
                }
                disabled={isMod && editingUser?.role !== "USER"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  {isAdmin && <SelectItem value="MOD">Moderator</SelectItem>}
                  {isAdmin && <SelectItem value="ADMIN">Admin</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdate}>Cập nhật</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
