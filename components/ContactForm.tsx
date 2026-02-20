"use client";

import { useState } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { motion } from "framer-motion";

export default function ContactForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus("idle");

        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const data = {
            name: formData.get("name"),
            email: formData.get("email"),
            message: formData.get("message"),
        };

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                setStatus("success");
                form.reset();
            } else {
                setStatus("error");
            }
        } catch (error) {
            setStatus("error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="w-full max-w-lg mx-auto bg-white p-8 rounded-lg shadow-lg border border-navy/5"
        >
            <h3 className="font-heading text-2xl font-bold uppercase tracking-tighter text-navy mb-6 text-center">
                Send us a message
            </h3>

            {status === "success" ? (
                <div className="text-center py-10">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                        ✓
                    </div>
                    <h4 className="font-bold text-navy mb-2">Message Sent!</h4>
                    <p className="text-navy/60 text-sm">
                        Thank you for reaching out. We'll get back to you shortly.
                    </p>
                    <button
                        onClick={() => setStatus("idle")}
                        className="mt-6 text-sm font-bold text-navy hover:underline"
                    >
                        Send another message
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <Input
                            name="name"
                            label="Name"
                            placeholder="Your name"
                            required
                            className="bg-navy/5 border-navy/10"
                        />
                        <Input
                            name="email"
                            type="email"
                            label="Email"
                            placeholder="your@email.com"
                            required
                            className="bg-navy/5 border-navy/10"
                        />
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold uppercase tracking-wider text-navy/60">
                                Message
                            </label>
                            <textarea
                                name="message"
                                rows={5}
                                placeholder="How can we help?"
                                required
                                className="w-full px-4 py-3 bg-navy/5 border border-navy/10 rounded-md outline-none focus:border-navy transition-all font-medium text-navy placeholder:text-navy/30 resize-none"
                            />
                        </div>
                    </div>

                    {status === "error" && (
                        <p className="text-red-500 text-sm text-center font-medium">
                            Something went wrong. Please try again.
                        </p>
                    )}

                    <Button
                        className="w-full h-12 text-lg"
                        disabled={isLoading}
                    >
                        {isLoading ? "Sending..." : "Send Message"}
                    </Button>
                </form>
            )}
        </motion.div>
    );
}
