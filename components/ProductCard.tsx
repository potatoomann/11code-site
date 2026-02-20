"use client";

import { motion } from "framer-motion";
import { Button } from "./ui/Button";
import Link from "next/link";

interface Product {
    id: string;
    name: string;
    price: number;
    image: string;
    team: string;
    stock?: number; // Added stock property
}

export default function ProductCard({ product }: { product: Product }) {
    const isOutOfStock = product.stock !== undefined && product.stock <= 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={`group relative bg-white border border-navy/5 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-navy/10 ${isOutOfStock ? 'opacity-70 grayscale' : ''}`}
        >
            <Link href={isOutOfStock ? "#" : `/product/${product.id}`} className="block relative aspect-[3/4] overflow-hidden bg-gray-100">
                {(() => {
                    let displayImage = product.image || "";
                    try {
                        const parsed = JSON.parse(product.image);
                        displayImage = parsed.front || parsed.back || parsed.additional || "";
                    } catch (e) {
                        // Not JSON, use as is
                    }
                    return displayImage ? (
                        <img
                            src={displayImage}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy p-6 text-center">
                            <span className="text-cream/20 text-6xl font-heading font-black mb-2 opacity-10">11</span>
                            <span className="text-cream font-bold uppercase tracking-widest text-sm border-2 border-cream/20 px-4 py-2">
                                {product.name === "Customize" ? "START DESIGN" : "NO IMAGE"}
                            </span>
                        </div>
                    );
                })()}

                {isOutOfStock && (
                    <div className="absolute inset-0 bg-cream/60 flex items-center justify-center z-20">
                        <span className="bg-navy text-cream px-4 py-2 font-bold text-sm uppercase tracking-widest">Out of Stock</span>
                    </div>
                )}

                {/* Quick View Removed */}
            </Link>

            <div className="p-3 md:p-4 bg-white relative z-10 transition-colors duration-300 group-hover:bg-cream/50 min-h-[140px] flex flex-col justify-between">
                <div className="w-full text-left">
                    <p className="text-[10px] md:text-xs font-bold text-navy/40 uppercase tracking-widest mb-1">{product.team}</p>
                    <h3 className="font-heading text-sm md:text-lg font-bold text-navy mb-1 leading-tight group-hover:opacity-70 transition-opacity line-clamp-2">
                        {product.name}
                    </h3>
                    <p className="text-sm font-medium text-navy/80">
                        ₹{product.price.toFixed(2)}
                    </p>
                </div>
                <Link href={`/product/${product.id}`} className="w-full mt-3">
                    <Button className="w-full text-[10px] md:text-xs h-8 md:h-10 flex items-center justify-center" variant="primary">
                        View Details
                    </Button>
                </Link>
            </div>
        </motion.div>
    );
}
