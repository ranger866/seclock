import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { dbQuery } from "../../../lib/db";

// GET: Membaca rekaman riwayat akses ketukan pintu
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, message: "Sesi habis." }, { status: 401 });
    }

    // Menggabungkan data log dengan detail ruangan dan pelakunya (jika terdaftar)
    const query = `
      SELECT 
        l.id, l.accessed_at, l.action, l.status,
        r.room_name,
        COALESCE(u.name, 'Perangkat/Kartu Asing') as operator_name
      FROM access_logs l, rooms r, users u
      WHERE l.room_id = r.id 
        AND l.user_id = u.id
      ORDER BY l.accessed_at DESC
      LIMIT 100
    `;

    const logs = await dbQuery<any[]>(query);
    return NextResponse.json({ success: true, data: logs });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal memuat log sistem";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}