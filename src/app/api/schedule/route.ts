import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { dbQuery } from "../../../lib/db";

// GET: Mengambil daftar jadwal perkuliahan (Menggabungkan tabel rooms dan users)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, message: "Tidak terotorisasi" }, { status: 401 });
    }

    // Melakukan JOIN SQL untuk mendapatkan nama ruangan dan nama dosen penanggung jawab asli
    const query = `
      SELECT 
        s.id, s.day, s.start_time, s.end_time, s.subject_name,
        r.room_name, r.location,
        u.name as PIC_name, u.identifier as PIC_id
      FROM schedules s, rooms r, users u
      WHERE s.room_id = r.id 
        AND s.user_id = u.id
      ORDER BY FIELD(s.day, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'), s.start_time ASC
    `;
    
    const schedules = await dbQuery<any[]>(query);
    return NextResponse.json({ success: true, data: schedules });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal memuat jadwal";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// POST: Membuat jadwal baru (Hanya Admin)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ success: false, message: "Akses khusus Admin." }, { status: 403 });
    }

    const body = await request.json();
    const { room_id, user_id, day, start_time, end_time, subject_name } = body;

    if (!room_id || !user_id || !day || !start_time || !end_time || !subject_name) {
      return NextResponse.json({ success: false, message: "Semua input jadwal wajib diisi!" }, { status: 400 });
    }

    await dbQuery(
      "INSERT INTO schedules (room_id, user_id, day, start_time, end_time, subject_name) VALUES (?, ?, ?, ?, ?, ?)",
      [room_id, user_id, day, start_time, end_time, subject_name]
    );

    return NextResponse.json({ success: true, message: "Jadwal berhasil didaftarkan." });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal membuat jadwal";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}