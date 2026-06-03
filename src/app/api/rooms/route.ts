import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { dbQuery } from "../../../lib/db";

// Fungsi pembantu untuk memvalidasi apakah yang mengakses adalah Admin
async function isAdmin() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;
  return userRole === "admin";
}

// GET: Mengambil semua data ruangan untuk ditampilkan di tabel (Semua Role bisa akses)
export async function GET() {
  try {
    const rooms = await dbQuery<any[]>("SELECT * FROM rooms ORDER BY id DESC");
    return NextResponse.json({ success: true, data: rooms });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal mengambil data";
    console.error("API GET Rooms Error:", msg);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// POST: Menambahkan data ruangan baru ke database (HANYA ADMIN)
export async function POST(request: Request) {
  try {
    // Proteksi Keamanan Tingkat API
    if (!(await isAdmin())) {
      return NextResponse.json({ success: false, message: "Akses ditolak! Anda bukan Admin." }, { status: 403 });
    }

    const body = await request.json();
    const { room_name, location, esp_id, status } = body;

    if (!room_name || !location || !esp_id) {
      return NextResponse.json(
        { success: false, message: "Nama ruangan, lokasi, dan ID ESP wajib diisi!" },
        { status: 400 }
      );
    }

    // Eksekusi Insert ke TiDB
    await dbQuery(
      "INSERT INTO rooms (room_name, location, esp_id, status) VALUES (?, ?, ?, ?)",
      [room_name, location, esp_id, status || "active"]
    );

    return NextResponse.json({ success: true, message: "Ruangan berhasil ditambahkan" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal menambah data";
    console.error("API POST Rooms Error:", msg);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}