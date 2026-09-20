# copee-next — Giao diện web của copee

Next.js 15 (App Router) + NextAuth + SWR + shadcn/ui (new-york) + sonner. Gọi API của
[copee-nest](https://github.com/tudinhtu98/copee-nest).

Production: web cổng **3001** sau nginx tại `https://app.copee.vn`, API cổng **4000**
tại `https://api.copee.vn`.

---

## Chạy ở máy

Cần **Node 22** và copee-nest đang chạy ở `http://localhost:4000`.

```bash
npm ci
cp .env.production.example .env.local   # rồi sửa cho môi trường máy
npm run dev                             # http://localhost:3001
```

| Lệnh | Việc |
|---|---|
| `npm run dev` | chạy dev (cổng 3001) |
| `npx tsc --noEmit` | kiểm tra kiểu |
| `npx eslint .` | lint |
| `npm run build` | build production |

---

## Biến môi trường

Để trong `.env.local` khi chạy máy, `.env.production` trên server.

| Biến | Dùng để |
|---|---|
| `NEXTAUTH_SECRET` | ký session của NextAuth. Sinh bằng `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL gốc của web (`http://localhost:3001` hoặc `https://app.copee.vn`) |
| `API_BASE_URL` | URL backend. **Chỉ dùng ở phía server**, không lộ ra trình duyệt |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | đăng nhập bằng Google |
| `NEXT_PUBLIC_VIDEO_BOT_USERNAME` | tên bot Telegram hiện trong trang Cài đặt |

> `.env.production.example` chỉ để **tên biến**, không bao giờ điền giá trị thật vào
> đó — file mẫu rất dễ bị commit nhầm.

---

## Cấu trúc

| Đường dẫn | Nội dung |
|---|---|
| `app/(auth)` | đăng nhập, đăng ký |
| `app/(dashboard)/dashboard` | khu người dùng: sản phẩm, upload, fanpage, điểm, API key |
| `app/(admin)/admin` | khu quản trị |
| `app/api/auth/[...nextauth]` | NextAuth |
| `app/api/proxy/[...path]` | **cầu nối tới backend** — xem mục dưới |
| `components/` | component dùng chung; `components/ui` là shadcn |
| `lib/`, `src/lib` | kiểu dữ liệu và hàm gọi API dùng chung |
| `middleware.ts` | chặn đường dẫn theo vai trò |

### Proxy BFF — mọi request tới backend đều đi qua đây

Trình duyệt **không gọi thẳng** `api.copee.vn`. Nó gọi `/api/proxy/...`, route này chạy
ở phía server, gắn access token vào rồi chuyển tiếp. Nhờ vậy token không bao giờ nằm
trong JavaScript của trình duyệt.

> ⚠️ **Route này phải giữ nguyên bytes của dữ liệu nhị phân.** Bản đầu dùng
> `await req.text()` và `await res.text()`, làm hỏng mọi ảnh đi qua — không tải ảnh lên
> được mà ảnh cũng không hiển thị được. Nay nó đọc `arrayBuffer()` và chỉ xử lý dạng
> chữ khi `content-type` đúng là JSON/text/xml. Sửa file này thì **phải thử lại việc
> tải ảnh lên**, không chỉ thử gọi API JSON.

Ảnh trong thư viện cũng đi qua proxy: `lib/ai-types.ts` có hàm `mediaUrl()` trả về
`/api/proxy/social/media/...`.

### Thẻ đề xuất AI

`components/ai-action-card.tsx` dùng chung cho cả trợ lý chat lẫn các nút bấm trên
trang. Mọi việc **tốn điểm hoặc khó hoàn tác** — đăng bài, xoá bài trên Page, tạo ảnh,
tạo video — đều tạo một đề xuất ở backend rồi hiện thẻ này, người dùng bấm Xác nhận mới
chạy. Thêm việc mới thì làm theo đúng đường đó, đừng gọi thẳng API thực thi.

`components/ai-chat-widget.tsx` là trợ lý nổi, gắn trong `app/layout.tsx` bên trong
`<Providers>` (cần phiên đăng nhập) và đặt trên thanh liên hệ.

---

## `.npmrc` — đừng xoá

Repo có `.npmrc` đặt `legacy-peer-deps=false`. Vài máy trong nhóm bật
`legacy-peer-deps=true` trong `~/.npmrc`; npm khi đó bỏ qua `peerDependencies` lúc dựng
cây phụ thuộc, nên `package-lock.json` sinh ra ở máy đó khác cây mà CI dựng và `npm ci`
trên CI gãy — đã xảy ra đúng một lần với `picomatch`. File này bắt mọi máy và CI theo
cùng một luật.

Kiểm tra lockfile bằng `npm ci --dry-run` ở máy **không đáng tin**, vì nó vẫn đọc
`~/.npmrc`. Muốn thử đúng như CI thì chạy trong thư mục sạch với `HOME` riêng.

---

## CI

`.github/workflows/ci.yml` chạy khi đẩy lên `main`, khi mở PR, hoặc bấm tay:
`npm ci` → kiểm tra kiểu → lint → build.

---

## Deploy lên server

**Deploy copee-nest trước** — web gọi API, làm ngược lại thì web lỗi 404 một lúc. Các
việc chuẩn bị một lần (nginx, thư mục ảnh, Facebook App) nằm trong README của copee-nest.

```bash
cd /var/www/copee/frontend
git pull
npm ci          # bắt buộc khi package-lock.json có thay đổi
npm run build
sudo systemctl restart copee-frontend
```

Quy trình cũ chỉ `git pull && npm run build` — **thiếu `npm ci`**. Lần nào lockfile đổi
mà bỏ bước này là build bằng phụ thuộc cũ.

### Kiểm tra sau khi deploy

```bash
systemctl status copee-frontend --no-pager
journalctl -u copee-frontend -n 50 --no-pager
```

Rồi mở `https://app.copee.vn/dashboard/fanpage`, thử tải một ảnh lên. Bước này kiểm
cùng lúc: proxy BFF, `client_max_body_size` của nginx, và quyền ghi thư mục `MEDIA_DIR`
bên backend.
