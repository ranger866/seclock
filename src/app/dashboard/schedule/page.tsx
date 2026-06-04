"use client";

import React, { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { DashboardLayout } from "../../../components/templates/DashboardLayout";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { LiveSearch } from "../../../components/organisms/LiveSearch";
import { FAB } from "@/components/atoms/FloatingButtonAction";
import { Role } from "../../../types";

interface ScheduleData {
  id?: number;
  room_id: number;
  dosen_id: number; 
  ketua_kelas_id: number | null; 
  day: string;
  start_time: string;
  end_time: string;
  subject_name: string;
  room_name?: string;
  dosen_name?: string;
  ketua_name?: string;
}

export default function SchedulePage() {
  const { data: session } = useSession();
  const userSession = session?.user as { name?: string; role?: Role; identifier?: string } | undefined;
  const isUserAdmin = userSession?.role === "admin";

  const [schedules, setSchedules] = useState<ScheduleData[]>([]);
  const [roomsOption, setRoomsOption] = useState<{ id: number; room_name: string }[]>([]);
  
  const [dosenOption, setDosenOption] = useState<{ id: number; name: string; role: string }[]>([]);
  const [mahasiswaData, setMahasiswaData] = useState<{ id: number; name: string; identifier: string }[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentScheduleId, setCurrentScheduleId] = useState<number | null>(null);

  const [form, setForm] = useState<ScheduleData>({
    room_id: 0,
    dosen_id: 0,
    ketua_kelas_id: null,
    day: "Senin",
    start_time: "08:00",
    end_time: "10:00",
    subject_name: "",
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // PERBAIKAN: Jika user adalah admin, ambil SEMUA data referensi form secara paralel
      if (isUserAdmin) {
        const [resSched, resRooms, resUsers] = await Promise.all([
          fetch("/api/schedule"),
          fetch("/api/rooms"),
          fetch("/api/users")
        ]);
        
        const jsonSched = await resSched.json();
        const jsonRooms = await resRooms.json();
        const jsonUsers = await resUsers.json();
        
        if (jsonSched.success) setSchedules(jsonSched.data);
        if (jsonRooms.success) setRoomsOption(jsonRooms.data);
        if (jsonUsers.success) {
          setDosenOption(jsonUsers.data.filter((u: any) => u.role === "dosen"));
          setMahasiswaData(jsonUsers.data.filter((u: any) => u.role === "mahasiswa"));
        }
      } else {
        // Jika bukan admin, cukup ambil data jadwal saja (read-only)
        const resSched = await fetch("/api/schedule");
        const jsonSched = await resSched.json();
        if (jsonSched.success) setSchedules(jsonSched.data);
      }
    } catch (error) {
      console.error("Gagal menarik data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isUserAdmin]);

  const handleOpenAddModal = () => {
    setCurrentScheduleId(null);
    setForm({
      room_id: roomsOption[0]?.id || 0,
      dosen_id: dosenOption[0]?.id || 0,
      ketua_kelas_id: null,
      day: "Senin",
      start_time: "08:00",
      end_time: "10:00",
      subject_name: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sched: ScheduleData) => {
    setCurrentScheduleId(sched.id || null);
    setForm({
      room_id: sched.room_id,
      dosen_id: sched.dosen_id,
      ketua_kelas_id: sched.ketua_kelas_id,
      day: sched.day,
      start_time: sched.start_time.slice(0, 5), 
      end_time: sched.end_time.slice(0, 5),
      subject_name: sched.subject_name,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const url = currentScheduleId ? `/api/schedule/${currentScheduleId}` : "/api/schedule";
      const method = currentScheduleId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        fetchData();
      } else alert(json.message);
    } catch (error) {
      alert("Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(`Hapus jadwal ini?`)) return;
    try {
      const res = await fetch(`/api/schedule/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) fetchData();
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
          <h2 className="text-2xl font-bold text-gray-900">Jadwal Perkuliahan</h2>
          <p className="mt-1 text-sm text-gray-500">Atur jadwal sinkronisasi pengunci pintu kelas.</p>
        </div>

        {isUserAdmin && (
          <>
            {/* Tombol Desktop */}
            <button 
              onClick={handleOpenAddModal} 
              className="hidden md:flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" /> Buat Jadwal
            </button>

            {/* FAB Mobile */}
            <FAB onClick={handleOpenAddModal} />
          </>
        )}
      </div>

      {/* Tampilan Desktop: Tabel */}
      <div className="hidden md:block overflow-hidden bg-white border border-gray-200 rounded-xl shadow-sm">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Ruangan</th>
              <th className="px-6 py-4">Mata Kuliah</th>
              <th className="px-6 py-4">Dosen / Ketua Kelas</th>
              <th className="px-6 py-4">Waktu</th>
              {isUserAdmin && <th className="px-6 py-4 text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={isUserAdmin ? 5 : 4} className="px-6 py-10 text-center"><div className="inline-block w-6 h-6 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div></td></tr>
            ) : schedules.length > 0 ? (
              schedules.map((s) => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{s.room_name}</td>
                  <td className="px-6 py-4">{s.subject_name}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-800">{s.dosen_name}</p>
                    <p className="text-xs text-gray-500">{s.ketua_name ? `Ketua: ${s.ketua_name}` : 'Ketua: -'}</p>
                  </td>
                  <td className="px-6 py-4"><span className="font-semibold text-blue-600">{s.day}</span><br/>{s.start_time.slice(0,5)} - {s.end_time.slice(0,5)}</td>
                  {isUserAdmin && (
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <button onClick={() => handleOpenEditModal(s)} className="p-2 text-blue-600 rounded-lg hover:bg-blue-50"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => s.id && handleDelete(s.id)} className="p-2 ml-2 text-red-600 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr><td colSpan={isUserAdmin ? 5 : 4} className="px-6 py-10 text-center text-gray-500">Belum ada jadwal yang terdaftar.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Tampilan Mobile: Kartu */}
      <div className="md:hidden space-y-3 mb-20">
        {isLoading ? (
          <div className="text-center py-10 text-gray-500">Memuat...</div>
        ) : schedules.length > 0 ? (
          schedules.map((s) => (
            <div key={s.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-900">{s.subject_name}</p>
                <p className="text-xs text-gray-500">{s.room_name} • {s.day}</p>
                <p className="text-xs text-gray-600 mt-1">{s.dosen_name}</p>
                <span className="inline-block mt-2 text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {s.start_time.slice(0,5)} - {s.end_time.slice(0,5)}
                </span>
              </div>
              {isUserAdmin && (
                <div className="flex flex-col gap-2">
                    <button onClick={() => handleOpenEditModal(s)} className="p-2 text-blue-600 bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => s.id && handleDelete(s.id)} className="p-2 text-red-600 bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500">Belum ada jadwal.</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
              <h3 className="font-bold text-gray-900">{currentScheduleId ? "Edit Jadwal" : "Buat Jadwal Baru"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Mata Kuliah</label>
                <input type="text" required value={form.subject_name} onChange={(e) => setForm({ ...form, subject_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Ruangan</label>
                  <select required value={form.room_id} onChange={(e) => setForm({ ...form, room_id: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                    <option value="" disabled>Pilih...</option>
                    {roomsOption.map(r => <option key={r.id} value={r.id}>{r.room_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Hari</label>
                  <select required value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                    {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Dosen Pengampu</label>
                <select required value={form.dosen_id} onChange={(e) => setForm({ ...form, dosen_id: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                  <option value="" disabled>Pilih Dosen...</option>
                  {dosenOption.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Delegasi Ketua Kelas (Opsional)</label>
                <LiveSearch 
                  data={mahasiswaData} 
                  placeholder="Cari NIM atau Nama Mahasiswa..."
                  onSelect={(selected) => setForm({ ...form, ketua_kelas_id: selected.id })}
                />
                {form.ketua_kelas_id && <p className="mt-1 text-xs text-blue-600 font-medium">Mahasiswa Terpilih: ID {form.ketua_kelas_id}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Waktu Mulai</label>
                  <input type="time" required value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Waktu Selesai</label>
                  <input type="time" required value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t">
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
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