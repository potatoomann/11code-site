import { motion, AnimatePresence } from "framer-motion";
import { Check, X, AlertCircle } from "lucide-react";
import { useEffect } from "react";

interface ToastProps {
    message: string;
    type: "success" | "error" | "info";
    isVisible: boolean;
    onClose: () => void;
}

export function Toast({ message, type, isVisible, onClose }: ToastProps) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    className={`fixed bottom-6 right-6 z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border ${type === "success"
                            ? "bg-navy text-cream border-navy/10"
                            : type === "error"
                                ? "bg-red-600 text-white border-red-500"
                                : "bg-white text-navy border-navy/5"
                        }`}
                >
                    {type === "success" && <Check size={18} className="text-green-400" />}
                    {type === "error" && <AlertCircle size={18} className="text-white/80" />}
                    <span className="font-bold text-sm tracking-wide">{message}</span>
                    <button onClick={onClose} className="ml-4 hover:opacity-70 transition-opacity">
                        <X size={14} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
