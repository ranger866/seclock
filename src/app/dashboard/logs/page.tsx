"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import useSWR from "swr";
import { DashboardLayout } from "../../../components/templates/DashboardLayout";
import { ShieldCheck, XCircle } from "lucide-react";
import { Role } from "../../../types";

interface LogData {
  id: number;
  accessed_at: string;
  action: string;
  status: "success" | "failed";
  room_name: string;
  operator_name: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LogsPage() {
  const { data: session } = useSession();
  const userSession = session?.user as { name?: string; role?: Role; identifier?: string } | undefined;

  // =========================================================================
  // SWR: Auto Refresh Log setiap 5 detik (Live View)
  // =========================================================================
  const { data: responseData, isLoading } = useSWR("/api/logs", fetcher, { 
    refreshInterval: 5000 // Tarik data baru di background tiap 5 detik
  });
  
  const logs: LogData[] = responseData?.success ? responseData.data : [];

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "-";

    // Mencegah "Double +8 Shift":
    // Hapus huruf 'Z' di akhir agar browser tidak menganggap ini waktu UTC
    // "2026-06-04T14:00:00.000Z" ---> "2026-06-04T14:00:00.000"
    const localString = dateString.endsWith('Z') 
      ? dateString.slice(0, -1) 
      : dateString;

    return new Date(localString).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "medium"
    });
  };

  return (
    <DashboardLayout userName={userSession?.name || "Pengguna"} userRole={userSession?.role || "mahasiswa"} identifier={userSession?.identifier || "-"} onLogout={() => signOut({ callbackUrl: "/login" })}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Log Akses Pintu <span className="text-xs ml-2 px-2 py-1 bg-green-100 text-green-700 rounded-full inline-flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-1 animate-pulse"></span>Live</span></h2>
        <p className="mt-1 text-sm text-gray-500">Riwayat lengkap aktivitas pembukaan pintu oleh pengguna dan sistem (Otomatis update).</p>
      </div>

      {/* Tabel Desktop */}
      <div className="hidden md:block overflow-hidden bg-white border border-gray-200 rounded-xl shadow-sm">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Waktu Akses</th>
              <th className="px-6 py-4">Pengguna / Perangkat</th>
              <th className="px-6 py-4">Ruangan</th>
              <th className="px-6 py-4">Tindakan & Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && logs.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-10 text-center"><div className="inline-block w-6 h-6 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div></td></tr>
            ) : logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">{formatDateTime(log.accessed_at)}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{log.operator_name}</td>
                  <td className="px-6 py-4">{log.room_name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {log.status === "success" ? <ShieldCheck className="w-4 h-4 mr-2 text-green-500" /> : <XCircle className="w-4 h-4 mr-2 text-red-500" />}
                      <span className={`font-semibold ${log.status === "success" ? "text-green-700" : "text-red-700"}`}>{log.action}</span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">Belum ada riwayat aktivitas pintu.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Kartu Mobile */}
      <div className="md:hidden space-y-3 mb-20">
        {isLoading && logs.length === 0 ? (
          <div className="text-center py-10 text-gray-500">Memuat Live Log...</div>
        ) : logs.length > 0 ? (
          logs.map((log) => (
            <div key={log.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  {log.status === "success" ? <ShieldCheck className="w-4 h-4 mr-2 text-green-500" /> : <XCircle className="w-4 h-4 mr-2 text-red-500" />}
                  <span className={`font-bold ${log.status === "success" ? "text-green-700" : "text-red-700"}`}>{log.action}</span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">{formatDateTime(log.accessed_at)}</span>
              </div>
              <div className="text-sm border-t pt-2 mt-1">
                <p className="font-medium text-gray-900">{log.operator_name}</p>
                <p className="text-xs text-gray-500">Ruangan: {log.room_name}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500">Belum ada riwayat aktivitas.</div>
        )}
      </div>
    </DashboardLayout>
  );
}