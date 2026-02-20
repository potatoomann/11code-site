"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
    id: string;
    text: string;
    sender: "bot" | "user";
};

export default function SupportChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: "1", text: "Hi! I'm the 11 Code Assistant. How can I help you today?", sender: "bot" }
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsVisible(true);

        const handleOpenChat = () => setIsOpen(true);
        window.addEventListener("open-support-chat", handleOpenChat);
        return () => window.removeEventListener("open-support-chat", handleOpenChat);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen, isTyping]);

    if (!isVisible) return null;

    const handleOption = (option: string) => {
        // Add user message
        const userMsg: Message = { id: Date.now().toString(), text: option, sender: "user" };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        // Simulate thinking
        setTimeout(() => {
            let botText = "";

            switch (option) {
                case "Shipping Info":
                    botText = "We currently ship to select locations (primarily Kerala). Orders typically arrive within 3-5 business days. You'll get a tracking link via email once shipped.";
                    break;
                case "Returns Policy":
                    botText = "We only accept returns if the product is damaged or if you received the wrong order. Tap 'Contact Support' below if that happened.";
                    break;
                case "Sizing Help":
                    botText = "Sizing Rule:\n• Player Version: Runs slim/tight. Size UP one size.\n• Fan Version: Fits true to size.\n\nWhen in doubt, size up!";
                    break;
                case "Contact Support":
                    botText = "Head over to our About page to use our comprehensive contact form. It's the fastest way to get in touch!";
                    break;
                case "Track Order":
                    botText = "Please check your email inbox (and spam folder) for the tracking link we sent when your order shipped. If it's been over 5 days, email us at 11codestore@gmail.com.";
                    break;
                case "Cancel Order":
                    botText = "Need to cancel? If your order hasn't shipped yet, email 11codestore@gmail.com *immediately* with your Order ID. Once it's with the courier, we can't stop it!";
                    break;
                default:
                    botText = "I'm not sure about that. Try emailing 11codestore@gmail.com!";
            }

            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: botText, sender: "bot" }]);
            setIsTyping(false);
        }, 800);
    };

    return (
        <motion.div
            drag
            dragMomentum={false}
            className="fixed bottom-24 right-6 md:bottom-6 z-[100] flex flex-col items-end font-sans touch-none"
        >
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white rounded-2xl shadow-2xl w-[350px] md:w-[400px] h-[500px] mb-4 overflow-hidden flex flex-col border border-navy/10"
                    >
                        {/* Header */}
                        <div className="bg-navy p-4 flex items-center justify-between shadow-md relative z-10" onPointerDown={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-3">
                                <motion.div
                                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center border-2 border-white/10 overflow-hidden"
                                    animate={{ y: [0, -3, 0] }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                >
                                    <img src="/ai-mascot.png" alt="AI" className="w-full h-full object-cover" />
                                </motion.div>
                                <div>
                                    <h3 className="text-cream font-bold text-sm">11 Code Support</h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                                        <span className="text-cream/80 text-xs font-medium">Online</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-cream/60 hover:text-cream transition-colors"
                                onPointerDown={(e) => e.stopPropagation()} // Prevent drag starting on close button
                            >
                                ✕
                            </button>
                        </div>

                        {/* Messages */}
                        <div
                            ref={scrollRef}
                            data-lenis-prevent
                            className="flex-1 bg-[#F5F5F7] p-4 overflow-y-auto space-y-4 cursor-auto"
                            onPointerDown={(e) => e.stopPropagation()} // Important: Allow scrolling without dragging container
                        >
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${msg.sender === "user"
                                            ? "bg-navy text-white rounded-tr-sm"
                                            : "bg-white text-navy border border-black/5 rounded-tl-sm"
                                            }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-black/5 p-4 rounded-2xl rounded-tl-sm shadow-sm flex gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-navy/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-1.5 h-1.5 bg-navy/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1.5 h-1.5 bg-navy/40 rounded-full animate-bounce" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Options Area - Fixed at bottom */}
                        <div
                            className="p-4 bg-white border-t border-navy/10 grid grid-cols-2 gap-2"
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            {["Shipping Info", "Returns Policy", "Sizing Help", "Track Order", "Cancel Order", "Contact Support"].map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => handleOption(opt)}
                                    className={`text-xs font-bold text-navy border border-navy/10 py-3 px-3 rounded-lg hover:bg-navy hover:text-white transition-all shadow-sm active:scale-95 ${opt === "Contact Support" || opt === "Cancel Order" ? "col-span-1" : ""}`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Button / Character */}
            <motion.button
                layout
                onClick={() => setIsOpen(!isOpen)}
                className="relative group w-16 h-16 flex items-center justify-center p-0 bg-transparent border-none outline-none focus:outline-none"
                whileHover={{ scale: 1.1, rotate: [0, -5, 5, -5, 0] }}
                whileTap={{ scale: 0.9 }}
                animate={{
                    y: [0, -8, 0],
                }}
                transition={{
                    y: {
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    },
                    scale: { duration: 0.2 },
                    rotate: { duration: 0.4 }
                }}
            >
                {/* Tooltip / Speech Bubble */}
                {!isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: -10, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white px-3 py-1.5 rounded-xl rounded-tr-none shadow-lg border border-navy/10 whitespace-nowrap"
                    >
                        <span className="text-xs font-bold text-navy">Need help? 👋</span>
                    </motion.div>
                )}

                {/* Character Image */}
                <div className="w-16 h-16 rounded-full bg-white shadow-[0_4px_20px_rgba(5,10,48,0.2)] flex items-center justify-center overflow-hidden border-2 border-white relative z-10">
                    <img
                        src="/ai-mascot.png"
                        alt="Support Assistant"
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Status Indicator */}
                <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full z-20"></span>
            </motion.button>
        </motion.div>
    );
}
