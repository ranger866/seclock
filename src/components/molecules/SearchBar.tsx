import React from "react";
import { Input, type InputProps } from "../atoms/Input";
import { Search } from "lucide-react";
import { cn } from "../../lib/utils";

export const SearchBar = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className={cn("relative w-full", className)}>
        {/* Ikon Kaca Pembesar di posisi absolut (kiri) */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-4 h-4 text-gray-400" />
        </div>
        
        {/* Atom Input dengan tambahan padding kiri (pl-10) agar teks tidak menabrak ikon */}
        <Input
          ref={ref}
          type="search"
          className="pl-10" 
          {...props}
        />
      </div>
    );
  }
);

SearchBar.displayName = "SearchBar";