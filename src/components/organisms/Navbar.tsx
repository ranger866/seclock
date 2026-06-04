"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, UserCircle, CheckCircle, XCircle, Info, Check, CheckCircle2 } from "lucide-react";
import useSWR from "swr";
import { cn } from "../../lib/utils";
import { Role } from "../../types";

export interface NavbarProps {
  userName: string;
  userRole: Role;
  identifier: string; // NIM atau NIP
  className?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const Navbar: React.FC<NavbarProps> = ({ userName, userRole, identifier, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // SWR: Tarik notifikasi terbaru tiap 5 detik
  const { data, mutate } = useSWR("/api/notifications", fetcher, { refreshInterval: 5000 });
  
  const notifications = data?.success ? data.data : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  // Tutup dropdown jika user klik di luar area dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fungsi menandai 1 notif sebagai sudah dibaca
  const markAsRead = async (id: number) => {
    // Update UI instan sebelum tunggu server (Optimistic Update)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = notifications.map((n: any) => n.id === id ? { ...n, is_read: true } : n);
    mutate({ ...data, data: updated }, false);

    await fetch(`/api/notifications`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    mutate(); // Sinkronisasi ulang dengan server
  };

  // Fungsi menandai SEMUA notif sebagai sudah dibaca
  const markAllAsRead = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = notifications.map((n: any) => ({ ...n, is_read: true }));
    mutate({ ...data, data: updated }, false);

    await fetch(`/api/notifications`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all" }),
    });
    mutate();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case "error": return <XCircle className="w-5 h-5 text-red-500" />;
      case "warning": return <Info className="w-5 h-5 text-amber-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <header className={cn("flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 shadow-sm relative z-40", className)}>
      
      {/* Bagian Kiri: Teks Sambutan */}
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-gray-800">
          Selamat datang, {userName.split(" ")[0]}! 
        </h2>
      </div>

      {/* Bagian Kanan: Notifikasi & Profil */}
      <div className="flex items-center space-x-4">
        
        {/* Tombol Notifikasi & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`relative p-2 rounded-full transition-colors ${isOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[14px] h-[14px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full border border-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Panel Dropdown Notifikasi */}
          {isOpen && (
            <div className="absolute -right-2 sm:right-0 mt-3 w-[calc(80vw-2rem)] sm:w-96 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-fade-in origin-top-right">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 text-sm">Notifikasi</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Tandai semua dibaca
                  </button>
                )}
              </div>
              
              <div className="max-h-[350px] overflow-y-auto no-scrollbar">
                {notifications.length > 0 ? (
                  <ul className="divide-y divide-gray-50">
                    {// eslint-disable-next-line @typescript-eslint/no-explicit-any
                    notifications.map((notif: any) => (
                      <li 
                        key={notif.id} 
                        onClick={() => !notif.is_read && markAsRead(notif.id)}
                        className={`flex gap-3 p-4 transition-colors ${notif.is_read ? 'bg-white opacity-60' : 'bg-blue-50/30 cursor-pointer hover:bg-blue-50/60'}`}
                      >
                        <div className="flex-shrink-0 mt-0.5">{getIcon(notif.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{notif.title}</p>
                          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{notif.message}</p>
                          <p className="text-[10px] text-gray-400 mt-2 font-mono">{formatTime(notif.created_at)}</p>
                        </div>
                        {!notif.is_read && (
                          <div className="flex-shrink-0 flex items-center">
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-8 text-center flex flex-col items-center">
                    <Bell className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500 font-medium">Belum ada notifikasi.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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