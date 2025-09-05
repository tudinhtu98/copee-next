export default function DashboardHome(){
  return <div className="space-y-3">
    <h1 className="text-2xl font-semibold">Tổng quan</h1>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-md border p-4">Số dư: 0đ</div>
      <div className="rounded-md border p-4">Sản phẩm đã copy: 0</div>
      <div className="rounded-md border p-4">Upload thành công: 0</div>
      <div className="rounded-md border p-4">Chi tiêu tuần này: 0đ</div>
    </div>
  </div>
}