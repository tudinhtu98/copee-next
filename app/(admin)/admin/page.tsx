export default function AdminHome(){
  const token = typeof window!=='undefined' ? localStorage.getItem('token') : null;
  async function load(){
    if(!token) return;
    const res = await fetch(`undefined/admin/summary`, { headers:{ Authorization: 'Bearer '+token } });
    console.log('summary', await res.json());
  }
  if (typeof window!=='undefined') setTimeout(load, 0);
  return <div className="space-y-3">
    <h1 className="text-2xl font-semibold">Thống kê</h1>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-md border p-4">Số user</div>
      <div className="rounded-md border p-4">Tiền user đã dùng</div>
      <div className="rounded-md border p-4">Top user dùng nhiều</div>
      <div className="rounded-md border p-4">Top website</div>
    </div>
  </div>
}