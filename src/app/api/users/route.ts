import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { dbQuery } from "../../../lib/db";
import bcrypt from "bcryptjs";

// Fungsi validasi internal: Hanya Admin yang boleh mengelola data pengguna
async function isAdmin() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;
  return userRole === "admin";
}

// GET: Menampilkan semua pengguna (Tanpa Kolom Password)
export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 403 });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const users = await dbQuery<any[]>("SELECT id, identifier, name, email, role FROM users ORDER BY role ASC");
    return NextResponse.json({ success: true, data: users });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal mengambil data pengguna";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// POST: Mendaftarkan pengguna baru (Registrasi oleh Admin)
export async function POST(request: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 403 });
    }

    const body = await request.json();
    const { identifier, name, email, password, role } = body;

    if (!identifier || !name || !email || !password || !role) {
      return NextResponse.json({ success: false, message: "Semua kolom wajib diisi!" }, { status: 400 });
    }

    // Cek apakah identifier (NIM/NIP) atau email sudah terdaftar
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await dbQuery<any[]>("SELECT id FROM users WHERE identifier = ? OR email = ?", [identifier, email]);
    if (existing && existing.length > 0) {
      return NextResponse.json({ success: false, message: "NIM/NIP atau Email sudah terdaftar!" }, { status: 400 });
    }

    // Enkripsi password sebelum disimpan
    const hashedPassword = await bcrypt.hash(password, 10);

    await dbQuery(
      "INSERT INTO users (identifier, name, email, password, role) VALUES (?, ?, ?, ?, ?)",
      [identifier, name, email, hashedPassword, role]
    );

    return NextResponse.json({ success: true, message: "Pengguna berhasil ditambahkan." });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal menambah pengguna";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}