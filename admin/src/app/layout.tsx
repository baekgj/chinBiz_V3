import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "친비즈 HQ Master · 본사 어드민",
  description: "친비즈 본사 마스터 어드민 — KPI·파트너사·상품/7단계 분배·조직망·정산·민원 총괄",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full antialiased`}>
      <body className="min-h-full bg-navy-950 text-slate-100">{children}</body>
    </html>
  );
}
