"use client";

import React, { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { DashboardLayout } from "../../../components/templates/DashboardLayout";
import { Plus, Check, X, Clock } from "lucide-react";
import { Badge } from "../../../components/atoms/Badge";
import { FAB } from "@/components/atoms/FloatingButtonAction";
import { Role } from "../../../types";

interface ReservationData {
  id: number;
  room_name: string;
  user_name: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  unique_code: string;
  status: "pending" | "approved" | "rejected";
}

export default function ReservationsPage() {
  const { data: session } = useSession();
  const userSession = session?.user as
    | { name?: string; role?: Role; identifier?: string }
    | undefined;
  const isUserAdmin = userSession?.role === "admin";

  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [rooms, setRooms] = useState<{ id: number; room_name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    room_id: 0,
    reservation_date: "",
    start_time: "10:00",
    end_time: "12:00",
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // PERBAIKAN: Menggunakan Promise.all agar fetch berjalan paralel bersamaan
      const [resReservations, resRooms] = await Promise.all([
        fetch("/api/reservations"),
        fetch("/api/rooms"),
      ]);

      const jsonReservations = await resReservations.json();
      const jsonRooms = await resRooms.json();

      // Auto-batching state updates
      if (jsonReservations.success) setReservations(jsonReservations.data);
      if (jsonRooms.success) setRooms(jsonRooms.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      alert(json.message);
      if (json.success) {
        setIsModalOpen(false);
        fetchData();
      }
    } catch (error) {
      alert("Sistem error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidation = async (id: number, newStatus: string) => {
    if (!confirm(`Tandai reservasi ini sebagai ${newStatus}?`)) return;
    try {
      const res = await fetch("/api/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const json = await res.json();
      if (json.success) fetchData();
    } catch (error) {
      alert("Gagal memvalidasi");
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "approved")
      return <Badge variant="success">Disetujui</Badge>;
    if (status === "rejected") return <Badge variant="danger">Ditolak</Badge>;
    return <Badge variant="warning">Menunggu Validasi</Badge>;
  };

  return (
    <DashboardLayout
      userName={userSession?.name || ""}
      userRole={userSession?.role || "mahasiswa"}
      identifier={userSession?.identifier || ""}
      onLogout={() => signOut({callbackUrl: "/login"})}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Reservasi Insidental
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Peminjaman ruangan di luar jadwal tetap (Jam Malam membutuhkan validasi).
          </p>
        </div>

        {/* 🔒 RBAC: Tombol Tambah & FAB hanya muncul jika bukan operator */}
        {userSession?.role !== "operator" && (
          <>
            {/* Tombol Desktop */}
            <button
              onClick={() => {
                setForm({ ...form, room_id: rooms[0]?.id || 0 });
                setIsModalOpen(true);
              }}
              className="hidden md:flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" /> Ajukan Reservasi
            </button>

            {/* FAB Mobile */}
            <FAB
              onClick={() => {
                setForm({ ...form, room_id: rooms[0]?.id || 0 });
                setIsModalOpen(true);
              }}
            />
          </>
        )}
      </div>

      <div className="hidden md:block overflow-hidden bg-white border border-gray-200 rounded-xl shadow-sm">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Kode Unik</th>
              <th className="px-6 py-4">Ruangan & Peminjam</th>
              <th className="px-6 py-4">Waktu</th>
              <th className="px-6 py-4">Status</th>
              {isUserAdmin && (
                <th className="px-6 py-4 text-center">Aksi Admin</th>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center">
                  <div className="animate-spin inline-block w-6 h-6 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                </td>
              </tr>
            ) : reservations.length > 0 ? (
              reservations.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono font-bold text-gray-900">
                    {r.unique_code}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{r.room_name}</p>
                    <p className="text-xs text-gray-500">{r.user_name}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <div className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1" />{" "}
                      {new Date(r.reservation_date).toLocaleDateString("id-ID")}
                    </div>
                    {r.start_time.slice(0, 5)} - {r.end_time.slice(0, 5)}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(r.status)}</td>
                  {isUserAdmin && (
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {r.status === "pending" ? (
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleValidation(r.id, "approved")}
                            className="p-1.5 text-green-600 bg-green-50 rounded hover:bg-green-100"
                            title="Setujui"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleValidation(r.id, "rejected")}
                            className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100"
                            title="Tolak"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          Tervalidasi
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-gray-500"
                >
                  Belum ada pengajuan reservasi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tampilan Mobile: Kartu */}
      <div className="md:hidden space-y-3 mb-20">
        {isLoading ? (
          <div className="text-center py-10 text-gray-500">Memuat...</div>
        ) : reservations.length > 0 ? (
          reservations.map((r) => (
            <div key={r.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-900">{r.room_name}</p>
                <p className="text-xs text-gray-500">{r.user_name}</p>
                <span className="inline-block mt-2 text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {r.start_time.slice(0,5)} - {r.end_time.slice(0,5)}
                </span>
              </div>
              <div className="text-right">
                {/* Fungsi getStatusBadge Anda tetap bisa dipakai di sini */}
                {getStatusBadge(r.status)}
                {isUserAdmin && (
                  <div className="mt-2">
                    <button onClick={() => handleValidation(r.id, "approved")} className="text-xs text-emerald-600 font-bold block">Approve</button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500">Belum ada reservasi.</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
              <h3 className="font-bold text-gray-900">
                Form Pengajuan Reservasi
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Pilih Ruangan
                </label>
                <select
                  required
                  value={form.room_id}
                  onChange={(e) =>
                    setForm({ ...form, room_id: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="" disabled>
                    Pilih Ruangan...
                  </option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.room_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  required
                  value={form.reservation_date}
                  onChange={(e) =>
                    setForm({ ...form, reservation_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Mulai
                  </label>
                  <input
                    type="time"
                    required
                    value={form.start_time}
                    onChange={(e) =>
                      setForm({ ...form, start_time: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Selesai
                  </label>
                  <input
                    type="time"
                    required
                    value={form.end_time}
                    onChange={(e) =>
                      setForm({ ...form, end_time: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="p-3 mt-2 text-xs text-blue-800 bg-blue-50 rounded-lg border border-blue-100">
                Peminjaman di atas pukul 18:00 (Jam Malam) memerlukan
                persetujuan manual Admin.
              </div>
              <div className="flex justify-end pt-4 border-t">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  {isSubmitting ? "Mengajukan..." : "Ajukan Reservasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
