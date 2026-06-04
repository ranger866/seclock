import { NextResponse } from "next/server";
import { dbQuery } from "../../../../../lib/db";

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function isAuthorized(request: Request) {
  return request.headers.get("x-api-key") === process.env.DEVICE_API_SECRET;
}

export async function GET(request: Request, { params }: { params: Promise<{ esp_id: string }> }) {
  try {
    if (!isAuthorized(request)) return NextResponse.json({ success: false }, { status: 401 });

    const { esp_id } = await params;
    const dayName = DAYS[new Date().getDay()];
    
    const query = `
      SELECT combined.door_status FROM (
        SELECT s.door_status, s.start_time, s.end_time 
        FROM schedules s JOIN rooms r ON s.room_id = r.id
        WHERE r.esp_id = ? AND s.day = ?
        UNION ALL
        SELECT res.door_status, res.start_time, res.end_time 
        FROM reservations res JOIN rooms r ON res.room_id = r.id
        WHERE r.esp_id = ? AND res.reservation_date = CURDATE() AND res.status = 'approved'
      ) AS combined
      WHERE CURTIME() BETWEEN ADDTIME(combined.start_time, '-00:15:00') AND ADDTIME(combined.end_time, '00:15:00')
      LIMIT 1
    `;

    const activeSession = await dbQuery<any[]>(query, [esp_id, dayName, esp_id]);
    return NextResponse.json({ door_status: activeSession.length > 0 ? activeSession[0].door_status : 0 });
  } catch (error) {
    return NextResponse.json({ door_status: 0 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ esp_id: string }> }) {
  try {
    if (!isAuthorized(request)) return NextResponse.json({ success: false }, { status: 401 });

    const { esp_id } = await params;
    const { door_status } = await request.json();
    const dayName = DAYS[new Date().getDay()];

    // Mengeksekusi UPDATE secara paralel untuk efisiensi waktu maksimum di Vercel
    await Promise.all([
      // 1. Update Schedules (Langsung JOIN dengan tabel rooms)
      dbQuery(`
        UPDATE schedules s
        JOIN rooms r ON s.room_id = r.id
        SET s.door_status = ? 
        WHERE r.esp_id = ? AND s.day = ? 
        AND CURTIME() BETWEEN ADDTIME(s.start_time, '-00:15:00') AND ADDTIME(s.end_time, '00:15:00')
      `, [door_status, esp_id, dayName]),

      // 2. Update Reservations (Langsung JOIN dengan tabel rooms)
      dbQuery(`
        UPDATE reservations res
        JOIN rooms r ON res.room_id = r.id
        SET res.door_status = ? 
        WHERE r.esp_id = ? AND res.reservation_date = CURDATE() AND res.status = 'approved'
        AND CURTIME() BETWEEN ADDTIME(res.start_time, '-00:15:00') AND ADDTIME(res.end_time, '00:15:00')
      `, [door_status, esp_id])
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}