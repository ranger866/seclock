import { NextResponse } from "next/server";
import { dbQuery } from "../../../../lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "operator") {
      return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 401 });
    }

    const { room_id, action } = await request.json();
    const operatorId = (session.user as any).id; // ID pengguna wajib ada
    
    // =====================================================================
    // LOGIKA 1: JIKA TOMBOL 'END' DITEKAN
    // =====================================================================
    if (action === "end") {
      const endQuery = `
        UPDATE reservations 
        SET door_status = 0, status = 'completed' 
        WHERE room_id = ? AND status = 'approved' AND unique_code LIKE 'CLN-%'
      `;
      
      const updateResult = await dbQuery<any>(endQuery, [room_id]);
      
      if (updateResult.affectedRows > 0) {
        // ✨ [BARU] CATAT KE LOGS ✨
        await dbQuery(
          `INSERT INTO access_logs (room_id, user_id, access_type, action, status) VALUES (?, ?, 'maintenance', 'Mengunci Pintu (Selesai Bersih)', 'success')`,
          [room_id, operatorId]
        );

        return NextResponse.json({ success: true, message: "Sesi kebersihan diakhiri. Pintu dikunci." });
      } else {
        return NextResponse.json({ success: false, message: "Tidak ada sesi aktif." }, { status: 400 });
      }
    }

    // =====================================================================
    // LOGIKA 2: JIKA TOMBOL 'HOLD' DITEKAN
    // =====================================================================
    const dayName = DAYS[new Date().getDay()];
    const uniqueCode = "CLN-" + Math.floor(1000 + Math.random() * 9000);

    const checkQuery = `
      SELECT id FROM schedules 
      WHERE room_id = ? AND day = ? AND CURTIME() BETWEEN ADDTIME(start_time, '-00:15:00') AND ADDTIME(end_time, '00:15:00')
      UNION ALL
      SELECT id FROM reservations 
      WHERE room_id = ? AND reservation_date = CURDATE() AND status = 'approved' AND CURTIME() BETWEEN ADDTIME(start_time, '-00:15:00') AND ADDTIME(end_time, '00:15:00')
      LIMIT 1
    `;

    const activeSessions = await dbQuery<any[]>(checkQuery, [room_id, dayName, room_id]);

    if (activeSessions.length > 0) {
      return NextResponse.json({ success: false, message: "Ruangan sedang digunakan." }, { status: 400 });
    }

    const insertQuery = `
      INSERT INTO reservations (room_id, user_id, reservation_date, start_time, end_time, unique_code, status, door_status)
      VALUES (?, ?, CURDATE(), CURTIME(), ADDTIME(CURTIME(), '01:00:00'), ?, 'approved', 2)
    `;
    await dbQuery(insertQuery, [room_id, operatorId, uniqueCode]);

    // ✨ [BARU] CATAT KE LOGS ✨
    await dbQuery(
      `INSERT INTO access_logs (room_id, user_id, access_type, action, status) VALUES (?, ?, 'maintenance', 'Hold Open (Mulai Bersih)', 'success')`,
      [room_id, operatorId]
    );

    return NextResponse.json({ success: true, message: "Pintu berhasil di-Hold Terbuka!" });
  } catch (error) {
    console.error("Operator Cleanup Error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan server." }, { status: 500 });
  }
}