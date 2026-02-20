"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import Section from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";

interface Product {
    id: string;
    name: string;
    price: number;
    team: string;
    image: string;
    category: string;
    stock?: number;
}

interface ShopClientProps {
    initialProducts: Product[];
}

export default function ShopClient({ initialProducts = [] }: ShopClientProps) {
    const searchParams = useSearchParams();
    const initialCategory = searchParams.get("category");

    // Use initialProducts directly, no need for loading state for products
    const [products] = useState<Product[]>(Array.isArray(initialProducts) ? initialProducts : []);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory || "All");
    const [maxPrice, setMaxPrice] = useState(1000);
    const [visibleCount, setVisibleCount] = useState(9);

    useEffect(() => {
        // Update category if URL param changes
        if (initialCategory) {
            setSelectedCategory(initialCategory);
        }
    }, [initialCategory]);

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const categoryMatch =
                selectedCategory === "All" || product.category === selectedCategory;

            const priceMatch = product.price <= maxPrice;

            return categoryMatch && priceMatch;
        });
    }, [products, selectedCategory, maxPrice]);

    return (
        <div className="pt-24 pb-20 min-h-screen container mx-auto px-6">
            <Section className="py-10">
                <h1 className="font-heading text-4xl md:text-6xl font-bold uppercase tracking-tighter text-navy mb-12">
                    The Collection
                </h1>

                <div className="flex flex-col md:flex-row gap-12">
                    {/* Sidebar Filters */}
                    <aside className="w-full md:w-64 space-y-8">
                        {/* Mobile Filter Toggle */}
                        <div className="md:hidden">
                            <details className="group border border-navy/10 rounded-lg bg-white">
                                <summary className="flex items-center justify-between p-4 cursor-pointer list-none font-bold uppercase tracking-wider text-sm select-none">
                                    <span>Filters</span>
                                    <span className="transition-transform group-open:rotate-180">▼</span>
                                </summary>
                                <div className="p-4 border-t border-navy/5 space-y-8">
                                    {/* Mobile Filters Content */}
                                    <div>
                                        <h3 className="font-bold uppercase tracking-wider mb-4 text-sm">Category</h3>
                                        <div className="space-y-2 flex flex-col items-start">
                                            {["All", "Clubs", "National Teams", "Retro", "Training"].map((cat) => (
                                                <button
                                                    key={cat}
                                                    onClick={() => setSelectedCategory(cat)}
                                                    className={`text-sm hover:opacity-70 transition-opacity ${selectedCategory === cat ? "text-navy font-bold" : "text-navy/60"}`}
                                                    suppressHydrationWarning
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold uppercase tracking-wider mb-4 text-sm">Price Range</h3>
                                        <div className="flex items-center gap-2 text-sm text-navy/60">
                                            <span>₹0</span>
                                            <input
                                                type="range"
                                                min={0}
                                                max={10000}
                                                value={maxPrice}
                                                onChange={(e) => setMaxPrice(Number(e.target.value))}
                                                className="w-full accent-navy"
                                            />
                                            <span>₹{maxPrice}</span>
                                        </div>
                                    </div>
                                </div>
                            </details>
                        </div>

                        {/* Desktop Filters (Hidden on Mobile) */}
                        <div className="hidden md:block space-y-8">
                            <div>
                                <h3 className="font-bold uppercase tracking-wider mb-4 text-sm">
                                    Category
                                </h3>
                                <div className="space-y-2 flex flex-col items-start">
                                    {["All", "Clubs", "National Teams", "Retro", "Training"].map(
                                        (cat) => (
                                            <button
                                                key={cat}
                                                onClick={() => setSelectedCategory(cat)}
                                                className={`text-sm hover:opacity-70 transition-opacity ${selectedCategory === cat
                                                    ? "text-navy font-bold"
                                                    : "text-navy/60"
                                                    }`}
                                                suppressHydrationWarning
                                            >
                                                {cat}
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold uppercase tracking-wider mb-4 text-sm">
                                    Price Range
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-navy/60">
                                    <span>₹0</span>
                                    <input
                                        type="range"
                                        min={0}
                                        max={1000}
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                                        className="w-full accent-navy"
                                    />
                                    <span>₹{maxPrice}</span>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Product Grid */}
                    <div className="flex-1">
                        {filteredProducts.length === 0 ? (
                            <div className="text-center py-20 text-navy/60">
                                No products found.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
                                {filteredProducts.slice(0, visibleCount).map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        )}

                        {filteredProducts.length > visibleCount && (
                            <div className="mt-16 text-center">
                                <Button variant="outline" onClick={() => setVisibleCount(prev => prev + 9)}>Load More</Button>
                            </div>
                        )}
                    </div>
                </div>
            </Section>
        </div>
    );
}
