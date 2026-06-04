"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, Clock, MoreVertical, LogOut, Users, DoorClosed, History } from "lucide-react";
import { Role } from "../../types";

export const BottomBar = ({ userRole, onLogout }: { userRole: Role; onLogout: () => void }) => {
  const pathname = usePathname();
  const [isDropupOpen, setIsDropupOpen] = useState(false);

  // 1. Definisi menu yang SAMA dengan Sidebar
  const allMenuItems = [
    { name: "Dash", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "dosen", "mahasiswa", "operator"] },
    { name: "Jadwal", href: "/dashboard/schedule", icon: CalendarDays, roles: ["admin", "dosen", "mahasiswa"] },
    { name: "Reservasi", href: "/dashboard/reservations", icon: Clock, roles: ["admin", "dosen", "mahasiswa"] },
    { name: "Users", href: "/dashboard/users", icon: Users, roles: ["admin"] },
    { name: "Rooms", href: "/dashboard/rooms", icon: DoorClosed, roles: ["admin"] },
    { name: "Logs", href: "/dashboard/logs", icon: History, roles: ["admin"] },
  ];

  // 2. Filter berdasarkan role
  const allowedItems = allMenuItems.filter(item => item.roles.includes(userRole));
  
  // 3. Logika Penentuan Dropup: Jika elemen > 4, gunakan dropup. Jika tidak, tampilkan semua.
  const needsDropup = allowedItems.length > 4;
  
  const mainNav = needsDropup ? allowedItems.slice(0, 3) : allowedItems;
  const dropupNav = needsDropup ? allowedItems.slice(3) : [];

  return (
    <>
      {isDropupOpen && needsDropup && <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsDropupOpen(false)} />}

      {/* Dropup Menu (Hanya dirender jika perlu dropup) */}
      {isDropupOpen && needsDropup && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 z-50 p-5 rounded-t-3xl shadow-2xl animate-fade-in">
          <div className="grid grid-cols-3 gap-4">
            {dropupNav.map((item) => {
               const Icon = item.icon;
               const isActive = pathname === item.href;
               return (
                 <Link 
                   key={item.name} 
                   href={item.href} 
                   className="flex flex-col items-center p-3 rounded-2xl hover:bg-gray-50 transition-colors active:scale-95" 
                   onClick={() => setIsDropupOpen(false)}
                 >
                    <Icon className={`w-6 h-6 mb-1.5 ${isActive ? "text-blue-600" : "text-gray-600"}`}/> 
                    <span className={`text-xs font-semibold ${isActive ? "text-blue-700" : "text-gray-700"}`}>
                      {item.name}
                    </span>
                 </Link>
               )
            })}
            <button 
              onClick={() => { onLogout(); setIsDropupOpen(false); }} 
              className="flex flex-col items-center p-3 rounded-2xl hover:bg-red-50 text-red-600 transition-colors active:scale-95"
            >
                <LogOut className="w-6 h-6 mb-1.5"/> 
                <span className="text-xs font-semibold">Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-50 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href} 
              className={`flex flex-col items-center justify-center w-full h-full transition-colors active:scale-95 ${isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[11px] font-semibold tracking-wide mt-1">
                {item.name}
              </span>
            </Link>
          );
        })}
        
        {/* Jika butuh dropup, tampilkan tombol "Lainnya". Jika tidak, langsung tampilkan tombol "Logout". */}
        {needsDropup ? (
          <button 
            onClick={() => setIsDropupOpen(!isDropupOpen)} 
            className={`flex flex-col items-center justify-center w-full h-full transition-colors active:scale-95 ${isDropupOpen ? "text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            <MoreVertical className="w-6 h-6" />
            <span className="text-[11px] font-semibold tracking-wide mt-1">Lainnya</span>
          </button>
        ) : (
          <button 
            onClick={onLogout} 
            className="flex flex-col items-center justify-center w-full h-full text-red-500 hover:text-red-600 active:scale-95 transition-colors"
          >
            <LogOut className="w-6 h-6" />
            <span className="text-[11px] font-semibold tracking-wide mt-1">Logout</span>
          </button>
        )}
      </div>
    </>
  );
};