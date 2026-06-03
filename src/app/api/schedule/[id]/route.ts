import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { dbQuery } from "../../../../lib/db";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return (session?.user as { role?: string })?.role === "admin";
}

// PUT: Mengubah data komponen jadwal
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { room_id, user_id, day, start_time, end_time, subject_name } = body;

    await dbQuery(
      "UPDATE schedules SET room_id = ?, user_id = ?, day = ?, start_time = ?, end_time = ?, subject_name = ? WHERE id = ?",
      [room_id, user_id, day, start_time, end_time, subject_name, id]
    );

    return NextResponse.json({ success: true, message: "Jadwal berhasil diperbarui." });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal memperbarui jadwal";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// DELETE: Menghapus jadwal kegiatan rutin
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