"use client";

import React, { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { DashboardLayout } from "../../components/templates/DashboardLayout";
import { DoorOpen, Users, Calendar, Activity, Clock } from "lucide-react";
import { Role } from "../../types";
import Link from "next/link";

export default function DashboardHomePage() {
  const { data: session } = useSession();
  const userSession = session?.user as { name?: string; role?: Role; identifier?: string } | undefined;
  const isUserAdmin = userSession?.role === "admin";

  // State untuk menyimpan ringkasan data
  const [stats, setStats] = useState({
    rooms: 0,
    schedules: 0,
    users: 0,
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Tarik data ruangan, jadwal, dan log secara bersamaan
        const [resRooms, resSched, resLogs] = await Promise.all([
          fetch("/api/rooms"),
          fetch("/api/schedule"),
          fetch("/api/logs")
        ]);

        const jsonRooms = await resRooms.json();
        const jsonSched = await resSched.json();
        const jsonLogs = await resLogs.json();

        let usersCount = 0;
        // Hanya fetch data user jika yang login adalah Admin (untuk menghindari error 403)
        if (isUserAdmin) {
          const resUsers = await fetch("/api/users");
          const jsonUsers = await resUsers.json();
          if (jsonUsers.success) usersCount = jsonUsers.data.length;
        }

        setStats({
          rooms: jsonRooms.success ? jsonRooms.data.length : 0,
          schedules: jsonSched.success ? jsonSched.data.length : 0,
          users: usersCount,
        });

        // Ambil 5 log terbaru saja untuk di halaman depan
        if (jsonLogs.success) {
          setRecentLogs(jsonLogs.data.slice(0, 5));
        }

      } catch (error) {
        console.error("Gagal memuat data dasbor", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userSession) {
      fetchDashboardData();
    }
  }, [userSession, isUserAdmin]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <DashboardLayout
      userName={userSession?.name || "Pengguna"}
      userRole={userSession?.role || "mahasiswa"}
      identifier={userSession?.identifier || "-"}
      onLogout={() => signOut({ callbackUrl: "/login" })}
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Selamat datang, {userSession?.name?.split(' ')[0] || "Pengguna"}! 👋</h2>
        <p className="mt-1 text-sm text-gray-500">Berikut adalah ringkasan sistem Smart Lock hari ini.</p>
      </div>

      {/* Kartu Statistik */}
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
        {/* Kartu Ruangan */}
        <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <DoorOpen className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Ruangan</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {isLoading ? "..." : stats.rooms}
            </h3>
          </div>
        </div>

        {/* Kartu Jadwal */}
        <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Jadwal Aktif</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {isLoading ? "..." : stats.schedules}
            </h3>
          </div>
        </div>

        {/* Kartu Pengguna (Bisa disesuaikan tampilannya jika bukan admin) */}
        <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{isUserAdmin ? "Total Pengguna" : "Hak Akses Anda"}</p>
            <h3 className="text-2xl font-bold text-gray-900 capitalize">
              {isLoading ? "..." : (isUserAdmin ? stats.users : userSession?.role)}
            </h3>
          </div>
        </div>
      </div>

      {/* Tabel Aktivitas Terakhir */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Aktivitas Terbaru</h3>
          </div>
          <Link href="/dashboard/logs" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            Lihat Semua
          </Link>
        </div>
        
        <div className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Memuat data aktivitas...</div>
          ) : recentLogs.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {recentLogs.map((log) => (
                <li key={log.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${log.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      <DoorOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {log.operator_name} <span className="text-gray-400 font-normal">mencoba mengakses</span> {log.room_name}
                      </p>
                      <p className={`text-xs font-medium ${log.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {log.action}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-400 text-sm">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatTime(log.accessed_at)}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-gray-500">Belum ada aktivitas pintu hari ini.</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}