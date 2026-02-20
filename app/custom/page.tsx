"use client";

import { useState, useEffect } from "react";
import Section from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/useCartStore";
import { motion } from "framer-motion";

interface Product {
    id: string;
    name: string;
    price: number;
    team: string;
    image: string;
    category: string;
    sizes?: string;
}

export default function CustomJerseyPage() {
    const [product, setProduct] = useState<Product | null>(null);
    const [customName, setCustomName] = useState("");
    const [customNumber, setCustomNumber] = useState("10");
    const [selectedSize, setSelectedSize] = useState("M");
    const [isLoading, setIsLoading] = useState(true);

    // 3D & Style State
    const [isFlipped, setIsFlipped] = useState(false);
    const [jerseyColor, setJerseyColor] = useState("Black");

    const addItem = useCartStore((state) => state.addItem);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await fetch("/api/products", { cache: "no-store" });
                const data = await res.json();
                if (Array.isArray(data)) {
                    const customProduct = data.find((p: Product) => p.name === "Customize" || p.name.includes("Customize"));
                    if (customProduct) {
                        setProduct(customProduct);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch custom product:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProduct();
    }, []);

    const handleAddToCart = () => {
        if (!product) return;
        useCartStore.getState().addItem({
            id: product.id,
            name: product.name,
            price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
            image: "/jersey-front.jpg",
            team: "Custom Lab",
            size: selectedSize,
            customName: customName || undefined,
            customNumber: customNumber || undefined
        });
        useCartStore.getState().openCart();
    };

    // Filters for "Fake" Color tinting on a black base
    // Note: Tinting black is hard. We'll use sepia/invert/hue-rotate or overlays.
    const getColorFilter = (color: string) => {
        switch (color) {
            case "White": return "invert(1) brightness(2) contrast(0.8)"; // Invert black to white
            case "Navy": return "sepia(1) hue-rotate(180deg) saturate(1.5) brightness(0.8)"; // Blue-ish tint
            case "Red": return "sepia(1) hue-rotate(320deg) saturate(3) brightness(0.8)"; // Red tint
            case "Gold": return "sepia(1) hue-rotate(10deg) saturate(3) brightness(1.2)"; // Gold tint
            default: return "none"; // Black
        }
    };

    return (
        <div className="min-h-screen pt-32 pb-20 bg-cream selection:bg-navy selection:text-cream">
            <Section className="container mx-auto px-6 mb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

                    {/* 3D Preview Stage */}
                    <div className="order-2 lg:order-1 flex flex-col items-center">
                        <div className="relative w-full max-w-[500px] aspect-[4/5] perspective-1000 group cursor-grab active:cursor-grabbing" onClick={() => setIsFlipped(!isFlipped)}>

                            {/* Rotating Container */}
                            <motion.div
                                className="w-full h-full relative"
                                initial={false}
                                animate={{ rotateY: isFlipped ? 180 : 0 }}
                                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                                style={{ transformStyle: "preserve-3d" }}
                            >
                                {/* FRONT FACE */}
                                <div className="absolute inset-0 w-full h-full" style={{ backfaceVisibility: "hidden" }}>
                                    <img
                                        src="/jersey-front.jpg"
                                        alt="Front"
                                        className="w-full h-full object-contain drop-shadow-2xl"
                                        style={{ filter: getColorFilter(jerseyColor) }}
                                    />
                                    {/* Front Decoration (Optional badge or number) */}
                                    <div className="absolute top-[35%] right-[28%] w-16 h-16 opacity-80 mix-blend-overlay">
                                        {/* Logo placeholder */}
                                    </div>
                                </div>

                                {/* BACK FACE */}
                                <div className="absolute inset-0 w-full h-full" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                                    <img
                                        src="/jersey-back.jpg"
                                        alt="Back"
                                        className="w-full h-full object-contain drop-shadow-2xl"
                                        style={{ filter: getColorFilter(jerseyColor) }}
                                    />

                                    {/* Customization Overlay */}
                                    <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center flex flex-col items-center justify-center pointer-events-none z-10">
                                        <motion.span
                                            key={customNumber}
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 0.9 }}
                                            className={`font-heading font-black text-8xl md:text-9xl tracking-tighter mix-blend-screen ${jerseyColor === 'White' ? 'text-navy' : 'text-white'}`}
                                            style={{ textShadow: '0 10px 20px rgba(0,0,0,0.5)' }}
                                        >
                                            {customNumber}
                                        </motion.span>
                                        <motion.span
                                            key={customName}
                                            initial={{ y: 5, opacity: 0 }}
                                            animate={{ y: 0, opacity: 0.9 }}
                                            className={`font-heading font-bold text-2xl md:text-3xl uppercase tracking-widest mt-2 mix-blend-screen ${jerseyColor === 'White' ? 'text-navy' : 'text-white'}`}
                                        >
                                            {customName}
                                        </motion.span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Floor Reflection/Shadow */}
                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-10 bg-black/20 blur-xl rounded-[100%] -z-10" />
                        </div>

                        {/* Rotation Hint */}
                        <div className="mt-8 flex items-center gap-2 text-navy/40 text-sm font-bold uppercase tracking-widest animate-pulse">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            <span>Click to Rotate</span>
                        </div>
                    </div>

                    {/* Controls Panel */}
                    <div className="order-1 lg:order-2 space-y-10">
                        <div>
                            <span className="text-navy/40 font-bold uppercase tracking-widest text-sm mb-2 block">11 Code Custom Lab</span>
                            <h1 className="font-heading text-5xl md:text-7xl font-bold uppercase tracking-tighter text-navy mb-6">
                                Design Your Kit
                            </h1>
                            <p className="text-navy/60 text-lg leading-relaxed">
                                Customize your pro-level kit with our 3D configurator.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-navy/5 space-y-8">

                            {/* Color Picker */}
                            <div>
                                <label className="text-xs font-bold text-navy/60 uppercase mb-3 block">Base Color</label>
                                <div className="flex gap-3">
                                    {["Black", "White", "Navy", "Red", "Gold"].map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => setJerseyColor(c)}
                                            className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${jerseyColor === c ? 'border-navy scale-110 shadow-lg' : 'border-transparent'}`}
                                            style={{ backgroundColor: c.toLowerCase() === 'navy' ? '#0a192f' : c.toLowerCase() === 'gold' ? '#d4af37' : c.toLowerCase() }}
                                            title={c}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6">
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-navy/60 uppercase mb-2 block">Player Name</label>
                                    <input
                                        type="text"
                                        value={customName}
                                        onChange={(e) => setCustomName(e.target.value.toUpperCase())}
                                        placeholder="YOUR NAME"
                                        maxLength={10}
                                        className="w-full bg-cream border border-navy/10 p-4 font-heading font-bold text-xl uppercase text-navy focus:outline-none focus:border-navy transition-colors"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="text-xs font-bold text-navy/60 uppercase mb-2 block">Number</label>
                                    <input
                                        type="text"
                                        value={customNumber}
                                        onChange={(e) => setCustomNumber(e.target.value.slice(0, 2))}
                                        placeholder="10"
                                        maxLength={2}
                                        className="w-full bg-cream border border-navy/10 p-4 font-heading font-bold text-xl uppercase text-navy focus:outline-none focus:border-navy transition-colors text-center"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-navy/60 uppercase mb-2 block">Size</label>
                                <div className="flex gap-3">
                                    {["S", "M", "L", "XL", "2XL"].map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            className={`flex-1 h-12 flex items-center justify-center border font-bold text-sm transition-all ${selectedSize === size
                                                    ? 'bg-navy text-white border-navy'
                                                    : 'bg-transparent text-navy/60 border-navy/10 hover:border-navy/40'
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-navy/5 mt-4">
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-sm font-bold text-navy/40 uppercase">Total Estimate</span>
                                    <span className="text-3xl font-heading font-bold text-navy">
                                        {product ? `₹${Number(product.price).toFixed(2)}` : "..."}
                                    </span>
                                </div>
                                <Button
                                    onClick={handleAddToCart}
                                    disabled={!product}
                                    className="w-full h-16 text-lg tracking-widest"
                                >
                                    {product ? "ADD TO CART" : "LOADING..."}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Section>
        </div>
    );
}
