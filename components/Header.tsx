"use client";

import Link from "next/link";
import { ShoppingBag, Search, Menu, User, X, ChevronLeft } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/Button";
import { useState, useEffect } from "react";
import SearchModal from "./SearchModal";

export default function Header() {
    const { openCart, items } = useCartStore();
    const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Prevent scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
    }, [isMobileMenuOpen]);

    return (
        <>
            <header className="fixed top-0 left-0 w-full z-50 bg-cream/80 backdrop-blur-md border-b border-navy/5 transition-all duration-300">
                <div className="container mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="font-heading text-4xl font-black tracking-tighter uppercase text-navy hover:opacity-80 transition-opacity" style={{ transform: 'scaleY(1.1)' }}>
                        11 Code
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8 font-medium">
                        <Link href="/" className="hover:opacity-70 transition-opacity">
                            Home
                        </Link>
                        <Link href="/shop" className="hover:opacity-70 transition-opacity">
                            Shop
                        </Link>
                        <Link href="/about" className="hover:opacity-70 transition-opacity">
                            About
                        </Link>
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-2 md:gap-4">
                        <button
                            className="p-3 hover:opacity-70 transition-opacity"
                            onClick={() => setIsSearchOpen(true)}
                            suppressHydrationWarning
                        >
                            <Search size={22} className="md:w-6 md:h-6" />
                        </button>
                        <Link href="/profile" className="p-3 hover:opacity-70 transition-opacity">
                            <User size={22} className="md:w-6 md:h-6" />
                        </Link>
                        <button
                            onClick={openCart}
                            className="hidden md:block relative p-3 hover:opacity-70 transition-opacity group"
                            suppressHydrationWarning
                        >
                            <ShoppingBag size={22} className="md:w-6 md:h-6" />
                            {cartCount > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute top-2 right-1 bg-navy text-cream text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full group-hover:bg-cream group-hover:text-navy transition-colors pointer-events-none"
                                >
                                    {cartCount}
                                </motion.span>
                            )}
                        </button>
                        <button
                            className="md:hidden p-2 z-50 relative"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            suppressHydrationWarning
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

            </header>

            {/* Mobile Menu Overlay - Moved outside header to prevent transparency issues */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "tween", duration: 0.3 }}
                        className="fixed inset-0 bg-white z-[60] md:hidden flex flex-col"
                    >
                        {/* Header / Back Button */}
                        <div className="flex items-center p-4 border-b border-gray-100">
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-2 text-navy hover:text-navy/80 transition-colors"
                            >
                                <ChevronLeft size={24} />
                                <span className="text-sm font-bold uppercase tracking-wide">Back</span>
                            </button>
                        </div>

                        {/* Menu Items */}
                        <nav className="flex flex-col">
                            <Link
                                href="/shop"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-6 border-b border-gray-100 text-base font-bold text-navy hover:text-navy/80 uppercase tracking-widest transition-colors flex justify-between items-center group"
                            >
                                Shop
                            </Link>

                            <button
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    openCart();
                                }}
                                className="p-6 border-b border-gray-100 text-base font-bold text-navy hover:text-navy/80 uppercase tracking-widest transition-colors flex justify-between items-center text-left w-full"
                            >
                                Cart
                            </button>

                            <Link
                                href="/orders" // or /profile
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-6 border-b border-gray-100 text-base font-bold text-navy hover:text-navy/80 uppercase tracking-widest transition-colors flex justify-between items-center"
                            >
                                Orders
                            </Link>

                            <Link
                                href="/about"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-6 border-b border-gray-100 text-base font-bold text-navy hover:text-navy/80 uppercase tracking-widest transition-colors flex justify-between items-center"
                            >
                                About
                            </Link>

                            <button
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    window.dispatchEvent(new CustomEvent("open-support-chat"));
                                }}
                                className="p-6 border-b border-gray-100 text-base font-bold text-navy hover:text-navy/80 uppercase tracking-widest transition-colors flex justify-between items-center text-left w-full"
                            >
                                Contact
                            </button>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>

            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
}
