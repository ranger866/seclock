import React from "react";
import { Bell, UserCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import { Role } from "../../types";

export interface NavbarProps {
  userName: string;
  userRole: Role;
  identifier: string; // NIM atau NIP
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ userName, userRole, identifier, className }) => {
  return (
    <header className={cn("flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 shadow-sm", className)}>
      
      {/* Bagian Kiri: Breadcrumb atau Teks Sambutan */}
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-gray-800">
          Selamat datang, {userName.split(" ")[0]}! 
        </h2>
      </div>

      {/* Bagian Kanan: Notifikasi & Profil */}
      <div className="flex items-center space-x-4">
        
        {/* Tombol Notifikasi (Bisa dikembangkan nanti untuk notif reservasi approve/reject) */}
        <button className="relative p-2 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        {/* Pemisah Vertikal */}
        <div className="h-6 w-px bg-gray-200"></div>

        {/* Identitas Profil */}
        <div className="flex items-center space-x-3">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500 capitalize">
              {userRole} • {identifier}
            </p>
          </div>
          <div className="flex-shrink-0">
            <UserCircle className="w-9 h-9 text-gray-300" />
          </div>
        </div>
        
      </div>
    </header>
  );
};