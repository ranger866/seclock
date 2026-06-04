"use client";

import React, { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { DashboardLayout } from "../../components/templates/DashboardLayout";
import {
  DoorOpen,
  Calendar,
  Clock,
  Shield,
  Lock,
  Unlock,
  AlertCircle,
  Users,
  Activity,
  Info,
  Key,
} from "lucide-react";
import { Role } from "../../types";
import Link from "next/link";

// Tipe data gabungan (Schedules + Reservations) agar dirender di satu komponen kartu yang sama
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

export default function DashboardPage() {
  const { data: session } = useSession();
  const userSession = session?.user as
    | { id: string; name?: string; role?: Role; identifier?: string }
    | undefined;
  const userRole = userSession?.role || "mahasiswa";
  const userIdentifier = userSession?.identifier || "";

  const [currentTime, setCurrentTime] = useState(new Date());
  const [adminStats, setAdminStats] = useState({
    rooms: 0,
    schedules: 0,
    users: 0,
    todayScheduled: 0,
    todayAvailable: 0,
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  const days = [
    "Hari Ini",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
    "Minggu",
  ];
  const [selectedDay, setSelectedDay] = useState("Hari Ini");

  // Menggunakan State Data Terpadu
  const [unifiedData, setUnifiedData] = useState<UnifiedCardData[]>([]);
  const [roomsForOperator, setRoomsForOperator] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const daysIndo = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];
  const currentDayName = daysIndo[currentTime.getDay()];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update tiap 1 menit
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      if (userRole === "admin") {
        const [resRooms, resSched, resUsers, resLogs] = await Promise.all([
          fetch("/api/rooms"),
          fetch("/api/schedule"),
          fetch("/api/users"),
          fetch("/api/logs"),
        ]);
        const jsonRooms = await resRooms.json();
        const jsonSched = await resSched.json();
        const jsonUsers = await resUsers.json();
        const jsonLogs = await resLogs.json();

        let todayScheduledCount = 0;
        const totalRoomsCount = jsonRooms.success ? jsonRooms.data.length : 0;

        if (jsonSched.success) {
          todayScheduledCount = jsonSched.data.filter(
            (s: any) => s.day === currentDayName,
          ).length;
        }

        const uniqueRoomsUsedToday = new Set(
          jsonSched.data
            ?.filter((s: any) => s.day === currentDayName)
            .map((s: any) => s.room_name),
        ).size;

        setAdminStats({
          rooms: totalRoomsCount,
          schedules: jsonSched.success ? jsonSched.data.length : 0,
          users: jsonUsers.success ? jsonUsers.data.length : 0,
          todayScheduled: todayScheduledCount,
          todayAvailable: totalRoomsCount - uniqueRoomsUsedToday,
        });

        if (jsonLogs.success) setRecentLogs(jsonLogs.data.slice(0, 5));
      } else if (userRole === "operator") {
        const res = await fetch("/api/rooms");
        const json = await res.json();
        if (json.success) setRoomsForOperator(json.data);
      } else {
        // TAMPILAN DOSEN/MHS: Tarik Jadwal dan Reservasi, lalu gabungkan
        const [resSched, resReserv] = await Promise.all([
          fetch("/api/schedule"),
          fetch("/api/reservations"),
        ]);

        const jsonSched = await resSched.json();
        const jsonReserv = await resReserv.json();

        let combined: UnifiedCardData[] = [];

        if (jsonSched.success) {
          const normSched = jsonSched.data.map((s: any) => ({
            type: "schedule" as const,
            id: s.id,
            unique_key: `sched_${s.id}`,
            day: s.day,
            start_time: s.start_time,
            end_time: s.end_time,
            subject_name: s.subject_name,
            room_name: s.room_name,
            location: s.location,
            PIC_name: s.dosen_name,
            dosen_identifier: s.dosen_identifier,
            ketua_identifier: s.ketua_identifier,
            door_status: s.door_status || 0,
          }));
          combined = [...combined, ...normSched];
        }

        if (jsonReserv.success) {
          // Hanya ambil reservasi yang disetujui (Approved)
          const approvedRes = jsonReserv.data.filter(
            (r: any) => r.status === "approved",
          );
          const normRes = approvedRes.map((r: any) => {
            // Konversi tanggal reservasi menjadi nama hari agar Smart Chips berfungsi
            const rDate = new Date(r.reservation_date);
            const dayName = daysIndo[rDate.getDay()];

            return {
              type: "reservation" as const,
              id: r.id,
              unique_key: `res_${r.id}`,
              day: dayName,
              start_time: r.start_time,
              end_time: r.end_time,
              subject_name: `Reservasi: ${r.unique_code}`,
              room_name: r.room_name,
              location: r.location,
              PIC_name: r.user_name,
              door_status: r.door_status || 0,
            };
          });
          combined = [...combined, ...normRes];
        }

        // Urutkan berdasarkan waktu mulai
        combined.sort((a, b) => a.start_time.localeCompare(b.start_time));
        setUnifiedData(combined);
      }
    } catch (error) {
      console.error("Gagal memuat data dasbor:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userSession) fetchDashboardData();
  }, [userSession, userRole, currentDayName]);

  // Logika Jendela Akses (Buffer ±15 Menit)
  const checkTimeTTL = (
    dayName: string,
    startTimeStr: string,
    endTimeStr: string,
  ) => {
    const dayMap: { [key: string]: number } = {
      Minggu: 0,
      Senin: 1,
      Selasa: 2,
      Rabu: 3,
      Kamis: 4,
      Jumat: 5,
      Sabtu: 6,
    };
    if (currentTime.getDay() !== dayMap[dayName]) return false;

    const [startH, startM] = startTimeStr.split(":").map(Number);
    const [endH, endM] = endTimeStr.split(":").map(Number);

    const targetStart = new Date(currentTime);
    targetStart.setHours(startH, startM, 0);
    const targetEnd = new Date(currentTime);
    targetEnd.setHours(endH, endM, 0);

    const bufferStart = new Date(targetStart.getTime() - 15 * 60000);
    const bufferEnd = new Date(targetEnd.getTime() + 15 * 60000);
    return currentTime >= bufferStart && currentTime <= bufferEnd;
  };

  const handleDoorControl = async (
    card: UnifiedCardData,
    targetState: number,
  ) => {
    try {
      // Arahkan ke endpoint yang sesuai dengan tipe kartunya
      const endpoint =
        card.type === "schedule"
          ? `/api/schedule/${card.id}`
          : `/api/reservations/${card.id}`;

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ door_status: targetState }),
      });

      const json = await res.json();
      if (json.success) fetchDashboardData();
      else alert(json.message);
    } catch (error) {
      alert("Gagal mengirim perintah ke perangkat.");
    }
  };

  const handleEndSession = async (data: UnifiedCardData) => {
    if (!confirm("Akhiri sesi sekarang? Pintu akan dikunci.")) return;

    try {
      // Tentukan endpoint berdasarkan tipe
      const isReservation = data.type === "reservation";
      const endpoint = isReservation
        ? `/api/reservations/${data.id}`
        : `/api/schedule/${data.id}`;

      // Siapkan body:
      // Reservasi diset 'completed', Jadwal TIDAK (karena berulang)
      const body: any = { door_status: 0 };
      if (isReservation) {
        body.status = "completed";
      }

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (json.success) {
        fetchDashboardData(); // Refresh data agar kartu hilang/update
      } else {
        alert(json.message || "Gagal mengakhiri sesi.");
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem.");
    }
  };

  const getDoorStatusInfo = (status: number) => {
    switch (status) {
      case 2:
        return {
          label: "Hold Open (Terbuka)",
          color: "bg-amber-100 text-amber-700",
          icon: <Lock className="w-3 h-3 mr-1" />,
        };
      case 1:
        return {
          label: "Membuka...",
          color: "bg-blue-100 text-blue-700",
          icon: <Unlock className="w-3 h-3 mr-1" />,
        };
      case 0:
      default:
        return {
          label: "Terkunci",
          color: "bg-gray-100 text-gray-600",
          icon: <Lock className="w-3 h-3 mr-1" />,
        };
    }
  };

  const isOperatorTimeValid = () => {
    const hours = currentTime.getHours();
    return hours >= 6 && hours < 17;
  };

  const formatTimeLog = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFilteredData = () => {
    const dayToFilter =
      selectedDay === "Hari Ini" ? currentDayName : selectedDay;
    return unifiedData.filter((d) => d.day === dayToFilter);
  };

  const filteredData = getFilteredData();

  return (
    <DashboardLayout
      userName={userSession?.name || "Pengguna"}
      userRole={userRole}
      identifier={userIdentifier}
      onLogout={() => signOut({ callbackUrl: "/login" })}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Selamat Datang, {userSession?.name?.split(" ")[0] || "Admin"}!
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {userRole === "admin" &&
            "Ringkasan metrik dan log aktivitas Smart Lock hari ini."}
          {userRole === "operator" &&
            "Mode Maintenance: Akses pembersihan ruangan aktif pada jam kerja (06:00 - 17:00)."}
          {(userRole === "dosen" || userRole === "mahasiswa") &&
            "Gunakan kontrol akses di bawah pada jam perkuliahan atau reservasi Anda."}
        </p>
      </div>

      {isLoading ? (
        <div className="py-16 text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          <p className="mt-3 text-sm text-gray-500 font-medium">
            Menyelaraskan data...
          </p>
        </div>
      ) : (
        <>
          {/* ================= TAMPILAN ADMIN ================= */}
          {userRole === "admin" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                    <DoorOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Ruangan
                    </p>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {adminStats.rooms}
                    </h3>
                  </div>
                </div>
                <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Jadwal Aktif
                    </p>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {adminStats.schedules}
                    </h3>
                  </div>
                </div>
                <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Pengguna
                    </p>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {adminStats.users}
                    </h3>
                  </div>
                </div>
                <div className="p-5 bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-800 rounded-2xl shadow-sm flex items-center space-x-4 text-white">
                  <div className="p-3 bg-gray-700/50 rounded-xl">
                    <Info className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400">
                      Status ({currentDayName})
                    </p>
                    <div className="flex space-x-3 mt-1">
                      <p className="text-sm font-semibold">
                        <span className="text-emerald-400">
                          {adminStats.todayAvailable}
                        </span>{" "}
                        Tersedia
                      </p>
                      <p className="text-sm font-semibold">
                        <span className="text-amber-400">
                          {adminStats.todayScheduled}
                        </span>{" "}
                        Terjadwal
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-gray-500" />
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                      Aktivitas Akses Terbaru
                    </h3>
                  </div>
                  <Link
                    href="/dashboard/logs"
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase"
                  >
                    Lihat Semua Log
                  </Link>
                </div>
                <div className="p-0">
                  {recentLogs.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {recentLogs.map((log) => (
                        <li
                          key={log.id}
                          className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div
                              className={`p-2 rounded-full ${log.status === "success" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
                            >
                              <DoorOpen className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {log.operator_name}{" "}
                                <span className="text-gray-400 font-normal">
                                  mengakses
                                </span>{" "}
                                {log.room_name}
                              </p>
                              <p
                                className={`text-xs font-medium ${log.status === "success" ? "text-green-600" : "text-red-600"}`}
                              >
                                {log.action}
                              </p>
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
                    <div className="p-8 text-center text-gray-500 text-sm">
                      Belum ada aktivitas pintu hari ini.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAMPILAN OPERATOR ================= */}
          {userRole === "operator" && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {roomsForOperator.map((room) => {
                const timeValid = isOperatorTimeValid();
                return (
                  <div
                    key={room.id}
                    className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                          <DoorOpen className="w-5 h-5" />
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded tracking-wider ${room.status === "active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                        >
                          {room.status}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-base">
                        {room.room_name}
                      </h3>
                      <p className="text-xs text-gray-500 mb-4">
                        {room.location}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-gray-100">
                      {timeValid && room.status === "active" ? (
                        <button
                          onClick={() =>
                            alert(
                              `Sinyal Temp-Open dikirim ke ${room.room_name}`,
                            )
                          }
                          className="w-full flex items-center justify-center py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl"
                        >
                          <Key className="w-4 h-4 mr-2" /> Buka Pintu (Clean-Up)
                        </button>
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

          {(userRole === "dosen" || userRole === "mahasiswa") && (
            <>
              <div className="flex items-center space-x-2 pb-4 mb-6 overflow-x-auto no-scrollbar border-b border-gray-100">
                {days.map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-full tracking-wide transition-all whitespace-nowrap ${selectedDay === day ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    {day}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredData.length > 0 ? (
                  filteredData.map((data) => {
                    const hasTimeAccess = checkTimeTTL(
                      data.day,
                      data.start_time,
                      data.end_time,
                    );
                    const statusInfo = getDoorStatusInfo(data.door_status); // <--- Helper dipanggil di sini

                    // Evaluasi Kepemilikan Akses (RBAC)
                    let hasControlWand = false;
                    if (data.type === "schedule") {
                      const isOwnerDosen =
                        userRole === "dosen" &&
                        userIdentifier === data.dosen_identifier;
                      const isOwnerKetua =
                        userRole === "mahasiswa" &&
                        userIdentifier === data.ketua_identifier;
                      hasControlWand = isOwnerDosen || isOwnerKetua;
                    } else {
                      hasControlWand = true;
                    }

                    return (
                      <div
                        key={data.unique_key}
                        className={`bg-white border ${data.type === "reservation" ? "border-amber-200" : "border-gray-200"} rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-gray-300 transition-all`}
                      >
                        <div>
                          {/* Header: Nama Ruangan & Badge Status */}
                          <div className="flex items-center justify-between mb-3">
                            <span
                              className={`text-xs font-bold px-2.5 py-1 rounded-lg ${data.type === "reservation" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}
                            >
                              {data.room_name}
                            </span>

                            {/* Badge Status Pintu */}
                            <span
                              className={`flex items-center text-[10px] font-bold px-2 py-1 rounded-full ${statusInfo.color}`}
                            >
                              {statusInfo.icon}
                              {statusInfo.label}
                            </span>
                          </div>

                          <div className="flex items-center text-gray-400 text-xs font-mono mb-2">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            {data.start_time.slice(0, 5)} -{" "}
                            {data.end_time.slice(0, 5)}
                          </div>

                          <h3 className="font-bold text-gray-900 text-base line-clamp-1">
                            {data.subject_name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5 mb-3">
                            {data.location}
                          </p>

                          <div className="flex items-center space-x-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-xl mb-4">
                            <Shield className="w-3.5 h-3.5 text-gray-400" />
                            <span className="truncate">
                              PIC: <b>{data.PIC_name}</b>
                            </span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                          {hasControlWand && hasTimeAccess ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => handleDoorControl(data, 1)}
                                  className="flex items-center justify-center py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl"
                                >
                                  <Unlock className="w-3.5 h-3.5 mr-1.5" /> Buka
                                  Sekali
                                </button>

                                <button
                                  onClick={() =>
                                    handleDoorControl(
                                      data,
                                      data.door_status === 2 ? 0 : 2,
                                    )
                                  }
                                  className={`flex items-center justify-center py-2 text-xs font-semibold rounded-xl ${data.door_status === 2 ? "bg-amber-500 text-white" : "text-amber-700 bg-amber-50 hover:bg-amber-100"}`}
                                >
                                  <Lock className="w-3.5 h-3.5 mr-1.5" />{" "}
                                  {data.door_status === 2
                                    ? "Hold Active"
                                    : "Hold Open"}
                                </button>
                              </div>

                              <button
                                onClick={() => handleEndSession(data)}
                                className="w-full py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                              >
                                Akhiri Sesi (End Class)
                              </button>
                            </div>
                          ) : hasControlWand && !hasTimeAccess ? (
                            <div className="flex items-center text-gray-500 text-xs bg-gray-50 p-2.5 rounded-xl">
                              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
                              <span>
                                Tombol aktif 15 menit sebelum & sesudah sesi.
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center text-gray-400 text-xs italic p-2">
                              Hanya dapat diakses oleh Penanggung Jawab.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
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
