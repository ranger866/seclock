"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation"; // <-- Import usePathname
import { 
  LayoutDashboard, 
  CalendarDays, 
  Clock, 
  DoorClosed, 
  Users, 
  History,
  LogOut 
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Role } from "../../types";

export interface SidebarProps {
  userRole: Role;
  className?: string;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ userRole, className, onLogout }) => {
  const pathname = usePathname(); // <-- Ambil path URL saat ini

  // Definisi semua kemungkinan menu yang sudah dipisah
  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "dosen", "mahasiswa", "operator"] },
    { name: "Jadwal Perkuliahan", href: "/dashboard/schedule", icon: CalendarDays, roles: ["admin", "dosen", "mahasiswa"] },
    { name: "Reservasi Ruangan", href: "/dashboard/reservations", icon: Clock, roles: ["admin", "dosen", "mahasiswa"] },
    { name: "Manajemen Ruangan", href: "/dashboard/rooms", icon: DoorClosed, roles: ["admin"] },
    { name: "Manajemen Pengguna", href: "/dashboard/users", icon: Users, roles: ["admin"] },
    { name: "Log Akses", href: "/dashboard/logs", icon: History, roles: ["admin"] },
  ];

  // Filter menu berdasarkan role user yang sedang login
  const filteredMenu = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className={cn("flex flex-col w-64 h-screen bg-gray-900 text-white transition-all", className)}>
      {/* Logo & Judul */}
      <div className="flex items-center justify-center h-16 border-b border-gray-800">
        <h1 className="text-xl font-bold tracking-wider text-blue-400">
          SECURE<span className="text-white">LOCK</span>
        </h1>
      </div>

      {/* Navigasi Menu */}
      <nav className="flex-grow py-6 px-4 space-y-1.5">
        {filteredMenu.map((item) => {
          const Icon = item.icon;
          
          // Logika Active State: 
          // Jika href adalah "/dashboard", kita pakai exact match (===)
          // Jika href lainnya, kita pakai .startsWith() agar submenu tetap membuat parent-nya aktif
          const isActive = item.href === '/dashboard' 
            ? pathname === item.href 
            : pathname.startsWith(item.href);

          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                isActive 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" // <-- Gaya saat aktif
                  : "text-gray-400 hover:bg-gray-800 hover:text-white" // <-- Gaya saat tidak aktif
              )}
            >
              <Icon className={cn("w-5 h-5 mr-3 transition-colors", isActive ? "text-white" : "text-gray-400")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Tombol Logout di paling bawah */}
      <div className="p-4 border-t border-gray-800">
        <button 
          onClick={onLogout}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-400 rounded-xl hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Keluar Sistem
        </button>
      </div>
    </aside>
  );
};