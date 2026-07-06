import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QA 리포트 대시보드",
  description: "QA 리포트 수집·관리 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
