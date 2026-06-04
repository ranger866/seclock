"use client";

import React, { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import useSWR from "swr";
import Swal from "sweetalert2"; // <-- Import SweetAlert2
import { DashboardLayout } from "../../components/templates/DashboardLayout";
import { DoorOpen, Calendar, Clock, Shield, Lock, Unlock, AlertCircle, Users, Activity, Info, Key, Loader2 } from "lucide-react";
import { Role } from "../../types";
import Link from "next/link";

interface UnifiedCardData {
  type: "schedule" | "reservation";
  id: number;
  unique_key: string;
  day: string;
  start_time: string;
  end_time: string;
  subject_name: string;
  room_name: string;
  location: string;
  PIC_name: string;
  dosen_identifier?: string;
  ketua_identifier?: string;
  door_status: number;
}

// Konfigurasi Notifikasi Toast (Tidak menutupi layar)
const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

export default function DashboardPage() {
  const { data: session } = useSession();
  const userSession = session?.user as { id: string; name?: string; role?: Role; identifier?: string } | undefined;
  const userRole = userSession?.role || "mahasiswa";
  const userIdentifier = userSession?.identifier || "";

  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState("Hari Ini");
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  const days = ["Hari Ini", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  const daysIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const currentDayName = daysIndo[currentTime.getDay()];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const dashboardFetcher = async () => {
    let result = {
      adminStats: { rooms: 0, schedules: 0, users: 0, todayScheduled: 0, todayAvailable: 0 },
      recentLogs: [] as any[],
      roomsForOperator: [] as any[],
      unifiedData: [] as UnifiedCardData[],
    };

    if (userRole === "admin") {
      const [resRooms, resSched, resUsers, resLogs] = await Promise.all([
        fetch("/api/rooms").then(r => r.json()),
        fetch("/api/schedule").then(r => r.json()),
        fetch("/api/users").then(r => r.json()),
        fetch("/api/logs").then(r => r.json()),
      ]);

      const todayScheduledCount = resSched.success ? resSched.data.filter((s: any) => s.day === currentDayName).length : 0;
      const totalRoomsCount = resRooms.success ? resRooms.data.length : 0;
      const uniqueRoomsUsedToday = new Set(resSched.data?.filter((s: any) => s.day === currentDayName).map((s: any) => s.room_name)).size;

      result.adminStats = {
        rooms: totalRoomsCount, schedules: resSched.success ? resSched.data.length : 0,
        users: resUsers.success ? resUsers.data.length : 0, todayScheduled: todayScheduledCount,
        todayAvailable: totalRoomsCount - uniqueRoomsUsedToday,
      };
      if (resLogs.success) result.recentLogs = resLogs.data.slice(0, 5);

    } else if (userRole === "operator") {
      const res = await fetch("/api/rooms").then(r => r.json());
      if (res.success) result.roomsForOperator = res.data;
    } else {
      const [resSched, resReserv] = await Promise.all([
        fetch("/api/schedule").then(r => r.json()),
        fetch("/api/reservations").then(r => r.json()),
      ]);

      let combined: UnifiedCardData[] = [];
      if (resSched.success) {
        combined = [...combined, ...resSched.data.map((s: any) => ({
          type: "schedule", id: s.id, unique_key: `sched_${s.id}`, day: s.day,
          start_time: s.start_time, end_time: s.end_time, subject_name: s.subject_name,
          room_name: s.room_name, location: s.location, PIC_name: s.dosen_name,
          dosen_identifier: s.dosen_identifier, ketua_identifier: s.ketua_identifier, door_status: s.door_status || 0,
        }))];
      }
      if (resReserv.success) {
        combined = [...combined, ...resReserv.data.filter((r: any) => r.status === "approved").map((r: any) => ({
          type: "reservation", id: r.id, unique_key: `res_${r.id}`, day: daysIndo[new Date(r.reservation_date).getDay()],
          start_time: r.start_time, end_time: r.end_time, subject_name: `Reservasi: ${r.unique_code}`,
          room_name: r.room_name, location: r.location, PIC_name: r.user_name, door_status: r.door_status || 0,
        }))];
      }
      combined.sort((a, b) => a.start_time.localeCompare(b.start_time));
      result.unifiedData = combined;
    }
    return result;
  };

  const { data: dashboardData, mutate, isLoading } = useSWR(
    userSession ? `dashboard_${userRole}_${currentDayName}` : null, dashboardFetcher, { refreshInterval: 3000, revalidateOnFocus: true }
  );

  const checkTimeTTL = (dayName: string, startTimeStr: string, endTimeStr: string) => {
    const dayMap: { [key: string]: number } = { Minggu: 0, Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5, Sabtu: 6 };
    if (currentTime.getDay() !== dayMap[dayName]) return false;
    const [startH, startM] = startTimeStr.split(":").map(Number);
    const [endH, endM] = endTimeStr.split(":").map(Number);
    const targetStart = new Date(currentTime); targetStart.setHours(startH, startM, 0);
    const targetEnd = new Date(currentTime); targetEnd.setHours(endH, endM, 0);
    const bufferStart = new Date(targetStart.getTime() - 15 * 60000);
    const bufferEnd = new Date(targetEnd.getTime() + 15 * 60000);
    return currentTime >= bufferStart && currentTime <= bufferEnd;
  };

  const isOperatorTimeValid = () => {
    const hours = currentTime.getHours();
    return hours >= 6 && hours < 17;
  };

  // =========================================================================
  // SWEETALERT IMPLEMENTATION: ACTION HANDLERS
  // =========================================================================
  const handleOperatorAction = async (roomId: number, roomName: string, action: 'hold' | 'end') => {
    setLoadingActionId(`op_${action}_${roomId}`);
    try {
      const res = await fetch("/api/operator/cleanup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_id: roomId, action: action }),
      });
      const json = await res.json();
      if (json.success) {
        Toast.fire({ icon: "success", title: json.message });
        mutate();
      } else {
        Swal.fire("Gagal", json.message || "Gagal mengirim sinyal.", "error");
      }
    } catch (error) {
      Swal.fire("Kesalahan Jaringan", "Terjadi kesalahan sistem.", "error");
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleDoorControl = async (card: UnifiedCardData, targetState: number) => {
    setLoadingActionId(card.unique_key);
    try {
      const endpoint = card.type === "schedule" ? `/api/schedule/${card.id}` : `/api/reservations/${card.id}`;
      const res = await fetch(endpoint, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ door_status: targetState }),
      });
      const json = await res.json();
      if (json.success) {
        Toast.fire({ icon: "success", title: json.message });
        mutate();
      } else {
        Swal.fire("Perhatian", json.message, "warning");
      }
    } catch (error) {
      Swal.fire("Gagal", "Perintah gagal dikirim ke perangkat.", "error");
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleEndSession = async (card: UnifiedCardData) => {
    // SweetAlert Konfirmasi
    const result = await Swal.fire({
      title: "Akhiri Sesi?",
      text: "Pintu akan langsung dikunci. Anda yakin?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Kunci Pintu",
      cancelButtonText: "Batal"
    });

    if (!result.isConfirmed) return;

    setLoadingActionId(`end_${card.unique_key}`);
    try {
      const endpoint = card.type === "reservation" ? `/api/reservations/${card.id}` : `/api/schedule/${card.id}`;
      const body: any = { door_status: 0 };
      if (card.type === "reservation") body.status = "completed";

      const res = await fetch(endpoint, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (json.success) {
        Toast.fire({ icon: "success", title: "Sesi berhasil diakhiri." });
        mutate();
      } else {
        Swal.fire("Gagal", json.message, "error");
      }
    } catch (error) {
      Swal.fire("Sistem Error", "Terjadi kesalahan sistem.", "error");
    } finally {
      setLoadingActionId(null);
    }
  };

  const formatTimeLog = (dateString: string) => new Date(dateString).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  const getDoorStatusInfo = (status: number) => {
    switch (status) {
      case 2: return { label: "Hold Open (Terbuka)", color: "bg-amber-100 text-amber-700", icon: <Lock className="w-3 h-3 mr-1" /> };
      case 1: return { label: "Membuka...", color: "bg-blue-100 text-blue-700", icon: <Unlock className="w-3 h-3 mr-1" /> };
      case 0: default: return { label: "Terkunci", color: "bg-gray-100 text-gray-600", icon: <Lock className="w-3 h-3 mr-1" /> };
    }
  };

  const filteredData = dashboardData?.unifiedData.filter((d) => d.day === (selectedDay === "Hari Ini" ? currentDayName : selectedDay)) || [];

  return (
    <DashboardLayout userName={userSession?.name || "Pengguna"} userRole={userRole} identifier={userIdentifier} onLogout={() => signOut({ callbackUrl: "/login" })}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Selamat Datang, {userSession?.name?.split(" ")[0] || "Admin"}!</h2>
        <p className="mt-1 text-sm text-gray-500">
          {userRole === "admin" && "Ringkasan metrik dan log aktivitas Smart Lock hari ini."}
          {userRole === "operator" && "Mode Maintenance: Akses pembersihan ruangan aktif pada jam kerja (06:00 - 17:00)."}
          {(userRole === "dosen" || userRole === "mahasiswa") && "Gunakan kontrol akses di bawah pada jam perkuliahan atau reservasi Anda."}
        </p>
      </div>

      {isLoading && !dashboardData ? (
        <div className="py-16 text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          <p className="mt-3 text-sm text-gray-500 font-medium">Menyelaraskan data...</p>
        </div>
      ) : (
        <>
          {/* ================= TAMPILAN ADMIN ================= */}
          {userRole === "admin" && dashboardData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><DoorOpen className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Ruangan</p>
                    <h3 className="text-2xl font-bold text-gray-900">{dashboardData.adminStats.rooms}</h3>
                  </div>
                </div>
                <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><Calendar className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Jadwal Aktif</p>
                    <h3 className="text-2xl font-bold text-gray-900">{dashboardData.adminStats.schedules}</h3>
                  </div>
                </div>
                <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><Users className="w-6 h-6" /></div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Pengguna</p>
                    <h3 className="text-2xl font-bold text-gray-900">{dashboardData.adminStats.users}</h3>
                  </div>
                </div>
                <div className="p-5 bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-2xl shadow-sm flex items-center space-x-4 text-white">
                  <div className="p-3 bg-gray-700/50 rounded-xl"><Info className="w-6 h-6 text-blue-400" /></div>
                  <div>
                    <p className="text-xs font-medium text-gray-400">Status ({currentDayName})</p>
                    <div className="flex space-x-3 mt-1">
                      <p className="text-sm font-semibold"><span className="text-emerald-400">{dashboardData.adminStats.todayAvailable}</span> Tersedia</p>
                      <p className="text-sm font-semibold"><span className="text-amber-400">{dashboardData.adminStats.todayScheduled}</span> Terjadwal</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-gray-500" />
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Aktivitas Akses Terbaru</h3>
                  </div>
                  <Link href="/dashboard/logs" className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase">Lihat Semua Log</Link>
                </div>
                <div className="p-0">
                  {dashboardData.recentLogs.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {dashboardData.recentLogs.map((log: any) => (
                        <li key={log.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-full ${log.status === "success" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                              <DoorOpen className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {log.operator_name} <span className="text-gray-400 font-normal">mengakses</span> {log.room_name}
                              </p>
                              <p className={`text-xs font-medium ${log.status === "success" ? "text-green-600" : "text-red-600"}`}>{log.action}</p>
                            </div>
                          </div>
                          <div className="flex items-center text-gray-400 text-xs font-mono">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            {formatTimeLog(log.accessed_at)}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-8 text-center text-gray-500 text-sm">Belum ada aktivitas pintu hari ini.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAMPILAN OPERATOR ================= */}
          {userRole === "operator" && dashboardData && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {dashboardData.roomsForOperator.map((room) => {
                const timeValid = isOperatorTimeValid();
                const isLoadingHold = loadingActionId === `op_hold_${room.id}`;
                const isLoadingEnd = loadingActionId === `op_end_${room.id}`;

                return (
                  <div key={room.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="p-2 bg-purple-50 text-purple-600 rounded-xl"><DoorOpen className="w-5 h-5" /></span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded tracking-wider ${room.status === "active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                          {room.status}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-base">{room.room_name}</h3>
                      <p className="text-xs text-gray-500 mb-4">{room.location}</p>
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                      {timeValid && room.status === "active" ? (
                        <div className="space-y-2">
                          <button
                            onClick={() => handleOperatorAction(room.id, room.room_name, 'hold')}
                            disabled={isLoadingHold || isLoadingEnd}
                            className="w-full flex items-center justify-center py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl disabled:opacity-50 transition-colors"
                          >
                            {isLoadingHold ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Unlock className="w-4 h-4 mr-2" />} 
                            Hold Open (Mulai Bersih)
                          </button>
                          <button
                            onClick={() => handleOperatorAction(room.id, room.room_name, 'end')}
                            disabled={isLoadingHold || isLoadingEnd}
                            className="w-full flex items-center justify-center py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl disabled:opacity-50 transition-colors"
                          >
                            {isLoadingEnd ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />} 
                            Akhiri Sesi (Kunci)
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center text-amber-600 text-xs bg-amber-50 p-2.5 rounded-xl">
                          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>Akses dikunci. Aktif pk 06:00-17:00.</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ================= TAMPILAN DOSEN/MHS ================= */}
          {(userRole === "dosen" || userRole === "mahasiswa") && dashboardData && (
            <>
              <div className="flex items-center space-x-2 pb-4 mb-6 overflow-x-auto no-scrollbar border-b border-gray-100">
                {days.map((day) => (
                  <button key={day} onClick={() => setSelectedDay(day)}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-full tracking-wide transition-all whitespace-nowrap ${selectedDay === day ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {day}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredData.length > 0 ? filteredData.map((data) => {
                  const hasTimeAccess = checkTimeTTL(data.day, data.start_time, data.end_time);
                  const statusInfo = getDoorStatusInfo(data.door_status);
                  
                  let hasControlWand = data.type !== "schedule" || 
                    (userRole === "dosen" && userIdentifier === data.dosen_identifier) ||
                    (userRole === "mahasiswa" && userIdentifier === data.ketua_identifier);

                  const isThisCardActionLoading = loadingActionId === data.unique_key;
                  const isThisCardEndLoading = loadingActionId === `end_${data.unique_key}`;

                  return (
                    <div key={data.unique_key} className={`bg-white border ${data.type === "reservation" ? "border-amber-200" : "border-gray-200"} rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-gray-300 transition-all`}>
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${data.type === "reservation" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>
                            {data.room_name}
                          </span>
                          <span className={`flex items-center text-[10px] font-bold px-2 py-1 rounded-full transition-colors duration-500 ${statusInfo.color}`}>
                            {statusInfo.icon} {statusInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-400 text-xs font-mono mb-2">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {data.start_time.slice(0, 5)} - {data.end_time.slice(0, 5)}
                        </div>
                        <h3 className="font-bold text-gray-900 text-base line-clamp-1">{data.subject_name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5 mb-3">{data.location}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-xl mb-4">
                          <Shield className="w-3.5 h-3.5 text-gray-400" />
                          <span className="truncate">PIC: <b>{data.PIC_name}</b></span>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-gray-100">
                        {hasControlWand && hasTimeAccess ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => handleDoorControl(data, 1)}
                                disabled={isThisCardActionLoading}
                                className="flex items-center justify-center py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl disabled:opacity-50"
                              >
                                {isThisCardActionLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Unlock className="w-3.5 h-3.5 mr-1.5" />} Buka Sekali
                              </button>
                              <button
                                onClick={() => handleDoorControl(data, data.door_status === 2 ? 0 : 2)}
                                disabled={isThisCardActionLoading}
                                className={`flex items-center justify-center py-2 text-xs font-semibold rounded-xl disabled:opacity-50 ${data.door_status === 2 ? "bg-amber-500 text-white" : "text-amber-700 bg-amber-50 hover:bg-amber-100"}`}
                              >
                                {isThisCardActionLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Lock className="w-3.5 h-3.5 mr-1.5" />}
                                {data.door_status === 2 ? "Hold Active" : "Hold Open"}
                              </button>
                            </div>
                            <button
                              onClick={() => handleEndSession(data)}
                              disabled={isThisCardEndLoading}
                              className="w-full py-2 flex justify-center text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-50"
                            >
                              {isThisCardEndLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : "Akhiri Sesi (End Class)"}
                            </button>
                          </div>
                        ) : hasControlWand && !hasTimeAccess ? (
                          <div className="flex items-center text-gray-500 text-xs bg-gray-50 p-2.5 rounded-xl">
                            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
                            <span>Tombol aktif 15 menit sebelum & sesudah sesi.</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-400 text-xs italic p-2">Hanya dapat diakses oleh Penanggung Jawab.</div>
                        )}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="col-span-full py-12 text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-gray-500 text-sm">
                    Tidak ada jadwal atau reservasi yang berjalan di filter ini.
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </DashboardLayout>
  );
}