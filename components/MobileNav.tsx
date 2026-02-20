"use client";

import { Home, ShoppingBag, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { motion } from "framer-motion";

export default function MobileNav() {
    const pathname = usePathname();
    const openCart = useCartStore((state) => state.openCart);
    const cartItems = useCartStore((state) => state.items);
    const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-navy/10 z-50 pb-safe">
            <div className="flex justify-around items-center h-16">
                <Link href="/" className={`flex flex-col items-center gap-1 ${pathname === "/" ? "text-navy" : "text-navy/40"}`}>
                    <Home size={24} strokeWidth={pathname === "/" ? 2.5 : 1.5} />
                    <span className="text-[10px] font-bold uppercase tracking-wide">Home</span>
                </Link>

                <Link href="/shop" className={`flex flex-col items-center gap-1 ${pathname === "/shop" ? "text-navy" : "text-navy/40"}`}>
                    <ShoppingBag size={24} strokeWidth={pathname === "/shop" ? 2.5 : 1.5} />
                    <span className="text-[10px] font-bold uppercase tracking-wide">Shop</span>
                </Link>

                <button
                    onClick={openCart}
                    className="flex flex-col items-center gap-1 text-navy/40 relative"
                >
                    <div className="relative">
                        <ShoppingCart size={24} strokeWidth={1.5} />
                        {itemCount > 0 && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 bg-navy text-cream text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold"
                            >
                                {itemCount}
                            </motion.div>
                        )}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wide">Cart</span>
                </button>
            </div>
        </div>
    );
}
