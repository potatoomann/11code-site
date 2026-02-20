"use client";

import Section from "@/components/ui/Section";

import { motion } from "framer-motion";

export default function AboutPage() {
    return (
        <div className="pt-24 min-h-screen">
            {/* Hero Section */}
            <Section className="relative py-24 md:py-40">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-5xl mx-auto text-center"
                >
                    <h1 className="font-heading text-7xl md:text-9xl font-black uppercase tracking-tighter text-navy mb-8 leading-[0.9]" style={{ transform: 'scaleY(1.1)' }}>
                        WEAR THE GAME<br />WE LOVE
                    </h1>
                    <p className="text-xl md:text-2xl text-navy/60 leading-relaxed max-w-3xl mx-auto mt-12 font-light">
                        Football is more than 90 minutes. It's the roar of the crowd, the history in the fabric, and the identity we wear on our backs.
                    </p>
                </motion.div>
            </Section>

            {/* Section 1: Philosophy - Text Left / Visual Right */}
            <Section className="py-24 border-t border-navy/5">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
                    <div className="md:col-span-5 md:col-start-2">
                        <h2 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tighter text-navy mb-6">
                            The Art of the Game
                        </h2>
                        <div className="space-y-6 text-navy/70 text-lg leading-relaxed">
                            <p>
                                <strong>11 Code</strong> wasn't founded to just sell shirts. It was born from a deep obsession with the aesthetics of the beautiful game. We believe that a football kit is a piece of modern art, a timestamp of culture, and a badge of honor.
                            </p>
                            <p>
                                In a world of fast fashion, we slow down. We curate. We verify. We bring you the pieces that matter—from the latest high-performance authentic player versions to the retro classics that defined generations.
                            </p>
                        </div>
                    </div>
                    <div className="md:col-span-5 md:col-start-7 h-[350px] bg-gray-100 rounded-sm relative overflow-hidden">
                        <img
                            src="/about-philosophy.png"
                            alt="Philosophy"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    </div>
                </div>
            </Section>

            {/* Section 2: Authenticity - Visual Left / Text Right */}
            <Section className="py-24 border-t border-navy/5">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
                    <div className="order-2 md:order-1 md:col-span-5 md:col-start-2 h-[500px] bg-navy text-cream rounded-sm relative overflow-hidden flex items-center justify-center">
                        <img
                            src="/about-authenticity.png"
                            alt="Authenticity"
                            className="absolute inset-0 w-full h-full object-cover"
                        />

                    </div>
                    <div className="order-1 md:order-2 md:col-span-5 md:col-start-8">
                        <h2 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tighter text-navy mb-6">
                            Beyond<br />The Pitch
                        </h2>
                        <div className="space-y-6 text-navy/70 text-lg leading-relaxed">
                            <p>
                                Football doesn't stop at the final whistle. It lives in the streets, the terraces, and the moments we share. Our collection is designed for those who carry the spirit of the game everywhere they go.
                            </p>
                            <p>
                                From iconic retro aesthetics to modern streetwear cuts, we celebrate the culture that unites the globe. 11 Code is more than a store—it's a tribute to the universal language of football lifestyle.
                            </p>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Contact Minimalist */}
            <Section className="py-32 border-t border-navy/5 bg-cream">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto text-center"
                >
                    <h2 className="font-heading text-3xl md:text-4xl font-bold uppercase tracking-tighter text-navy mb-12">
                        Get In Touch
                    </h2>


                    <div className="inline-block relative group mb-16">
                        <a
                            href="mailto:11codestore@gmail.com"
                            className="font-heading text-3xl md:text-5xl font-bold uppercase tracking-tighter text-navy hover:text-navy/60 transition-colors block"
                        >
                            11codestore<br />@gmail.com
                        </a>
                        <div className="h-1 w-0 bg-navy group-hover:w-full transition-all duration-300 mt-4 mx-auto" />
                    </div>



                </motion.div>
            </Section>
        </div>
    );
}
