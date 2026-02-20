"use client";

import { useState } from "react";

export default function Footer() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus("loading");

        try {
            const res = await fetch("/api/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            if (res.ok) {
                setStatus("success");
                setEmail("");
            } else {
                setStatus("error");
            }
        } catch (error) {
            console.error("Subscription failed", error);
            setStatus("error");
        }

        setTimeout(() => setStatus("idle"), 3000);
    };

    return (
        <footer className="bg-cream text-navy pt-20 pb-10 border-t border-navy/10">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="space-y-4">
                        <h3 className="font-heading text-3xl font-black uppercase tracking-tighter" style={{ transform: 'scaleY(1.1)' }}>11 Code</h3>
                        <p className="text-navy/60 text-sm leading-relaxed">
                            Premium football jerseys for the modern fan. Curated collections, limited drops, and authentic gear.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold uppercase tracking-wider mb-6 text-sm">Shop</h4>
                        <ul className="space-y-3 text-navy/60 text-sm">
                            <li><a href="/shop" className="hover:text-navy transition-colors font-medium">Latest Drops</a></li>
                            <li><a href="/shop?category=Clubs" className="hover:text-navy transition-colors font-medium">Clubs</a></li>
                            <li><a href="/shop?category=National%20Teams" className="hover:text-navy transition-colors font-medium">National Teams</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold uppercase tracking-wider mb-6 text-sm">Support</h4>
                        <ul className="space-y-3 text-navy/60 text-sm">
                            <li>
                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent("open-support-chat"))}
                                    className="hover:text-navy transition-colors font-medium text-left"
                                    suppressHydrationWarning
                                >
                                    Order Status
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent("open-support-chat"))}
                                    className="hover:text-navy transition-colors font-medium text-left"
                                    suppressHydrationWarning
                                >
                                    Shipping & Returns
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent("open-support-chat"))}
                                    className="hover:text-navy transition-colors font-medium text-left"
                                    suppressHydrationWarning
                                >
                                    FAQ
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent("open-support-chat"))}
                                    className="hover:text-navy transition-colors font-medium text-left"
                                    suppressHydrationWarning
                                >
                                    Contact Us
                                </button>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold uppercase tracking-wider mb-6 text-sm">Stay in the loop</h4>
                        <form onSubmit={handleSubscribe} className="flex flex-col gap-4" suppressHydrationWarning>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="bg-navy/5 border border-navy/10 px-4 py-3 text-sm focus:outline-none focus:border-navy transition-colors text-navy placeholder:text-navy/40"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={status === 'loading' || status === 'success'}
                                suppressHydrationWarning
                            />
                            <button
                                className={`bg-navy text-cream font-bold uppercase text-xs py-3 px-6 hover:bg-navy/90 transition-all ${status === 'success' ? '!bg-green-600' : ''}`}
                                disabled={status === 'loading'}
                                suppressHydrationWarning
                            >
                                {status === 'loading' ? ' joining...' : status === 'success' ? 'Welcome to the Club!' : 'Subscribe'}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="border-t border-navy/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-navy/40">
                    <p>&copy; 2026 11 Code Store. All rights reserved.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <a href="#" className="hover:text-navy transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-navy transition-colors">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
