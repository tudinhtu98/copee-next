"use client"
import { Button } from '@/components/ui/button'
export default function BillingPage(){
  const token = typeof window!=='undefined' ? localStorage.getItem('token') : null;
  async function onTopup(){
    if(!token) return alert('Chưa đăng nhập');
    const res = await fetch(`undefined/billing/credit`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization: 'Bearer '+token }, body: JSON.stringify({ amount: 100000, reference: 'manual' }) });
    if(!res.ok) return alert('Lỗi');
    alert('Đã nạp 100k');
  }
  return (<div className="space-y-3">
    <h1 className="text-2xl font-semibold">Nạp tiền</h1>
    <div className="rounded-md border p-4 space-y-2">
      <div>Số dư hiện tại: 0đ</div>
      <Button onClick={onTopup}>Nạp tiền</Button>
    </div>
  </div>)
}