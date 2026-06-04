import mysql from "mysql2/promise";

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
  ssl: process.env.DB_CA 
    ? { 
        ca: process.env.DB_CA.replace(/\\n/g, '\n'), // Memastikan newline terbaca
        rejectUnauthorized: true 
      } 
    : undefined,
  dateStrings: true,
  timezone: "+08:00"
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