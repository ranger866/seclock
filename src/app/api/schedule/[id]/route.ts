import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { dbQuery } from "../../../../lib/db";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return (session?.user as { role?: string })?.role === "admin";
}

// PATCH: Untuk mengontrol Hardware (Buka/Tutup/Hold) dari Dashboard
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, message: "Sesi habis." }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { door_status } = body;

    // Tidak perlu admin untuk kontrol pintu (Dosen/Mhs butuh akses ini)
    await dbQuery("UPDATE schedules SET door_status = ? WHERE id = ?", [door_status, id]);

    // =========================================================
    // ✨ SISTEM LOGGING OTOMATIS ✨
    // =========================================================
    // Ambil user_id dari sesi
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
    
    // Cari tahu room_id dari jadwal ini untuk direkam di log
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schedData = await dbQuery<any[]>("SELECT room_id FROM schedules WHERE id = ?", [id]);
    const roomId = schedData.length > 0 ? schedData[0].room_id : null;

    if (roomId && door_status !== undefined) {
      let actionName = "Membuka Pintu (Sekali)";
      if (door_status === 2) actionName = "Membuka Pintu (Hold Open)";
      if (door_status === 0) actionName = "Mengunci Pintu (Selesai)";
      
      await dbQuery(
        `INSERT INTO access_logs (room_id, user_id, access_type, action, status) VALUES (?, ?, 'contract', ?, 'success')`,
        [roomId, userId, actionName]
      );
    }

    return NextResponse.json({ success: true, message: "Perintah berhasil dikirim ke pintu." });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal mengontrol pintu";
    console.error(error);
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// PUT: Memperbarui data jadwal (Admin saja)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { room_id, dosen_id, ketua_kelas_id, day, start_time, end_time, subject_name } = body;

    await dbQuery(
      "UPDATE schedules SET room_id = ?, dosen_id = ?, ketua_kelas_id = ?, day = ?, start_time = ?, end_time = ?, subject_name = ? WHERE id = ?",
      [room_id, dosen_id, ketua_kelas_id || null, day, start_time, end_time, subject_name, id]
    );

    return NextResponse.json({ success: true, message: "Jadwal berhasil diperbarui." });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal memperbarui jadwal";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// DELETE: Menghapus jadwal
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 403 });
    }

    const { id } = await params;
    await dbQuery("DELETE FROM schedules WHERE id = ?", [id]);
    return NextResponse.json({ success: true, message: "Jadwal berhasil dihapus." });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal menghapus jadwal";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}