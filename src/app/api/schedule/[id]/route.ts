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
    const { id } = await params;
    const body = await request.json();
    const { door_status } = body;

    // Tidak perlu admin untuk kontrol pintu (Dosen/Mhs butuh akses ini)
    await dbQuery("UPDATE schedules SET door_status = ? WHERE id = ?", [door_status, id]);

    return NextResponse.json({ success: true, message: "Perintah berhasil dikirim ke pintu." });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal mengontrol pintu";
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
    // Sesuaikan dengan nama kolom di database (dosen_id, bukan user_id)
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