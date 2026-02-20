"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

export default function CheckoutSuccessPage() {
    useEffect(() => {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#050A30', '#F8F7F2', '#ffffff']
        });
    }, []);

    return (
        <div className="min-h-screen pt-32 pb-20 bg-cream flex items-center justify-center">
            <div className="container mx-auto px-6 text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 text-green-600"
                >
                    <CheckCircle size={48} strokeWidth={3} />
                </motion.div>

                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="font-heading text-5xl font-bold uppercase tracking-tighter text-navy mb-4"
                >
                    Order Confirmed!
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-navy/60 max-w-lg mx-auto mb-8 text-lg"
                >
                    Thank you for your purchase. You're now part of the club. A confirmation email has been sent to your inbox.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <Link href="/">
                        <Button className="h-14 px-8 text-lg">Back to Home</Button>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
