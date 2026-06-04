import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { dbQuery } from "../../../lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, message: "Tidak terotorisasi" }, { status: 401 });
    }

    // Perbaikan: JOIN ganda ke tabel users untuk dosen dan ketua kelas (opsional/LEFT JOIN)
    const query = `
      SELECT 
        s.id, s.day, s.start_time, s.end_time, s.subject_name, s.door_status, s.dosen_id, s.ketua_kelas_id,
        r.room_name, r.location, r.esp_id,
        d.name as dosen_name, d.identifier as dosen_identifier,
        k.name as ketua_name, k.identifier as ketua_identifier
      FROM schedules s
      JOIN rooms r ON s.room_id = r.id 
      JOIN users d ON s.dosen_id = d.id
      LEFT JOIN users k ON s.ketua_kelas_id = k.id
      ORDER BY FIELD(s.day, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'), s.start_time ASC
    `;
    
    const schedules = await dbQuery<any[]>(query);
    return NextResponse.json({ success: true, data: schedules });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal memuat jadwal";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as { role?: string })?.role !== "admin") {
      return NextResponse.json({ success: false, message: "Akses khusus Admin." }, { status: 403 });
    }

    const body = await request.json();
    const { room_id, dosen_id, ketua_kelas_id, day, start_time, end_time, subject_name } = body;

    if (!room_id || !dosen_id || !day || !start_time || !end_time || !subject_name) {
      return NextResponse.json({ success: false, message: "Input wajib belum diisi!" }, { status: 400 });
    }

    // Nilai default door_status adalah 0 (Terkunci)
    await dbQuery(
      "INSERT INTO schedules (room_id, dosen_id, ketua_kelas_id, day, start_time, end_time, subject_name, door_status) VALUES (?, ?, ?, ?, ?, ?, ?, 0)",
      [room_id, dosen_id, ketua_kelas_id || null, day, start_time, end_time, subject_name]
    );

    return NextResponse.json({ success: true, message: "Jadwal berhasil didaftarkan." });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal membuat jadwal";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}