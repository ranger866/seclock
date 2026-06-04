import { NextResponse } from "next/server";
import { dbQuery } from "../../../../../lib/db"; // Sesuaikan path import Anda

// Helper untuk otentikasi ESP32
function isAuthorized(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  return apiKey === process.env.DEVICE_API_SECRET;
}

// GET: ESP32 Meminta status pintu (Polling)
export async function GET(request: Request, { params }: { params: Promise<{ esp_id: string }> }) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { esp_id } = await params;
    const now = new Date();
    // Gunakan array nama hari berbahasa Indonesia agar cocok dengan database
    const dayName = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][now.getDay()];
    
    // Cari Room ID berdasarkan ESP ID
    const room = await dbQuery<any[]>("SELECT id FROM rooms WHERE esp_id = ?", [esp_id]);
    if (!room || room.length === 0) return NextResponse.json({ door_status: 0 });

    const roomId = room[0].id;

    // Cek jadwal dan reservasi aktif dengan buffer 15 menit
    const query = `
      SELECT door_status FROM (
        SELECT door_status, start_time, end_time 
        FROM schedules 
        WHERE room_id = ? AND day = ?
        UNION ALL
        SELECT door_status, start_time, end_time 
        FROM reservations 
        WHERE room_id = ? AND reservation_date = CURDATE() AND status = 'approved'
      ) AS combined_sessions
      WHERE CURTIME() >= ADDTIME(start_time, '-00:15:00') 
        AND CURTIME() <= ADDTIME(end_time, '00:15:00')
      LIMIT 1
    `;

    const activeSession = await dbQuery<any[]>(query, [roomId, dayName, roomId]);

    if (activeSession.length > 0) {
      return NextResponse.json({ door_status: activeSession[0].door_status });
    }

    // Jika tidak ada jadwal/reservasi aktif, pastikan terkunci
    return NextResponse.json({ door_status: 0 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ door_status: 0 }); // Failsafe: Terkunci jika error
  }
}

// PATCH: ESP32 Melapor balik setelah mengunci pintu
export async function PATCH(request: Request, { params }: { params: Promise<{ esp_id: string }> }) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { esp_id } = await params;
    const body = await request.json();
    const { door_status } = body; 

    const now = new Date();
    const dayName = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][now.getDay()];

    const room = await dbQuery<any[]>("SELECT id FROM rooms WHERE esp_id = ?", [esp_id]);
    if (!room || room.length === 0) return NextResponse.json({ success: false });
    const roomId = room[0].id;

    // Update status jadwal yang sedang berjalan
    await dbQuery(`
      UPDATE schedules SET door_status = ? 
      WHERE room_id = ? AND day = ? 
      AND CURTIME() >= ADDTIME(start_time, '-00:15:00') 
      AND CURTIME() <= ADDTIME(end_time, '00:15:00')
    `, [door_status, roomId, dayName]);

    // Update status reservasi yang sedang berjalan
    await dbQuery(`
      UPDATE reservations SET door_status = ? 
      WHERE room_id = ? AND reservation_date = CURDATE() AND status = 'approved'
      AND CURTIME() >= ADDTIME(start_time, '-00:15:00') 
      AND CURTIME() <= ADDTIME(end_time, '00:15:00')
    `, [door_status, roomId]);

    return NextResponse.json({ success: true, message: "Status diperbarui oleh perangkat." });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}