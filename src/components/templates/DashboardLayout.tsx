import React from "react";
import { Sidebar } from "../organisms/Sidebar";
import { Navbar } from "../organisms/Navbar"; // Navbar kembali diimpor
import { BottomBar } from "../organisms/BottomBar";
import { Role } from "../../types";

export interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: Role;
  userName: string;
  identifier: string;
  onLogout: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  userRole,
  userName,
  identifier,
  onLogout,
}) => {
  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* 1. Sidebar: Hanya Desktop */}
      <div className="hidden md:block">
        <Sidebar userRole={userRole} onLogout={onLogout} />
      </div>

      {/* 2. Area Konten Utama */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Navbar kembali dipasang di sini */}
        <Navbar 
          userName={userName} 
          userRole={userRole} 
          identifier={identifier} 
        />
        
        <main className="flex-1 overflow-auto p-4 md:p-6 pb-20">
          {children}
        </main>
      </div>

      {/* 3. BottomBar: Hanya Mobile */}
      <div className="md:hidden">
        <BottomBar userRole={userRole} onLogout={onLogout} />
      </div>
      
    </div>
  );
};