import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../components/providers/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SecureLock - Sistem Akses Ruangan",
  description: "Platform manajemen akses ruangan pintar kampus berbasis IoT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>
        {/* Seluruh aplikasi sekarang punya akses ke data Login! */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}