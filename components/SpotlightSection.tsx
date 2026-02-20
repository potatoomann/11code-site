"use client";

import Link from "next/link";
import Section from "./ui/Section";
import { Button } from "./ui/Button";
import { motion } from "framer-motion";

export default function SpotlightSection() {
    return (
        <Section className="bg-cream text-navy py-32 relative overflow-hidden">
            {/* Glow Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-navy/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1 flex justify-center">
                    {/* Pedestal/Jersey Placeholder */}
                    {/* Floating Jersey Animation */}
                    {/* Display Case Image (Static) */}
                    <div className="relative w-full max-w-[500px] aspect-[3/4] flex items-center justify-center">
                        <div className="relative w-full h-full z-10">
                            <img
                                src="/spotlight-display.png"
                                alt="Vintage Jersey Display"
                                className="w-full h-full object-contain drop-shadow-2xl"
                            />
                        </div>

                        {/* Background Glow (Static) */}
                        <div className="absolute inset-0 bg-navy/5 blur-[100px] rounded-full -z-10" />
                    </div>
                </div>

                <div className="order-1 md:order-2 space-y-8 text-center md:text-left">
                    <h2 className="font-heading text-5xl md:text-7xl font-bold uppercase tracking-tighter text-navy mb-6">
                        Spotlight: <br />
                        <span className="text-navy">
                            THE ARCHIVE
                        </span>
                    </h2>
                    <p className="text-lg text-navy/60 max-w-md mx-auto md:mx-0">
                        Own a piece of history. Discover our curated collection of authentic vintage jerseys, preserved in pristine condition for the ultimate collector.
                    </p>
                    <Link href="/shop?category=Retro">
                        <Button variant="outline" className="border-navy text-navy hover:bg-navy hover:text-cream hover:shadow-[0_0_20px_rgba(5,10,48,0.2)]">
                            EXPLORE COLLECTION
                        </Button>
                    </Link>
                </div>
            </div>
        </Section>
    );
}
