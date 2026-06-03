import React from "react";
import { cn } from "../../lib/utils";

export interface SmartChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const SmartChip = React.forwardRef<HTMLButtonElement, SmartChipProps>(
  ({ className, active = false, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none",
          active
            ? "bg-blue-600 text-white shadow-md"           // Tampilan saat dipilih
            : "bg-gray-100 text-gray-600 hover:bg-gray-200", // Tampilan default/tidak dipilih
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

SmartChip.displayName = "SmartChip";