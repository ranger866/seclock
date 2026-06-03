import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Cpu, Clock } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar Minimalis Publik */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 sm:px-12">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-600 rounded-lg">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">
            SECURE<span className="text-blue-600">LOCK</span>
          </span>
        </div>
        <div>
          <Link
            href="/login"
            className="px-5 py-2.5 text-sm font-semibold text-white transition-colors bg-blue-600 rounded-full hover:bg-blue-700"
          >
            Masuk ke Sistem
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center sm:px-12 lg:pt-32">
        <div className="inline-flex items-center px-4 py-2 mb-8 text-sm font-medium text-blue-800 bg-blue-50 rounded-full ring-1 ring-blue-600/20">
          <span className="flex w-2 h-2 mr-2 bg-blue-600 rounded-full animate-pulse"></span>
          Sistem Terintegrasi IoT & Next.js
        </div>
        
        <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
          Manajemen Akses Ruang Kelas <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
            Lebih Pintar & Aman
          </span>
        </h1>
        
        <p className="max-w-2xl mt-6 text-lg text-gray-600 sm:text-xl">
          Tinggalkan kunci manual. SECURELOCK menghubungkan jadwal akademik dengan sistem pengunci pintu berbasis ESP32 secara real-time untuk efisiensi fasilitas kampus.
        </p>

        <div className="flex flex-col gap-4 mt-10 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white transition-all bg-blue-600 rounded-full shadow-sm hover:bg-blue-700 hover:shadow-md"
          >
            Mulai Gunakan
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-gray-900 transition-colors bg-white border border-gray-200 rounded-full hover:bg-gray-50"
          >
            Pelajari Fitur
          </a>
        </div>
      </main>

      {/* Fitur Section */}
      <section id="features" className="px-6 py-20 bg-gray-50 sm:px-12 lg:px-24">
        <div className="grid max-w-6xl grid-cols-1 gap-12 mx-auto md:grid-cols-3">
          
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center w-16 h-16 mb-6 bg-blue-100 rounded-2xl text-blue-600">
              <Cpu className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Integrasi Hardware IoT</h3>
            <p className="mt-3 text-gray-600">
              Terhubung langsung dengan mikrokontroler di setiap pintu untuk memberikan perintah buka/tutup dalam hitungan milidetik.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center w-16 h-16 mb-6 bg-cyan-100 rounded-2xl text-cyan-600">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Sinkronisasi Jadwal</h3>
            <p className="mt-3 text-gray-600">
              Pintu hanya dapat diakses sesuai dengan jadwal perkuliahan atau reservasi ruangan yang telah disetujui.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center w-16 h-16 mb-6 bg-indigo-100 rounded-2xl text-indigo-600">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Role-Based Access</h3>
            <p className="mt-3 text-gray-600">
              Wewenang spesifik untuk Dosen, Ketua Kelas, dan Admin. Setiap aktivitas akses terekam otomatis di dalam sistem.
            </p>
          </div>

        </div>
      </section>
    </div>
  );
}