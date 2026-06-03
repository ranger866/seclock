"use client"; // Wajib ditambahkan karena kita menggunakan state (useState) di Next.js App Router

import React, { useState } from "react";
import { Sidebar } from "../organisms/Sidebar";
import { Navbar } from "../organisms/Navbar";
import { Menu, X } from "lucide-react";
import { Role } from "../../types";

export interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: Role;
  userName: string;
  identifier: string;
  onLogout?: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  userRole,
  userName,
  identifier,
  onLogout,
}) => {
  // State untuk mengontrol apakah sidebar terbuka atau tertutup di versi Mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      
      {/* 1. Sidebar (Berubah jadi overlay / pop-up di layar HP) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform md:relative md:translate-x-0 transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar userRole={userRole} onLogout={onLogout} />
      </div>

      {/* 2. Overlay Gelap untuk Mobile (Muncul kalau menu dibuka) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)} // Klik di luar sidebar untuk menutup
        />
      )}

      {/* 3. Area Konten Utama (Sebelah Kanan) */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        
        {/* Pembungkus Navbar dengan tambahan Tombol Menu untuk Mobile */}
        <div className="flex items-center bg-white border-b border-gray-200">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-4 text-gray-500 focus:outline-none md:hidden hover:bg-gray-100"
          >
            {/* Tampilkan ikon silang (X) jika terbuka, ikon menu (Garis tiga) jika tertutup */}
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <Navbar 
            userName={userName} 
            userRole={userRole} 
            identifier={identifier} 
            className="flex-1 border-b-0" // Hapus border bawah ganda
          />
        </div>

        {/* Area Scrollable untuk Konten (Dashboard, Tabel, dll) */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
      
    </div>
  );
};