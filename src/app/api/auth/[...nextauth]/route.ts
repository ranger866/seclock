import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// Pastikan jumlah titik-titik (../) pas untuk kembali ke folder lib
import { dbQuery } from "../../../../lib/db"; 

// Mendefinisikan bentuk data dari tabel users
interface DBUser {
  id: number;
  identifier: string;
  email: string;
  name: string;
  password: string;
  role: string;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "NIM / NIP / Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("NIM/NIP dan Password wajib diisi");
        }

        try {
          // Cari user di database (TiDB)
          // Menggunakan array any[] karena dbQuery mengembalikan array baris
          const users = await dbQuery<DBUser[]>(
            "SELECT * FROM users WHERE identifier = ? OR email = ? LIMIT 1",
            [credentials.identifier, credentials.identifier]
          );

          if (!users || users.length === 0) {
            throw new Error("Akun tidak ditemukan");
          }

          const user = users[0];

          // Cocokkan password
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            throw new Error("Password salah");
          }

          // Jika berhasil, kembalikan data user (TANPA PASSWORD)
          return {
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            identifier: user.identifier,
          };
        } catch (error: unknown) {
          console.error("Auth Database Error:", error);
          // Mengecek apakah error tersebut memiliki pesan (message)
          const errorMessage = error instanceof Error ? error.message : "Gagal menghubungi database";
          throw new Error(errorMessage);
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Mengubah 'any' menjadi struktur objek yang jelas
        const customUser = user as unknown as{ role: string; identifier: string };
        token.role = customUser.role;
        token.identifier = customUser.identifier;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Memberitahu TypeScript bahwa session.user kita punya tambahan 3 kolom ini
        const sessionUser = session.user as {
          id: string;
          role: string;
          identifier: string;
        };
        sessionUser.id = token.id as string;
        sessionUser.role = token.role as string;
        sessionUser.identifier = token.identifier as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  // Menggunakan fallback string kosong agar tidak error jika .env belum terbaca
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_sementara_untuk_dev", 
  
  // Fitur debug aktif agar error tercetak jelas di terminal
  debug: true, 
};

const handler = NextAuth(authOptions);

// WAJIB: Next.js App Router butuh export GET dan POST
// Ini alasan utama kenapa sering terjadi error 404/HTML
export { handler as GET, handler as POST };