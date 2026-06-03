import React from "react";
import { ShieldCheck } from "lucide-react";

export interface AuthLayoutProps {
  children: React.ReactNode; // Form login akan masuk ke sini
  title: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  return (
    <div className="min-h-screen flex bg-white">
      
      {/* Bagian Kiri: Area Form Login (Lebar penuh di Mobile, setengah di Desktop) */}
      <div className="flex flex-col justify-center w-full px-6 py-12 lg:w-1/2 sm:px-12 md:px-24 xl:px-32">
        <div className="w-full max-w-md mx-auto">
          {/* Header Form */}
          <div className="mb-8">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 text-sm text-gray-600">
                {subtitle}
              </p>
            )}
          </div>

          {/* Render Komponen Form (Children) */}
          {children}
          
        </div>
      </div>

      {/* Bagian Kanan: Area Branding / Ilustrasi (Disembunyikan di Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 relative items-center justify-center">
        {/* Dekorasi Latar Belakang (Pola Polkadot/Grid Samar) */}
        <div className="absolute inset-0 bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>
        
        {/* Konten Branding Utama */}
        <div className="relative z-10 flex flex-col items-center max-w-lg px-8 text-center">
          <div className="p-4 mb-6 bg-blue-600/20 rounded-full ring-8 ring-blue-600/10">
            <ShieldCheck className="w-20 h-20 text-blue-500" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Sistem Keamanan Akses <br />
            <span className="text-blue-400">Ruang Kelas Terpusat</span>
          </h1>
          <p className="mt-6 text-lg text-gray-400">
            Platform manajemen akses ruangan pintar berbasis IoT untuk dosen, mahasiswa, dan staf administrasi.
          </p>
        </div>
      </div>
      
    </div>
  );
};