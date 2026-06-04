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
  
  // 3. Split menu: 3 pertama untuk Nav utama, sisanya untuk Dropup
  const mainNav = allowedItems.slice(0, 3);
  const dropupNav = allowedItems.slice(3);

  return (
    <>
      {isDropupOpen && <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setIsDropupOpen(false)} />}

      {/* Dropup Menu */}
      {isDropupOpen && (
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 z-50 p-4 rounded-t-2xl">
          <div className="grid grid-cols-3 gap-4">
            {dropupNav.map((item) => {
               const Icon = item.icon;
               return (
                 <Link key={item.name} href={item.href} className="flex flex-col items-center p-2" onClick={() => setIsDropupOpen(false)}>
                    <Icon className="w-6 h-6 text-gray-700"/> 
                    <span className="text-xs mt-1">{item.name}</span>
                 </Link>
               )
            })}
            <button onClick={() => { onLogout(); setIsDropupOpen(false); }} className="flex flex-col items-center p-2 text-red-600">
                <LogOut className="w-6 h-6"/> <span className="text-xs mt-1">Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-50 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {mainNav.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href} className={`flex flex-col items-center justify-center w-full h-full ${pathname === item.href ? "text-blue-600" : "text-gray-400"}`}>
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-bold mt-1">{item.name}</span>
            </Link>
          );
        })}
        <button onClick={() => setIsDropupOpen(!isDropupOpen)} className={`flex flex-col items-center justify-center w-full h-full ${isDropupOpen ? "text-blue-600" : "text-gray-400"}`}>
          <MoreVertical className="w-6 h-6" />
          <span className="text-[10px] font-bold mt-1">Lainnya</span>
        </button>
      </div>
    </>
  );
};