import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

// Membuat koneksi pool ke TiDB / MySQL
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 4000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    // Membaca isi file .pem dari sistem, lalu mengubahnya menjadi string
    ca: process.env.DB_CA 
      ? fs.readFileSync(path.join(process.cwd(), process.env.DB_CA)).toString()
      : undefined,
    rejectUnauthorized: true,
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function dbQuery<T>(sql: string, values?: any[]): Promise<T> {
  try {
    const [rows] = await pool.execute(sql, values);
    return rows as T;
  } catch (error) {
    console.error("Database Query Error:", error);
    throw new Error("Gagal mengeksekusi perintah ke database.");
  }
}