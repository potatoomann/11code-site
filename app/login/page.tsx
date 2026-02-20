"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const form = e.target as HTMLFormElement;
        const email = (form.elements[0] as HTMLInputElement).value; // Assuming email is first input
        const password = (form.elements[1] as HTMLInputElement).value; // Password second

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (res.ok) {
                // Success - Redirect to home or dashboard
                const user = await res.json();
                console.log('Logged in as:', user);
                localStorage.setItem('user', JSON.stringify(user)); // Persist user

                // Check if there is a redirect param (simple client side check)
                const urlParams = new URLSearchParams(window.location.search);
                const redirect = urlParams.get('redirect');

                if (redirect) {
                    window.location.href = redirect;
                } else {
                    window.location.href = '/profile'; // Default to profile
                }
            } else {
                const data = await res.json();
                alert(data.error || 'Login failed');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
            {/* Left: Branding & Image */}
            <div className="hidden lg:flex relative bg-cream items-center justify-center overflow-hidden border-r border-navy/10">
                {/* Background Pattern */}
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
                        Welcome back to the club
                    </motion.p>
                </div>
            </div>

            {/* Right: Login Form */}
            <div className="flex items-center justify-center bg-cream p-6 lg:p-24 pt-32 lg:pt-24">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md space-y-8"
                >
                    <div className="text-center lg:text-left">
                        <h2 className="font-heading text-3xl font-bold uppercase tracking-tighter text-navy">Member Sign In</h2>
                        <p className="text-navy/60 mt-2">Enter your credentials to access your account.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input label="Email address" type="email" placeholder="name@example.com" required />
                        <div className="space-y-2">
                            <Input label="Password" type="password" placeholder="••••••••" required />
                            <div className="flex justify-end">
                                <Link href="/forgot-password" className="text-xs text-navy/60 hover:text-navy font-medium">
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        <Button className="w-full h-12" disabled={isLoading}>
                            {isLoading ? "Signing in..." : "Sign In"}
                        </Button>
                    </form>

                    <div className="text-center text-sm text-navy/60">
                        Not a member?{" "}
                        <Link href="/register" className="font-bold text-navy hover:opacity-70 transition-opacity">
                            Join the Club
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
