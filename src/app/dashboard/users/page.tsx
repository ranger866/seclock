"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import useSWR from "swr";
import Swal from "sweetalert2";
import { DashboardLayout } from "../../../components/templates/DashboardLayout";
import { Plus, Edit, Trash2, X, Loader2 } from "lucide-react";
import { FAB } from "@/components/atoms/FloatingButtonAction";
import { Role } from "../../../types";

interface UserData {
  id?: number;
  identifier: string;
  name: string;
  email: string;
  role: "admin" | "dosen" | "mahasiswa" | "operator";
  password?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function UsersPage() {
  const { data: session } = useSession();
  const userSession = session?.user as {id ?: number; name?: string; role?: Role; identifier?: string } | undefined;
  const isUserAdmin = userSession?.role === "admin";

  // =========================================================================
  // SWR: Fetch Data Pengguna Otomatis
  // =========================================================================
  const { data: responseData, mutate, isLoading } = useSWR(
    isUserAdmin ? "/api/users" : null, 
    fetcher,
    { refreshInterval: 5000 }
  );
  
  const users: UserData[] = responseData?.success ? responseData.data : [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  
  const [form, setForm] = useState<UserData>({
    identifier: "", name: "", email: "", role: "mahasiswa", password: "",
  });

  const handleOpenAddModal = () => {
    setCurrentUserId(null);
    setForm({ identifier: "", name: "", email: "", role: "mahasiswa", password: "" });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserData) => {
    setCurrentUserId(user.id || null);
    setForm({ identifier: user.identifier, name: user.name, email: user.email, role: user.role, password: "" });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = currentUserId ? `/api/users/${currentUserId}` : "/api/users";
      const res = await fetch(url, {
        method: currentUserId ? "PUT" : "POST",
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
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
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
          <h2 className="text-2xl font-bold text-gray-900">Data Pengguna</h2>
          <p className="mt-1 text-sm text-gray-500">Kelola akses sistem untuk Dosen, Mahasiswa, dan Admin.</p>
        </div>
        <button onClick={handleOpenAddModal} className="hidden md:flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4 mr-2" /> Tambah Pengguna
        </button>
        <FAB onClick={handleOpenAddModal} />
      </div>

      <div className="hidden md:block overflow-hidden bg-white border border-gray-200 rounded-xl shadow-sm">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">NIM / NIP</th><th className="px-6 py-4">Nama Lengkap</th>
              <th className="px-6 py-4">Email</th><th className="px-6 py-4">Peran</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && !responseData ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" /></td></tr>
            ) : users.length > 0 ? (
              users.map((u) => (
                <tr key={u.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-xs">{u.identifier}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{u.name}</td>
                  <td className="px-6 py-4">{u.email}</td>
                  <td className="px-6 py-4"><span className="px-2.5 py-1 text-xs font-semibold bg-gray-100 uppercase rounded-md">{u.role}</span></td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <button onClick={() => handleOpenEditModal(u)} className="p-2 text-blue-600 rounded-lg hover:bg-blue-50"><Edit className="w-4 h-4" /></button>
                    {u.id !=  userSession?.id && (
                      <button onClick={() => u.id && handleDelete(u.id, u.name)} className="p-2 ml-2 text-red-600 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Belum ada data pengguna.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3 mb-20">
        {isLoading && !responseData ? (
          <div className="text-center py-10 text-gray-500"><Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" /></div>
        ) : users.length > 0 ? (
          users.map((u) => (
            <div key={u.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-900">{u.name}</p>
                <p className="text-xs text-gray-500">{u.identifier}</p>
                <span className="inline-block mt-2 text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded uppercase">{u.role}</span>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => handleOpenEditModal(u)} className="p-2 text-blue-600 bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                {u.id !=  userSession?.id && (
                  <button onClick={() => u.id && handleDelete(u.id, u.name)} className="p-2 text-red-600 bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500">Belum ada user.</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
              <h3 className="font-bold text-gray-900">{currentUserId ? "Edit Pengguna" : "Tambah Pengguna Baru"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">NIM / NIP</label>
                <input type="text" required value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Nama Lengkap</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Email</label>
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Peran (Role)</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "dosen" | "mahasiswa" | "operator" })} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                  <option value="mahasiswa">Mahasiswa</option>
                  <option value="dosen">Dosen</option>
                  <option value="operator">Operator (CS)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Password {currentUserId && <span className="text-gray-400 normal-case font-normal">(Kosongkan jika tidak ingin diubah)</span>}</label>
                <input type="password" required={!currentUserId} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex justify-end pt-4 border-t">
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center">
                  {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</> : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}