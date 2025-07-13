import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionWrapper from "./component/sessionWrapper";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Locial",
  description: "Location based social media platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="text-black">
            <head>
      <link
  rel="icon"
  href="/icon?<generated>"
  type="image/<generated>"
  sizes="<generated>"
/>
<link
  rel="apple-touch-icon"
  href="/icon?<generated>"
  type="image/<generated>"
  sizes="<generated>"
/>
      </head>
      <SessionWrapper>
      <body className={inter.className}>{children}</body>
      </SessionWrapper>
    </html>
  );
}
