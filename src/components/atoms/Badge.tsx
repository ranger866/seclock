import React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "neutral", children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border";

    const variants = {
      success: "bg-green-50 text-green-700 border-green-200",   // Untuk status: Approved / Available
      warning: "bg-yellow-50 text-yellow-700 border-yellow-200", // Untuk status: Pending
      danger: "bg-red-50 text-red-700 border-red-200",           // Untuk status: Rejected / Maintenance
      info: "bg-blue-50 text-blue-700 border-blue-200",          // Untuk status: Active / Terkunci
      neutral: "bg-gray-50 text-gray-700 border-gray-200",       // Untuk Default
    };

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Badge.displayName = "Badge";