"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import useSWR from "swr"; // <-- Import SWR
import { DashboardLayout } from "../../../components/templates/DashboardLayout";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { FAB } from "@/components/atoms/FloatingButtonAction";
import { Role } from "../../../types";
import Swal from "sweetalert2";

interface RoomData {
  id?: number;
  room_name: string;
  location: string;
  esp_id: string;
  status: "active" | "maintenance";
}

// Fetcher standar untuk SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function RoomsManagementPage() {
  const { data: session } = useSession();
  const userSession = session?.user as { name?: string; role?: Role; identifier?: string } | undefined;
  const isUserAdmin = userSession?.role === "admin";

  // =========================================================================
  // SWR: Otomatis fetch dan cache data Ruangan
  // =========================================================================
  const { data: responseData, mutate, isLoading } = useSWR("/api/rooms", fetcher);
  const rooms: RoomData[] = responseData?.success ? responseData.data : [];

  // State Manajemen Modal Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<number | null>(null);
  const [form, setForm] = useState<RoomData>({
    room_name: "", location: "", esp_id: "", status: "active",
  });

  const handleOpenAddModal = () => {
    setCurrentRoomId(null);
    setForm({ room_name: "", location: "", esp_id: "", status: "active" });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (room: RoomData) => {
    setCurrentRoomId(room.id || null);
    setForm({ room_name: room.room_name, location: room.location, esp_id: room.esp_id || "", status: room.status });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = currentRoomId ? `/api/rooms/${currentRoomId}` : "/api/users";
      const res = await fetch(url, {
        method: currentRoomId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (json.success) {
        Swal.fire("Tersimpan!", json.message, "success");
        setIsModalOpen(false);
        mutate();
      } else {
        Swal.fire("Perhatian", json.message, "warning");
      }
    } catch (error) {
      Swal.fire("Gagal", "Terjadi kesalahan sistem.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    // Memanggil UI konfirmasi modal yang elegan
    const result = await Swal.fire({
      title: "Apakah Anda Yakin?",
      text: `Data "${name}" akan dihapus permanen dari sistem.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal"
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/Rooms/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        Swal.fire("Terhapus!", "Data berhasil dihapus.", "success");
        mutate();
      } else {
        Swal.fire("Gagal", json.message, "error");
      }
    } catch (error) {
      Swal.fire("Gagal", "Kesalahan saat menghapus data.", "error");
    }
  };

  return (
    <DashboardLayout userName={userSession?.name || "Pengguna"} userRole={userSession?.role || "mahasiswa"} identifier={userSession?.identifier || "-"} onLogout={() => signOut({ callbackUrl: "/login" })}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Ruangan</h2>
          <p className="mt-1 text-sm text-gray-500">Kelola data ruangan dan integrasi perangkat ESP32.</p>
        </div>

        {isUserAdmin && (
          <>
            <button onClick={handleOpenAddModal} className="hidden md:flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4 mr-2" /> Tambah Ruangan
            </button>
            <FAB onClick={handleOpenAddModal} />
          </>
        )}
      </div>

      {/* Tabel Data Desktop */}
      <div className="hidden md:block overflow-hidden bg-white border border-gray-200 rounded-xl shadow-sm">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Nama Ruangan</th><th className="px-6 py-4">Lokasi</th>
              <th className="px-6 py-4">ID ESP32</th><th className="px-6 py-4">Status</th>
              {isUserAdmin && <th className="px-6 py-4 text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center"><div className="inline-block w-6 h-6 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div></td></tr>
            ) : rooms.length > 0 ? (
              rooms.map((room) => (
                <tr key={room.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{room.room_name}</td>
                  <td className="px-6 py-4">{room.location}</td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-600">{room.esp_id || "-"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${room.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                      {room.status === 'active' ? 'Aktif' : 'Maintenance'}
                    </span>
                  </td>
                  {isUserAdmin && (
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <button onClick={() => handleOpenEditModal(room)} className="p-2 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => room.id && handleDelete(room.id, room.room_name)} className="p-2 ml-2 text-red-600 rounded-lg hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Belum ada data ruangan.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Kartu Mobile */}
      <div className="md:hidden space-y-3 mb-20">
        {isLoading ? (
          <div className="text-center py-10 text-gray-500">Memuat...</div>
        ) : rooms.length > 0 ? (
          rooms.map((room) => (
            <div key={room.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-900">{room.room_name}</p>
                <p className="text-xs text-gray-500">{room.location}</p>
                <p className="text-[10px] font-mono text-gray-400 mt-1">ID: {room.esp_id || "-"}</p>
                <div className="mt-2"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${room.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{room.status === 'active' ? 'Aktif' : 'Maintenance'}</span></div>
              </div>
              {isUserAdmin && (
                <div className="flex flex-col gap-2">
                  <button onClick={() => handleOpenEditModal(room)} className="p-2 text-blue-600 bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => room.id && handleDelete(room.id, room.room_name)} className="p-2 text-red-600 bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500">Belum ada data.</div>
        )}
      </div>

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
              <h3 className="font-bold text-gray-900">{currentRoomId ? "Edit Data Ruangan" : "Tambah Ruangan Baru"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Nama Ruangan</label>
                <input type="text" required value={form.room_name} onChange={(e) => setForm({ ...form, room_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Contoh: Ruang Kelas 101" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Lokasi</label>
                <input type="text" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Contoh: Gedung Baru - Lantai 2" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">ID Perangkat ESP32</label>
                <input type="text" required value={form.esp_id} onChange={(e) => setForm({ ...form, esp_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono" placeholder="Contoh: ESP32-ROOM-01" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Status Operasional</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "maintenance" })} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                  <option value="active">Aktif (Dapat Digunakan)</option>
                  <option value="maintenance">Maintenance (Perbaikan/Terkunci)</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {isSubmitting ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}