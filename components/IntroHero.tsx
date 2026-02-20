"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "./ui/Button";

// Placeholder mapping using existing assets
const INTRO_SEQUENCE = [
    {
        name: "RONALDO",
        image: "/hero-player-1.png", // User to replace with intro-ronaldo.png
        color: "#c0c0c0", // Silver
        number: "7"
    },
    {
        name: "MESSI",
        image: "/hero-player-2.png", // User to replace with intro-messi.png
        color: "#6e1d2c", // Barça/Classic tone
        number: "10"
    },
    {
        name: "NEYMAR",
        image: "/hero-player-3.png", // User to replace with intro-neymar.png
        color: "#e8e835", // Brazil Yellow
        number: "11"
    },
    {
        name: "BECKHAM",
        image: "/hero-player-4.png", // User to replace with intro-beckham.png
        color: "#ce1124", // Red
        number: "23"
    },
    {
        name: "ZIDANE",
        image: "/hero-player-5.png", // User to replace with intro-zidane.png
        color: "#0000ff", // Blue
        number: "5"
    }
];

export default function IntroHero() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showIntro, setShowIntro] = useState(true);
    const [showLogo, setShowLogo] = useState(false);

    useEffect(() => {
        // Play through the sequence
        const timer = setTimeout(() => {
            if (currentIndex < INTRO_SEQUENCE.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                // Sequence finished, show logo
                setTimeout(() => {
                    setShowIntro(false);
                    setShowLogo(true);
                }, 2000); // Hold the last player for 2s
            }
        }, 3000); // 3 seconds per player

        return () => clearTimeout(timer);
    }, [currentIndex]);

    return (
        <section className="relative h-screen w-full bg-black overflow-hidden flex items-center justify-center">

            {/* INTRO PLAYERS SEQUENCE */}
            <AnimatePresence mode="wait">
                {showIntro && (
                    <motion.div
                        key="intro-container"
                        className="absolute inset-0 z-10"
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, scale: 1.2 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="absolute inset-0 w-full h-full"
                        >
                            {/* Background Atmosphere */}
                            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black z-10" />

                            {/* Player Image */}
                            <Image
                                src={INTRO_SEQUENCE[currentIndex].image}
                                alt={INTRO_SEQUENCE[currentIndex].name}
                                fill
                                className="object-cover object-top"
                                priority
                            />

                            {/* Text/Number Overlay */}
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
                                <motion.div
                                    initial={{ y: 50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.5, duration: 0.8 }}
                                    className="text-center"
                                >
                                    <h2 className="text-[200px] md:text-[300px] font-bold text-white/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none">
                                        {INTRO_SEQUENCE[currentIndex].number}
                                    </h2>
                                </motion.div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* LOGO REVEAL / FINAL HERO STATE */}
            {showLogo && (
                <motion.div
                    className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-cream"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                >
                    {/* Background Loop/Video Vibe */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20" />
                    </div>

                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className="text-center relative z-10 p-8"
                    >
                        <h1 className="font-heading text-6xl md:text-9xl font-black uppercase text-navy mb-4 tracking-tighter leading-none">
                            11 CODE<br />STORE
                        </h1>
                        <p className="text-xl md:text-2xl text-navy/80 font-bold tracking-[0.5em] uppercase mb-12">
                            The Game. The Style.
                        </p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1, duration: 0.8 }}
                        >
                            <Link href="/shop">
                                <Button className="px-12 py-6 text-lg bg-navy text-cream hover:bg-navy/90 shadow-2xl transition-all hover:scale-105 uppercase font-bold tracking-widest">
                                    Enter The Store
                                </Button>
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* Cinematic Footer */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2, duration: 1 }}
                        className="absolute bottom-10 text-navy/40 text-sm font-mono"
                    >
                        EST. 2024 © 8K INTRO PRODUCTION
                    </motion.div>
                </motion.div>
            )}
        </section>
    );
}
