import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { dbQuery } from "../../../../lib/db";

// Fungsi pembantu untuk validasi Admin
async function isAdmin() {
  const session = await getServerSession(authOptions);
  return (session?.user as { role?: string })?.role === "admin";
}

// PUT: Mengubah data ruangan (HANYA ADMIN)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ success: false, message: "Akses ditolak! Anda bukan Admin." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { room_name, location, esp_id, status } = body;

    await dbQuery(
      "UPDATE rooms SET room_name = ?, location = ?, esp_id = ?, status = ? WHERE id = ?",
      [room_name, location, esp_id, status, id]
    );

    return NextResponse.json({ success: true, message: "Data ruangan berhasil diperbarui" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal memperbarui data";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// DELETE: Menghapus ruangan (HANYA ADMIN)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ success: false, message: "Akses ditolak! Anda bukan Admin." }, { status: 403 });
    }

    const { id } = await params;
    
    // Opsional: Pastikan data log terkait ruangan ini juga aman jika menggunakan foreign key
    await dbQuery("DELETE FROM rooms WHERE id = ?", [id]);

    return NextResponse.json({ success: true, message: "Ruangan berhasil dihapus" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal menghapus data";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}