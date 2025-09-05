import Link from 'next/link'
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <aside className="w-64 shrink-0 border-r p-4 space-y-2">
        <div className="font-semibold mb-2">Admin</div>
        <nav className="grid gap-1">
          <Link href="/admin">Thống kê</Link>
          <Link href="/admin/users">Quản lý user</Link>
          <Link href="/admin/roles">Phân quyền</Link>
          <Link href="/admin/stats">Top thống kê</Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}