"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "outline" | "ghost";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", ...props }, ref) => {
        const variants = {
            primary:
                "bg-navy text-cream border-2 border-navy hover:bg-cream hover:text-navy hover:shadow-[0_0_20px_rgba(5,10,48,0.3)] shadow-[0_4px_10px_rgba(0,0,0,0.1)]",
            outline:
                "bg-transparent text-navy border-2 border-navy hover:bg-navy hover:text-cream",
            ghost: "bg-transparent text-navy hover:bg-navy/5",
        };

        return (
            <button
                ref={ref}
                className={cn(
                    "px-6 py-3 rounded-none font-bold uppercase tracking-wider transition-all duration-200 ease-out active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
                    variants[variant],
                    className
                )}
                {...props}
                suppressHydrationWarning
            />
        );
    }
);

Button.displayName = "Button";

export { Button };
