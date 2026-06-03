import React from "react";
import { Input, type InputProps } from "../atoms/Input";
import { cn } from "../../lib/utils";

interface FormFieldProps extends InputProps {
  label: string;
  error?: string;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, className, id, ...props }, ref) => {
    // Membuat ID otomatis jika tidak diisi, penting untuk aksesibilitas (menghubungkan label & input)
    const inputId = id || `input-${label.replace(/\s+/g, "-").toLowerCase()}`;

    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
        
        {/* Memanggil Atom Input yang sudah kita buat */}
        <Input id={inputId} ref={ref} {...props} />
        
        {/* Jika ada error, tampilkan teks merah ini */}
        {error && (
          <span className="text-xs text-red-500 font-medium">{error}</span>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";