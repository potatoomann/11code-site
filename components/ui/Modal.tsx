import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";

interface ModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDestructive?: boolean;
}

export function Modal({ isOpen, title, message, onConfirm, onCancel, isDestructive = false }: ModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="absolute inset-0 bg-navy/20 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 border border-navy/5"
                    >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${isDestructive ? 'bg-red-50 text-red-500' : 'bg-navy/5 text-navy'}`}>
                            <AlertTriangle size={24} />
                        </div>

                        <h3 className="font-heading text-xl font-bold text-navy mb-2">{title}</h3>
                        <p className="text-navy/60 text-sm mb-6 leading-relaxed">
                            {message}
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={onCancel}
                                className="flex-1 h-12 rounded-xl border border-navy/10 font-bold text-xs uppercase tracking-wider text-navy/60 hover:bg-navy/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                className={`flex-1 h-12 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-lg transition-transform active:scale-95 ${isDestructive
                                        ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                                        : 'bg-navy hover:bg-navy/90 shadow-navy/20'
                                    }`}
                            >
                                Confirm
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
