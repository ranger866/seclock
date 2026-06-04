import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { dbQuery } from "../../../../lib/db";

// PATCH: Mengubah state pintu & status reservasi
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, message: "Sesi habis." }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { door_status, status } = body; // Menerima door_status DAN status

    // Validasi minimal
    if (door_status === undefined && status === undefined) {
      return NextResponse.json({ success: false, message: "Data update tidak valid." }, { status: 400 });
    }

    // Jika ada request untuk mengakhiri sesi (status 'completed')
    if (status === "completed") {
      await dbQuery(
        "UPDATE reservations SET door_status = ?, status = ? WHERE id = ?",
        [door_status, status, id]
      );
    } else {
      // Jika hanya kontrol pintu biasa
      await dbQuery(
        "UPDATE reservations SET door_status = ? WHERE id = ?",
        [door_status, id]
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: status === "completed" ? "Sesi diakhiri & pintu terkunci." : "Sinyal pintu berhasil dikirim." 
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal mengontrol pintu.";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}