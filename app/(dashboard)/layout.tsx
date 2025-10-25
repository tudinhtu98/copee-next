import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]/route'
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions as any) as any
  const role = session?.user?.role
  return (
    <div className="flex min-h-dvh">
      <aside className="w-64 shrink-0 border-r p-4 space-y-2">
        <div className="font-semibold mb-2">Copee</div>
        <nav className="grid gap-1">
          <Link href="/dashboard">Tổng quan</Link>
          <Link href="/dashboard/products">Sản phẩm</Link>
          <Link href="/dashboard/settings">Cài đặt</Link>
          <Link href="/dashboard/billing">Nạp tiền</Link>
          <Link href="/dashboard/billing/history">Lịch sử giao dịch</Link>
          {role === 'ADMIN' || role === 'MOD' ? <Link href="/admin">Admin</Link> : null}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}