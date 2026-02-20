"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, ...props }, ref) => {
        return (
            <div className="space-y-2">
                {label && (
                    <label className="text-xs font-bold uppercase tracking-wider text-navy/60">
                        {label}
                    </label>
                )}
                <input
                    type={type}
                    className={cn(
                        "flex h-12 w-full border border-navy/10 bg-white px-4 py-3 text-sm placeholder:text-navy/30 focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition-all duration-200",
                        className
                    )}
                    ref={ref}
                    {...props}
                    suppressHydrationWarning
                />
            </div>
        );
    }
);
Input.displayName = "Input";

export { Input };
