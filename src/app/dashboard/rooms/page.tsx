"use client";

import React, { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { DashboardLayout } from "../../../components/templates/DashboardLayout";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { Role } from "../../../types";

interface RoomData {
  id?: number;
  room_name: string;
  location: string;
  esp_id: string;
  status: "active" | "maintenance";
}

export default function RoomsManagementPage() {
  const { data: session } = useSession();
  const userSession = session?.user as { name?: string; role?: Role; identifier?: string } | undefined;
  
  // Deteksi Hak Akses Admin
  const isUserAdmin = userSession?.role === "admin";

  // State Manajemen Data
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State Manajemen Modal Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<number | null>(null);
  const [form, setForm] = useState<RoomData>({
    room_name: "",
    location: "",
    esp_id: "",
    status: "active",
  });

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/rooms");
      const json = await res.json();
      if (json.success) setRooms(json.data);
    } catch (error) {
      console.error("Gagal menarik data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Membuka Modal untuk Tambah Data Baru
  const handleOpenAddModal = () => {
    setCurrentRoomId(null);
    setForm({ room_name: "", location: "", esp_id: "", status: "active" });
    setIsModalOpen(true);
  };

  // Membuka Modal untuk Edit Data Lama
  const handleOpenEditModal = (room: RoomData) => {
    setCurrentRoomId(room.id || null);
    setForm({
      room_name: room.room_name,
      location: room.location,
      esp_id: room.esp_id || "",
      status: room.status,
    });
    setIsModalOpen(true);
  };

  // Menangani Aksi Simpan Data (POST atau PUT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const url = currentRoomId ? `/api/rooms/${currentRoomId}` : "/api/rooms";
      const method = currentRoomId ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        fetchRooms(); // Refresh tabel
      } else {
        alert(json.message);
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Menangani Aksi Hapus Data
  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus ruangan "${name}"?`)) return;
    try {
      const res = await fetch(`/api/rooms/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        fetchRooms();
      } else {
        alert(json.message);
      }
    } catch (error) {
      alert("Gagal menghapus data.");
    }
  };

  return (
    <DashboardLayout
      userName={userSession?.name || "Pengguna"}
      userRole={userSession?.role || "mahasiswa"}
      identifier={userSession?.identifier || "-"}
      onLogout={() => signOut({ callbackUrl: "/login" })}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Ruangan</h2>
          <p className="mt-1 text-sm text-gray-500">Kelola data ruangan dan integrasi perangkat ESP32.</p>
        </div>
        {/* 🔒 RBAC: Tombol Tambah hanya muncul untuk Admin */}
        {isUserAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" /> Tambah Ruangan
          </button>
        )}
      </div>

      {/* Tabel Data */}
      <div className="overflow-hidden bg-white border border-gray-200 rounded-xl shadow-sm">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Nama Ruangan</th>
              <th className="px-6 py-4">Lokasi</th>
              <th className="px-6 py-4">ID ESP32</th>
              <th className="px-6 py-4">Status</th>
              {isUserAdmin && <th className="px-6 py-4 text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={isUserAdmin ? 5 : 4} className="px-6 py-10 text-center">
                  <div className="inline-block w-6 h-6 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                </td>
              </tr>
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
                  {/* 🔒 RBAC: Kolom Aksi hanya dirender untuk Admin */}
                  {isUserAdmin && (
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEditModal(room)}
                        className="p-2 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        title="Edit Ruangan"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => room.id && handleDelete(room.id, room.room_name)}
                        className="p-2 ml-2 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Hapus Ruangan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isUserAdmin ? 5 : 4} className="px-6 py-10 text-center text-gray-500">
                  Belum ada data ruangan di database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL FORM (TAMBAH / EDIT) */}
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
                <input
                  type="text"
                  required
                  value={form.room_name}
                  onChange={(e) => setForm({ ...form, room_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Contoh: Ruang Kelas 101"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Lokasi Gedung / Lantai</label>
                <input
                  type="text"
                  required
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Contoh: Gedung Baru - Lantai 2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">ID Perangkat ESP32</label>
                <input
                  type="text"
                  required
                  value={form.esp_id}
                  onChange={(e) => setForm({ ...form, esp_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                  placeholder="Contoh: ESP32-ROOM-01"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Status Operasional</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "maintenance" })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="active">Aktif (Dapat Digunakan)</option>
                  <option value="maintenance">Maintenance (Perbaikan/Terkunci)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
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