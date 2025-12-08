import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

export default async function Home() {
  const session = (await getServerSession(authOptions as any)) as any;
  const role = session?.user?.role;
  return (
    <div className="min-h-dvh p-8">
      <section className="max-w-5xl mx-auto text-center space-y-4">
        <h1 className="text-3xl font-bold">
          Copee – Sao chép sản phẩm từ Shopee và đăng lên WooCommerce
        </h1>
        <p className="text-muted-foreground">
          Tiết kiệm thời gian bằng cách copy dữ liệu sản phẩm từ Shopee, quản lý
          chỉnh sửa trên Copee và đăng hàng loạt lên WooCommerce.
        </p>
        <div className="flex items-center justify-center gap-3">
          {!session && (
            <Link className="rounded-md border px-4 py-2" href="/register">
              Bắt đầu miễn phí
            </Link>
          )}
          {!session && (
            <Link className="rounded-md border px-4 py-2" href="/login">
              Đăng nhập
            </Link>
          )}
          {session && role === "USER" &&(
            <Link className="rounded-md border px-4 py-2" href="/dashboard">
              Vào Dashboard
            </Link>
          )}
          {session && (role === "ADMIN" || role === "MOD") && (
            <Link className="rounded-md border px-4 py-2" href="/admin">
              Khu vực Admin
            </Link>
          )}
        </div>
      </section>

      <section className="max-w-5xl mx-auto mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-md border p-4">
          <h3 className="font-semibold mb-2">Sao chép sản phẩm</h3>
          <p className="text-sm text-muted-foreground">
            Thu thập tiêu đề, mô tả, ảnh, giá... từ liên kết sản phẩm Shopee.
          </p>
        </div>
        <div className="rounded-md border p-4">
          <h3 className="font-semibold mb-2">Chỉnh sửa & quản lý</h3>
          <p className="text-sm text-muted-foreground">
            Xem danh sách sản phẩm đã copy, chọn danh mục, tùy chỉnh nội dung.
          </p>
        </div>
        <div className="rounded-md border p-4">
          <h3 className="font-semibold mb-2">Đăng lên WooCommerce</h3>
          <p className="text-sm text-muted-foreground">
            Kết nối nhiều site WP, đăng hàng loạt, theo dõi trạng thái upload.
          </p>
        </div>
        <div className="rounded-md border p-4">
          <h3 className="font-semibold mb-2">Thanh toán theo lượt</h3>
          <p className="text-sm text-muted-foreground">
            Mỗi lần upload thành công trừ 1.000đ. Nạp tiền dễ dàng.
          </p>
        </div>
        <div className="rounded-md border p-4">
          <h3 className="font-semibold mb-2">Quản trị</h3>
          <p className="text-sm text-muted-foreground">
            Admin quản lý user, phân quyền, cấp tiền, xem thống kê theo kỳ.
          </p>
        </div>
        <div className="rounded-md border p-4">
          <h3 className="font-semibold mb-2">API & bảo mật</h3>
          <p className="text-sm text-muted-foreground">
            Đăng nhập một lần, phân quyền theo role, bảo vệ khu vực admin.
          </p>
        </div>
      </section>
    </div>
  );
}
