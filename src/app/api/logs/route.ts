import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { dbQuery } from "../../../lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, message: "Sesi habis." }, { status: 401 });
    }

    // Menggunakan LEFT JOIN karena user_id bernilai NULL = YES di database
    const query = `
      SELECT 
        l.id, 
        l.accessed_at, 
        l.access_type, 
        l.action, 
        l.status,
        COALESCE(r.room_name, 'Ruangan Terhapus') as room_name,
        COALESCE(u.name, 'Sistem / Tombol Fisik') as operator_name
      FROM access_logs l
      LEFT JOIN rooms r ON l.room_id = r.id
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.accessed_at DESC
      LIMIT 100
    `;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logs = await dbQuery<any[]>(query);
    return NextResponse.json({ success: true, data: logs });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal memuat log sistem";
    console.error("API Logs GET Error:", msg);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan internal server" }, { status: 500 });
  }
}

// POST: Menyimpan rekaman akses baru (Strict: Wajib ada user_id)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { room_id, user_id, access_type, action, status } = body;

    // 1. Validasi Super Ketat: Semua kolom termasuk user_id wajib ada (NOT NULL)
    if (!room_id || !user_id || !access_type || !action || !status) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Gagal menyimpan log: Seluruh data (room_id, user_id, access_type, action, status) wajib diisi." 
        },
        { status: 400 }
      );
    }

    // 2. Validasi ENUM sesuai dengan struktur tabel di database
    const validAccessTypes = ["contract", "reservation", "maintenance"];
    const validStatuses = ["success", "failed"];

    if (!validAccessTypes.includes(access_type)) {
      return NextResponse.json({ success: false, message: "access_type tidak valid." }, { status: 400 });
    }
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, message: "status tidak valid." }, { status: 400 });
    }

    // 3. Pastikan user_id dikonversi menjadi tipe data angka (INT) yang valid
    const parsedUserId = Number(user_id);
    if (isNaN(parsedUserId)) {
      return NextResponse.json({ success: false, message: "user_id harus berupa angka yang valid." }, { status: 400 });
    }

    // 4. Eksekusi INSERT murni tanpa penanganan nilai NULL pada user_id
    const insertQuery = `
      INSERT INTO access_logs (room_id, user_id, access_type, action, status)
      VALUES (?, ?, ?, ?, ?)
    `;

    await dbQuery(insertQuery, [room_id, parsedUserId, access_type, action, status]);

    return NextResponse.json({ success: true, message: "Log aktivitas berhasil dicatat secara resmi." });
  } catch (error: unknown) {
    console.error("API Logs POST Error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan internal server saat menyimpan log." }, { status: 500 });
  }
}