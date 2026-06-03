import React from "react";
import Link from "next/link";
import { 
  LayoutDashboard, 
  CalendarDays, 
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
  // Definisi semua kemungkinan menu
  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "dosen", "mahasiswa", "operator"] },
    { name: "Jadwal & Reservasi", href: "/dashboard/schedule", icon: CalendarDays, roles: ["admin", "dosen", "mahasiswa"] },
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
      <nav className="flex-grow py-6 px-4 space-y-1">
        {filteredMenu.map((item) => {
          const Icon = item.icon;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className="flex items-center px-4 py-3 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Tombol Logout di paling bawah */}
      <div className="p-4 border-t border-gray-800">
        <button 
          onClick={onLogout}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-400 rounded-lg hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Keluar Sistem
        </button>
      </div>
    </aside>
  );
};