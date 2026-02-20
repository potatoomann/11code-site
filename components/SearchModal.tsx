"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Product {
    id: string;
    name: string;
    price: number;
    team: string;
    category: string;
    image: string;
}

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [query, setQuery] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [results, setResults] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            // Fetch products when opened if not already fetched
            if (products.length === 0) {
                fetchProducts();
            }
        } else {
            document.body.style.overflow = "unset";
            setQuery(""); // Reset query on close
        }
    }, [isOpen]);

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/products");
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setProducts(data);
                }
            }
        } catch (error) {
            console.error("Failed to fetch products for search", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter products based on query
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const filtered = products.filter(product =>
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.team.toLowerCase().includes(query.toLowerCase()) ||
            product.category.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5); // Limit to 5 results for cleaner UI

        setResults(filtered);
    }, [query, products]);

    const handleResultClick = (productId: string) => {
        onClose();
        router.push(`/product/${productId}`);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // If needed, implement a full search page. For now, we prefer selecting from dropdown.
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-[60]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed top-0 left-0 w-full z-[70] bg-cream border-b border-navy/10 shadow-2xl"
                    >
                        <div className="container mx-auto px-6 py-8">
                            <form onSubmit={handleSearchSubmit} className="relative mb-8">
                                <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-navy/40" size={24} />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search for teams, players, or kits..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="w-full bg-transparent border-b-2 border-navy/10 py-4 pl-10 pr-12 text-2xl font-heading font-bold text-navy placeholder:text-navy/20 focus:outline-none focus:border-navy transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 hover:bg-navy/5 rounded-full transition-colors"
                                >
                                    <X size={24} className="text-navy" />
                                </button>
                            </form>

                            {/* Results */}
                            <div className="min-h-[100px]">
                                {isLoading ? (
                                    <div className="text-navy/40">Loading...</div>
                                ) : query && results.length === 0 ? (
                                    <div className="text-navy/40">No results found for "{query}"</div>
                                ) : results.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {results.map((product) => {
                                            // Handle image parsing if it's a JSON string
                                            let displayImage = product.image;
                                            try {
                                                const parsed = JSON.parse(product.image);
                                                displayImage = parsed.front || parsed.back || Object.values(parsed)[0] as string || "";
                                            } catch (e) {
                                                // keep as is
                                            }

                                            return (
                                                <div
                                                    key={product.id}
                                                    onClick={() => handleResultClick(product.id)}
                                                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-white hover:shadow-lg cursor-pointer transition-all border border-transparent hover:border-navy/5 group"
                                                >
                                                    <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                                        <img
                                                            src={displayImage || "/placeholder.png"}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover mix-blend-multiply"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-heading font-bold text-navy group-hover:text-blue-600 transition-colors">
                                                            {product.name}
                                                        </h4>
                                                        <p className="text-sm text-navy/60">{product.team}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-bold text-navy">₹{product.price}</span>
                                                    </div>
                                                    <ChevronRight size={16} className="text-navy/30 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-50">
                                        <div className="text-sm font-bold uppercase tracking-wider text-navy/40 col-span-full mb-2">Popular Searches</div>
                                        {["Arsenal", "Real Madrid", "Retro", "Training"].map((term) => (
                                            <button
                                                key={term}
                                                onClick={() => setQuery(term)}
                                                className="text-left px-4 py-3 bg-white border border-navy/5 rounded hover:border-navy/20 hover:shadow-sm transition-all text-navy"
                                            >
                                                {term}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
