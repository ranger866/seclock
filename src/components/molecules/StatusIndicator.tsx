import React from "react";
import { cn } from "../../lib/utils";

export interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  status: "online" | "offline" | "maintenance";
  label?: string;
}

export const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ status, label, className, ...props }, ref) => {
    
    // Logika warna untuk titik (dot) indikator
    const dotColors = {
      online: "bg-green-500",
      offline: "bg-red-500",
      maintenance: "bg-yellow-500",
    };

    // Logika warna untuk efek ping/pulse (gelombang) di sekeliling titik
    const pulseColors = {
      online: "bg-green-400",
      offline: "bg-red-400",
      maintenance: "bg-yellow-400",
    };

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2", className)}
        {...props}
      >
        <div className="relative flex h-3 w-3">
          {/* Efek animasi berkedip/gelombang, kita matikan kalau sedang offline */}
          {status !== "offline" && (
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                pulseColors[status]
              )}
            ></span>
          )}
          {/* Titik inti indikatornya */}
          <span
            className={cn(
              "relative inline-flex h-3 w-3 rounded-full",
              dotColors[status]
            )}
          ></span>
        </div>
        
        {/* Teks label opsional */}
        {label && (
          <span className="text-xs font-medium text-gray-600 capitalize">
            {label}
          </span>
        )}
      </div>
    );
  }
);

StatusIndicator.displayName = "StatusIndicator";