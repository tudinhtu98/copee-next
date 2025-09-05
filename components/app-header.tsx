"use client"
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export default function AppHeader() {
  const { data } = useSession() as any
  const role = data?.user?.role
  const username = data?.user?.username || data?.user?.name
  return (
    <header className="w-full border-b px-4 py-3 flex items-center justify-between">
      <Link href="/" className="font-semibold">Copee</Link>
      <nav className="flex items-center gap-3">
        {role === 'ADMIN' || role === 'MOD' ? <Link href="/admin" className="text-sm">Admin</Link> : null}
        <Link href="/dashboard" className="text-sm">Dashboard</Link>
        {data?.user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{username}</span>
            <Button size="sm" variant="outline" onClick={() => signOut({ callbackUrl: '/' })}>Logout</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm">Login</Link>
            <Link href="/register" className="text-sm">Register</Link>
          </div>
        )}
      </nav>
    </header>
  )
}


