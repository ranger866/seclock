import React from "react";
import { Clock, MapPin, Users } from "lucide-react";
import { Button } from "../atoms/Button";
import { Badge } from "../atoms/Badge";
import { StatusIndicator } from "../molecules/StatusIndicator";
import { cn } from "../../lib/utils";
// Kita import tipe data resmi dari blueprint
import { RoomStatus } from "../../types"; 

export interface RoomCardProps {
  roomName: string;
  location: string;
  espStatus: "online" | "offline" | "maintenance";
  roomStatus: RoomStatus; // <-- Menggunakan tipe dari index.d.ts ('active' | 'maintenance')
  
  currentSchedule?: {
    subjectName: string;
    dosenName: string;
    startTime: string; 
    endTime: string;   
  };

  permissions: {
    canOpen: boolean;
    canHold: boolean;
    canEnd: boolean;
  };
  
  onOpenDoor?: () => void;
  onHoldDoor?: () => void;
  onEndClass?: () => void;
  className?: string;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  roomName,
  location,
  espStatus,
  roomStatus,
  currentSchedule,
  permissions,
  onOpenDoor,
  onHoldDoor,
  onEndClass,
  className,
}) => {
  // Logika cerdas untuk menentukan status Badge tanpa merusak tipe data DB
  const getBadgeVariant = () => {
    if (roomStatus === "maintenance") return "danger";
    if (currentSchedule) return "warning"; // Active tapi ada kelas
    return "success"; // Active dan kosong
  };

  const getBadgeText = () => {
    if (roomStatus === "maintenance") return "Perbaikan";
    if (currentSchedule) return "Sedang Digunakan";
    return "Tersedia";
  };

  return (
    <div className={cn("flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md", className)}>
      
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{roomName}</h3>
          <div className="flex items-center mt-1 text-sm text-gray-500">
            <MapPin className="w-4 h-4 mr-1 text-gray-400" />
            {location}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusIndicator status={espStatus} label={espStatus} />
          <Badge variant={getBadgeVariant()}>{getBadgeText()}</Badge>
        </div>
      </div>

      <hr className="mb-4 border-gray-100" />

      <div className="flex-grow mb-5">
        {currentSchedule ? (
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-700">
              <Users className="w-4 h-4 mr-2 text-blue-500" />
              <span className="font-medium line-clamp-1">{currentSchedule.subjectName}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 pl-6">
              <span className="text-xs text-gray-500 mr-2">Dosen:</span> 
              {currentSchedule.dosenName}
            </div>
            <div className="flex items-center text-sm text-gray-600 pl-6">
              <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
              {currentSchedule.startTime} - {currentSchedule.endTime} WITA
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 py-6">
            <p className="text-sm text-gray-500">
              {roomStatus === "maintenance" ? "Ruangan tidak dapat digunakan" : "Tidak ada jadwal saat ini"}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-gray-100">
        {permissions.canOpen && (
          <Button variant="primary" className="flex-1" onClick={onOpenDoor} disabled={espStatus !== "online" || roomStatus === "maintenance"}>
            Buka Pintu
          </Button>
        )}
        
        {permissions.canHold && (
          <Button variant="secondary" className="flex-1" onClick={onHoldDoor} disabled={espStatus !== "online" || roomStatus === "maintenance"}>
            Hold Open
          </Button>
        )}
        
        {permissions.canEnd && (
          <Button variant="danger" className="w-full mt-1" onClick={onEndClass}>
            Akhiri Sesi (Kunci Pintu)
          </Button>
        )}
        
        {!permissions.canOpen && !permissions.canHold && !permissions.canEnd && (
          <p className="w-full text-center text-xs text-gray-400 italic">
            Anda tidak memiliki akses ke ruangan ini
          </p>
        )}
      </div>
    </div>
  );
};
