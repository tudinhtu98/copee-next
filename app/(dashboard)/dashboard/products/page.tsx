"use client"
import { Button } from '@/components/ui/button'
import useSWR from 'swr'
export default function ProductsPage(){
  async function onBulk(){
    const res = await fetch('/api/proxy/products/upload', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ productIds: [], siteId: '' }) });
    if(!res.ok) return alert('Lỗi');
    alert('Đã tạo job');
  }
  const fetcher = (url:string)=> fetch('/api/proxy'+url, { cache: 'no-store' }).then(r=>r.json())
  const { data, isLoading, error } = useSWR('/products', fetcher)
  return (<div className="space-y-3">
    <h1 className="text-2xl font-semibold">Sản phẩm</h1>
    <div className="flex items-center gap-2">
      <Button variant="secondary">Chọn tất cả</Button>
      <Button onClick={onBulk}>Tạo job upload</Button>
    </div>
    <div className="flex items-center gap-2">
      <Button onClick={async()=>{ const r = await fetch('/api/proxy/products/process-uploads', { method: 'POST' }); if(!r.ok) return alert('Lỗi xử lý'); alert('Đã xử lý uploads'); }}>Xử lý uploads</Button>
    </div>
    <div className="rounded-md border p-4 text-sm text-muted-foreground">
      {isLoading && 'Đang tải...'}
      {error && 'Lỗi tải dữ liệu'}
      {data && data.length===0 && 'Chưa có sản phẩm'}
      {data && data.length>0 && (<ul className="grid gap-2">{data.map((p:any)=>(<li key={p.id} className="border p-2 rounded">{p.title || p.sourceUrl}</li>))}</ul>)}
    </div>
  </div>)
}