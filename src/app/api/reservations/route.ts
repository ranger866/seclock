import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { dbQuery } from "../../../lib/db";

// GET: Menarik data reservasi untuk ditampilkan di tabel dan dashboard
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, message: "Tidak terotorisasi" }, { status: 401 });
    
    // AUTO COMPLETE RESERVASI YANG SUDAH LEWAT
    await dbQuery(`
      UPDATE reservations
      SET
        status = 'completed',
        door_status = 0
      WHERE
        status = 'approved'
        AND (
          (reservation_date = CURDATE()
          AND ADDTIME(end_time, '00:15:00') < CURTIME())
          OR
          (reservation_date < CURDATE())
        )
    `);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRole = (session.user as any).role;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    // Admin melihat semua. Dosen/Mahasiswa HANYA melihat reservasi mereka sendiri.
    let query = `
      SELECT res.id, res.reservation_date, res.start_time, res.end_time, res.unique_code, res.status, res.door_status,
             r.room_name, r.location,
             u.name as user_name
      FROM reservations res
      JOIN rooms r ON res.room_id = r.id
      JOIN users u ON res.user_id = u.id
      WHERE res.status != 'completed'
    `;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any[] = [];
    if (userRole !== "admin") {
      query += ` AND res.user_id = ?`;
      params.push(userId);
    }
    query += ` ORDER BY res.reservation_date DESC, res.start_time ASC`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reservations = await dbQuery<any[]>(query, params);
    return NextResponse.json({ success: true, data: reservations });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal memuat reservasi";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// POST: Membuat pengajuan reservasi baru
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, message: "Tidak terotorisasi" }, { status: 401 });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
    const body = await request.json();
    const { room_id, reservation_date, start_time, end_time } = body;

    if (!room_id || !reservation_date || !start_time || !end_time) {
      return NextResponse.json({ success: false, message: "Lengkapi semua data form." }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roomCheck = await dbQuery<any[]>("SELECT status, room_name FROM rooms WHERE id = ?", [room_id]);
    
    if (roomCheck.length === 0) {
      return NextResponse.json({ success: false, message: "Ruangan tidak ditemukan di sistem." }, { status: 404 });
    }

    // Jika status ruangan adalah maintenance, tolak mentah-mentah!
    if (roomCheck[0].status === "maintenance") {
      return NextResponse.json({ 
        success: false, 
        message: `Maaf, pengajuan ditolak. ${roomCheck[0].room_name} sedang dalam masa perbaikan (Maintenance).` 
      }, { status: 403 }); // 403 Forbidden
    }

    // LOGIKA JAM MALAM (NIGHT CURFEW)
    const endHour = parseInt(end_time.split(":")[0]);
    const isNightCurfew = endHour >= 18;
    const initialStatus = isNightCurfew ? "pending" : "approved";

    const unique_code = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Deteksi Tabrakan Sederhana
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const collisionCheck = await dbQuery<any[]>(
      `SELECT id FROM reservations 
       WHERE room_id = ? AND reservation_date = ? AND status = 'approved'
       AND (start_time < ? AND end_time > ?)`,
      [room_id, reservation_date, end_time, start_time]
    );

    if (collisionCheck && collisionCheck.length > 0) {
      return NextResponse.json({ success: false, message: "Ruangan sudah dibooking pada jam tersebut." }, { status: 409 });
    }

    // door_status default adalah 0
    await dbQuery(
      "INSERT INTO reservations (room_id, user_id, reservation_date, start_time, end_time, unique_code, status, door_status) VALUES (?, ?, ?, ?, ?, ?, ?, 0)",
      [room_id, userId, reservation_date, start_time, end_time, unique_code, initialStatus]
    );

    return NextResponse.json({ 
      success: true, 
      message: isNightCurfew ? "Reservasi masuk ke jam malam. Menunggu persetujuan Admin." : "Reservasi disetujui secara otomatis." 
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal membuat reservasi";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// PATCH: Untuk Admin melakukan Approve/Reject dari tabel
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ success: false, message: "Hanya Admin yang dapat memvalidasi." }, { status: 403 });
    }

    const body = await request.json();
    const { id, status } = body;

    // 1. Update status reservasi (Approved/Rejected)
    await dbQuery("UPDATE reservations SET status = ? WHERE id = ?", [status, id]);

    // =========================================================
    // ✨ SISTEM NOTIFIKASI OTOMATIS ✨
    // =========================================================
    // 2. Cari data pemilik reservasi dan nama ruangannya
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reservData = await dbQuery<any[]>(
      `SELECT user_id, (SELECT room_name FROM rooms WHERE id = reservations.room_id) as room_name 
       FROM reservations WHERE id = ?`, 
      [id]
    );

    if (reservData.length > 0) {
      const { user_id, room_name } = reservData[0];
      
      // 3. Rangkai pesan notifikasi berdasarkan keputusan Admin
      const notifTitle = status === "approved" ? "Reservasi Disetujui! 🎉" : "Reservasi Ditolak ❌";
      const notifMessage = status === "approved" 
        ? `Pengajuan peminjaman Anda untuk ${room_name} telah disetujui oleh Admin.`
        : `Maaf, pengajuan peminjaman Anda untuk ${room_name} tidak dapat disetujui saat ini.`;
      const notifType = status === "approved" ? "success" : "error";

      // 4. Masukkan ke tabel notifikasi agar muncul di bel Dosen/Mahasiswa
      await dbQuery(
        "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)",
        [user_id, notifTitle, notifMessage, notifType]
      );
    }

    return NextResponse.json({ success: true, message: `Reservasi berhasil diubah menjadi ${status}` });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal memvalidasi reservasi";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}