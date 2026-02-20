"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/Button";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

const variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

const cardVariants = (index: number) => {
    const spread = [
        { x: 0, y: -100, scale: 1, zIndex: 3 },
        { x: -450, y: -20, scale: 0.9, rotate: -3, zIndex: 2 },
        { x: 450, y: -20, scale: 0.9, rotate: 3, zIndex: 2 },
        { x: -250, y: 220, scale: 0.85, rotate: -6, zIndex: 4 },
        { x: 250, y: 220, scale: 0.85, rotate: 6, zIndex: 4 },
    ];
    return {
        hidden: { x: 0, y: 0, scale: 0.5, opacity: 0, rotate: 0 },
        visible: {
            ...spread[index],
            opacity: 1,
            transition: {
                duration: 1.2,
                ease: [0.22, 1, 0.36, 1] as const,
                delay: 0.2
            }
        }
    };
};

export default function Hero() {
    const [isMobile, setIsMobile] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Mobile slideshow interval
    useEffect(() => {
        if (!isMobile) return;
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % 5);
        }, 3000); // Change slide every 3 seconds
        return () => clearInterval(interval);
    }, [isMobile]);

    const getCardVariants = (index: number) => {
        if (!isMobile) {
            // Desktop Spread - Static
            const spread = [
                { x: 0, y: -100, scale: 1, zIndex: 3 }, // Center (moved up)
                { x: -450, y: -20, scale: 0.9, rotate: -3, zIndex: 2 }, // Far Left
                { x: 450, y: -20, scale: 0.9, rotate: 3, zIndex: 2 }, // Far Right
                { x: -250, y: 220, scale: 0.85, rotate: -6, zIndex: 4 }, // Bottom Left
                { x: 250, y: 220, scale: 0.85, rotate: 6, zIndex: 4 }, // Bottom Right
            ];
            return {
                hidden: { x: 0, y: 0, scale: 0.5, opacity: 0, rotate: 0 },
                visible: {
                    ...spread[index],
                    opacity: 1,
                    transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] as const, delay: 0.2 }
                }
            };
        } else {
            // Mobile Slideshow - Dynamic
            const isActive = index === activeIndex;
            return {
                hidden: { opacity: 0, scale: 0.9, x: 0, y: 0 },
                visible: {
                    opacity: isActive ? 1 : 0,
                    scale: isActive ? 1 : 0.95,
                    x: 0,
                    y: 0,
                    zIndex: isActive ? 10 : 0,
                    rotate: 0,
                    transition: {
                        duration: 0.5,
                        ease: "easeInOut" as const
                    }
                }
            };
        }
    };

    // Mobile Hero Layout
    if (isMobile) {
        return (
            <section className="relative h-[85vh] w-full overflow-hidden pt-20 bg-cream">
                <div className="relative w-full h-full">
                    {/* Optimized Slider: Render all images, toggle opacity */}
                    {[0, 1, 2, 3, 4].map((index) => (
                        <div
                            key={index}
                            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                        >
                            <Image
                                src={`/hero-player-${index + 1}.png`}
                                alt={`Featured Collection ${index + 1}`}
                                fill
                                className="object-cover object-top"
                                priority={index < 2} // Priority load first 2 images
                            />
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        </div>
                    ))}

                    {/* Shop Now Badge - Bottom Left */}
                    <div className="absolute bottom-8 left-6 z-20">
                        <Link href="/shop">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                className="bg-white text-navy px-6 py-2.5 rounded shadow-lg font-bold uppercase tracking-wider text-sm flex items-center gap-2"
                            >
                                Shop Now
                            </motion.button>
                        </Link>
                    </div>

                    {/* Pagination Dots */}
                    <div className="absolute bottom-8 right-6 z-20 flex gap-2">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 rounded-full transition-all ${i === activeIndex ? "bg-white w-6" : "bg-white/50"}`}
                            />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    // Desktop Hero Layout (Unchanged)
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24 md:pt-20 pb-12 md:pb-0 bg-cream">


            <div className="z-20 text-center mb-0 md:mb-12 px-4 relative">
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                    className="font-heading text-5xl sm:text-7xl md:text-9xl font-bold uppercase tracking-tighter text-navy mb-4 md:mb-8 drop-shadow-2xl [-webkit-text-stroke:1px_rgba(255,255,255,0.5)] leading-[0.9]"
                >
                    11 Code Store
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="text-sm sm:text-lg md:text-xl text-navy font-bold tracking-[0.2em] md:tracking-widest uppercase mb-8 md:mb-12 drop-shadow-sm opacity-90"
                >
                    Premium Football Culture
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1 }}
                    className="mb-8 md:mb-0 flex justify-center"
                >
                    <Link href="/shop">
                        <Button className="w-full md:w-auto px-12 py-6 text-lg bg-navy text-cream hover:bg-navy/90 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all border border-cream/10 font-bold tracking-widest">
                            Shop The Drop
                        </Button>
                    </Link>
                </motion.div>
            </div>

            {/* Cards Container */}
            <div className={`relative w-full max-w-7xl mx-auto h-[500px] md:h-[600px] md:absolute md:inset-x-0 md:top-1/2 md:-translate-y-1/2 pointer-events-none transition-all duration-500`}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <motion.div
                            key={i}
                            custom={i}
                            initial="hidden"
                            animate="visible"
                            variants={getCardVariants(i)}
                            className="absolute w-80 h-[420px] md:w-72 md:h-96 bg-cream shadow-2xl rounded-xl border-[4px] border-white flex items-center justify-center overflow-hidden cursor-pointer"
                            style={{
                                backgroundColor: i === 0 ? '#fff' : '#f8f8f8'
                            }}
                            whileHover={{
                                scale: 1.1,
                                rotate: 0,
                                zIndex: 20,
                                transition: { duration: 0.3 }
                            }}
                        >
                            <div className="w-full h-full bg-navy relative group">
                                <Image
                                    src={`/hero-player-${i + 1}.png`}
                                    alt={`Featured Player ${i + 1}`}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                    priority={i <= 2}
                                />
                                {/* Glass Shine Effect */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-5 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#050A30 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            />

            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cream z-10 pointer-events-none" />
        </section>
    );
}
