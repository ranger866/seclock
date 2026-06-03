"use client";

import React, { useState, useRef, useEffect } from "react";
import { SearchBar } from "../molecules/SearchBar";
import { cn } from "../../lib/utils";

export interface SearchResult {
  id: number;
  name: string;
  identifier: string; // NIM Mahasiswa
}

export interface LiveSearchProps {
  data: SearchResult[]; // Data mentah mahasiswa dari database
  onSelect: (selected: SearchResult) => void;
  placeholder?: string;
  className?: string;
}

export const LiveSearch: React.FC<LiveSearchProps> = ({
  data,
  onSelect,
  placeholder = "Cari nama atau NIM...",
  className,
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Logika filter data berdasarkan input ketikan (Nama atau NIM)
  const filteredData = data.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    item.identifier.includes(query)
  ).slice(0, 5); // Batasi hanya tampil 5 hasil teratas agar rapi

  // Logika untuk menutup dropdown saat user klik di luar area komponen
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className={cn("relative w-full", className)}>
      {/* Input Pencarian (Menggunakan Molecule yang sudah kita buat) */}
      <SearchBar
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />

      {/* Dropdown Hasil Pencarian */}
      {isOpen && query.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredData.length > 0 ? (
            <ul className="py-1">
              {filteredData.map((item) => (
                <li
                  key={item.id}
                  onClick={() => {
                    onSelect(item);
                    setQuery(item.name); // Isi input dengan nama yang dipilih
                    setIsOpen(false);    // Tutup dropdown
                  }}
                  className="px-4 py-2 cursor-pointer hover:bg-blue-50"
                >
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.identifier}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500">
              Mahasiswa tidak ditemukan.
            </div>
          )}
        </div>
      )}
    </div>
  );
};