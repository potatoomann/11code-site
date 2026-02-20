"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { Button } from "./ui/Button";
import Link from "next/link";
import { useEffect } from "react";

export default function CartDrawer() {
    const { isOpen, closeCart, items, removeItem, addItem, total } = useCartStore();

    // Disable body scroll when cart is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={closeCart}
                        className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 400, damping: 40, mass: 0.5 }}
                        className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-cream z-[70] shadow-2xl flex flex-col border-l border-navy/5"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-navy/5">
                            <h2 className="font-heading text-2xl font-bold uppercase tracking-tighter text-navy mb-0">
                                Your Bag ({items.reduce((acc, i) => acc + i.quantity, 0)})
                            </h2>
                            <button onClick={closeCart} className="p-2 hover:bg-navy/5 rounded-full transition-colors text-navy">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                    <p className="text-navy/40 font-medium">Your bag is empty.</p>
                                    <Button variant="outline" onClick={closeCart}>Continue Shopping</Button>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <div key={`${item.id}-${item.size}`} className="flex gap-4">
                                        <div className="w-24 h-32 bg-gray-100 flex items-center justify-center text-navy/20 font-bold text-lg overflow-hidden rounded-md">
                                            {(() => {
                                                let displayImage = item.image;
                                                try {
                                                    const parsed = JSON.parse(item.image);
                                                    displayImage = parsed.front || parsed.back || parsed.additional || item.image;
                                                } catch (e) { }

                                                return displayImage ? (
                                                    <img src={displayImage} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    item.team
                                                );
                                            })()}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-bold text-navy text-sm uppercase">{item.name}</h3>
                                                    <button
                                                        onClick={() => removeItem(item.id, item.size)}
                                                        className="text-navy/40 hover:text-red-500 transition-colors"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                                <p className="text-sm text-navy/60">{item.size} | ₹{item.price}</p>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center border border-navy/20">
                                                    <button
                                                        className="w-8 h-8 flex items-center justify-center hover:bg-navy hover:text-cream transition-colors"
                                                        onClick={() => {
                                                            const { decrementItem } = useCartStore.getState();
                                                            decrementItem(item.id, item.size);
                                                        }}
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                                                    <button
                                                        className="w-8 h-8 flex items-center justify-center hover:bg-navy hover:text-cream transition-colors"
                                                        onClick={() => addItem({ ...item, quantity: 1 } as any)}
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {items.length > 0 && (
                            <div className="p-6 border-t border-navy/5 bg-white/50 backdrop-blur-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-bold uppercase tracking-wider text-navy/60">Total</span>
                                    <span className="text-2xl font-bold font-heading text-navy">₹{total().toFixed(2)}</span>
                                </div>
                                <p className="text-xs text-navy/40 mb-4 text-center">Shipping & taxes calculated at checkout.</p>
                                <Link href="/checkout" onClick={closeCart}>
                                    <Button className="w-full h-14 text-lg">Checkout</Button>
                                </Link>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
