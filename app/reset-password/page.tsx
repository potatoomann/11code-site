"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion } from "framer-motion";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ResetPasswordForm() {
    const [isLoading, setIsLoading] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const form = e.target as HTMLFormElement;
        const password = (form.elements[0] as HTMLInputElement).value;
        const confirmPassword = (form.elements[1] as HTMLInputElement).value;

        if (password !== confirmPassword) {
            alert("Passwords do not match");
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            if (res.ok) {
                alert("Password reset successfully. Please login.");
                router.push("/login");
            } else {
                const data = await res.json();
                alert(data.error || 'Reset failed');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="text-center text-navy">
                <p>Invalid or missing token.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Input label="New Password" type="password" placeholder="••••••••" required />
            <Input label="Confirm Password" type="password" placeholder="••••••••" required />

            <Button className="w-full h-12" disabled={isLoading}>
                {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
            {/* Left: Branding & Image */}
            <div className="hidden lg:flex relative bg-cream items-center justify-center overflow-hidden border-r border-navy/10">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
                <div className="bg-navy/5 blur-[150px] w-[500px] h-[500px] rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

                <div className="relative z-10 text-center p-12">
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        className="font-heading text-8xl font-bold uppercase tracking-tighter text-navy"
                    >
                        11 Code
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="text-navy/60 mt-4 tracking-widest uppercase font-medium"
                    >
                        Secure Access
                    </motion.p>
                </div>
            </div>

            {/* Right: Reset Form */}
            <div className="flex items-center justify-center bg-cream p-6 lg:p-24 pt-32 lg:pt-24">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md space-y-8"
                >
                    <div className="text-center lg:text-left">
                        <h2 className="font-heading text-3xl font-bold uppercase tracking-tighter text-navy">Set New Password</h2>
                        <p className="text-navy/60 mt-2">Enter your new password below.</p>
                    </div>

                    <Suspense fallback={<div>Loading...</div>}>
                        <ResetPasswordForm />
                    </Suspense>
                </motion.div>
            </div>
        </div>
    );
}
