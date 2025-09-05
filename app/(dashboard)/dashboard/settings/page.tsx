"use client"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
export default function SettingsPage(){
  const token = typeof window!=='undefined' ? localStorage.getItem('token') : null;
  async function onSave(){
    if(!token) return alert('Chưa đăng nhập');
    const inputs = Array.from(document.querySelectorAll('input')) as HTMLInputElement[];
    const body = { name: inputs[0].value, baseUrl: inputs[1].value, wooConsumerKey: inputs[2].value, wooConsumerSecret: inputs[3].value };
    const res = await fetch(`undefined/sites`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization: 'Bearer '+token }, body: JSON.stringify(body) });
    if(!res.ok) return alert('Lỗi lưu');
    alert('Đã lưu');
  }
  return (<div className="space-y-3">
    <h1 className="text-2xl font-semibold">Cài đặt</h1>
    <div className="grid gap-3 max-w-xl">
      <Input placeholder="Tên site" />
      <Input placeholder="Base URL (https://...)" />
      <Input placeholder="Woo Consumer Key" />
      <Input placeholder="Woo Consumer Secret" />
      <Button onClick={onSave}>Lưu</Button>
    </div>
  </div>)
}