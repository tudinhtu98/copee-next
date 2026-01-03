import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppHeader from "@/components/app-header";
import Providers from "@/src/app/providers";
import { SetPasswordModal } from "@/components/set-password-modal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Copee - Sao chép sản phẩm Shopee lên WooCommerce",
  description: "Tiết kiệm thời gian bằng cách copy dữ liệu sản phẩm từ Shopee, quản lý chỉnh sửa trên Copee và đăng hàng loạt lên WooCommerce.",
  icons: {
    icon: '/logo-copee-32.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <AppHeader />
          {children}
          <SetPasswordModal />
        </Providers>
      </body>
    </html>
  );
}
