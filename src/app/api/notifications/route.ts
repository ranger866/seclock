import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import { dbQuery } from "../../../lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, message: "Akses ditolak" }, { status: 401 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
    
    // Ambil 20 notifikasi terbaru milik user yang sedang login
    const query = `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`;
    const notifs = await dbQuery(query, [userId]);

    return NextResponse.json({ success: true, data: notifs });
  } catch (error) {
    console.error("Notif GET Error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, message: "Akses ditolak" }, { status: 401 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
    const body = await request.json();
    const { id, action } = body;

    if (action === "mark_all") {
      await dbQuery("UPDATE notifications SET is_read = TRUE WHERE user_id = ?", [userId]);
    } else if (id) {
      await dbQuery("UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?", [id, userId]);
    }

    return NextResponse.json({ success: true, message: "Notifikasi diperbarui." });
  } catch (error) {
    console.error("Notif PATCH Error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan server" }, { status: 500 });
  }
}