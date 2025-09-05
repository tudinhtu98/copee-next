"use client"
import { Button } from '@/components/ui/button'
export default function AdminUsers(){
  return (<div className="space-y-3">
    <h1 className="text-2xl font-semibold">Quản lý user</h1>
    <div className="rounded-md border p-4">Danh sách user (mock)</div>
    <Button>Thêm user</Button>
  </div>)
}