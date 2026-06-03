"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "../../../components/templates/AuthLayout";
import { FormField } from "../../../components/molecules/FormField";
import { Button } from "../../../components/atoms/Button";

export default function LoginPage() {
  const router = useRouter();
  
  // State untuk menyimpan ketikan user dan status form
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Mencegah browser melakukan refresh halaman
    setError("");
    setIsLoading(true);

    try {
      // Memanggil fungsi login bawaan Next-Auth ke API yang sudah kita buat
      const res = await signIn("credentials", {
        identifier,
        password,
        redirect: false, // Kita handle redirect secara manual agar transisi mulus
      });

      if (res?.error) {
        // Jika API mengembalikan error (misal: password salah)
        setError(res.error);
      } else {
        // Jika sukses, arahkan ke halaman Dashboard utama
        router.push("/dashboard"); 
      }
    } catch (err) {
      setError("Terjadi kesalahan pada sistem. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Masuk ke Akun Anda"
      subtitle="Gunakan NIM, NIP, atau Email yang terdaftar di sistem."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Kotak peringatan merah jika login gagal */}
        {error && (
          <div className="p-3 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        {/* Input Identitas */}
        <FormField
          label="NIM / NIP / Email"
          type="text"
          placeholder="Masukkan identitas Anda..."
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          disabled={isLoading}
        />

        {/* Input Password */}
        <FormField
          label="Kata Sandi"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />

        {/* Tombol Submit */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            className="w-full h-11"
            disabled={isLoading}
          >
            {isLoading ? "Memverifikasi..." : "Masuk ke Sistem"}
          </Button>
        </div>
        
      </form>
    </AuthLayout>
  );
}