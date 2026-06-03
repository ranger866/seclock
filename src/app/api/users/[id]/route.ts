import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { dbQuery } from "../../../../lib/db";
import bcrypt from "bcryptjs";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return (session?.user as { role?: string })?.role === "admin";
}

// PUT: Memperbarui data pengguna
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { identifier, name, email, role, password } = body;

    if (password) {
      // Jika password ikut diubah, lakukan enkripsi ulang
      const hashedPassword = await bcrypt.hash(password, 10);
      await dbQuery(
        "UPDATE users SET identifier = ?, name = ?, email = ?, role = ?, password = ? WHERE id = ?",
        [identifier, name, email, role, hashedPassword, id]
      );
    } else {
      // Jika password tidak diubah
      await dbQuery(
        "UPDATE users SET identifier = ?, name = ?, email = ?, role = ? WHERE id = ?",
        [identifier, name, email, role, id]
      );
    }

    return NextResponse.json({ success: true, message: "Data pengguna berhasil diperbarui." });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal memperbarui pengguna";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// DELETE: Menghapus pengguna
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 403 });
    }

    const { id } = await params;
    await dbQuery("DELETE FROM users WHERE id = ?", [id]);
    return NextResponse.json({ success: true, message: "Pengguna berhasil dihapus." });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal menghapus pengguna";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}