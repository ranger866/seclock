"use client";

import React from "react";
import { Plus } from "lucide-react";

interface FABProps {
  onClick: () => void;
  label?: string; // Opsional: jika ingin menambahkan teks
}

export const FAB = ({ onClick }: FABProps) => {
  return (
    <button
      onClick={onClick}
      className="md:hidden fixed bottom-20 right-6 z-40 bg-blue-600 text-white p-4 rounded-full shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95"
      aria-label="Tambah Data"
    >
      <Plus className="w-6 h-6" />
    </button>
  );
};