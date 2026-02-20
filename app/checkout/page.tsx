"use client";

import Section from "@/components/ui/Section";
import { useCartStore } from "@/store/useCartStore";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
    const { items, total, clearCart } = useCartStore();
    const [step, setStep] = useState(1); //  Shipping,  Payment
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        address: "",
        city: "",
        postalCode: ""
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.className.split(" ")[0]]: e.target.value }); // Hacky binding due to multiple classes, better to use name
    };

    // Better handler
    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }

    const handlePayment = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items,
                    total: total(),
                    customer: formData
                })
            });

            if (res.ok) {
                clearCart();
                router.push("/checkout/success");
            } else {
                alert("Payment failed. Please try again.");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="pt-32 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-heading font-bold mb-4">Your bag is empty</h1>
                    <p className="text-navy/60 mb-6">Add some premium kits before checking out.</p>
                    <Button onClick={() => window.location.href = '/shop'}>Go to Shop</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="pt-32 pb-20 min-h-screen bg-cream">
            <div className="container mx-auto px-6">
                <h1 className="font-heading text-4xl font-bold uppercase tracking-tighter text-navy mb-12">Checkout</h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
                    {/* Form Section */}
                    <div className="space-y-6">
                        {/* Steps Indicator */}
                        <div className="flex items-center gap-4 text-sm font-bold uppercase tracking-wider mb-6">
                            <span className={step === 1 ? "text-navy" : "text-navy/40"}>Shipping</span>
                            <span className="text-navy/20">/</span>
                            <span className={step === 2 ? "text-navy" : "text-navy/40"}>Payment</span>
                        </div>

                        {step === 1 && (
                            <div className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-500">
                                <h2 className="text-xl font-bold font-heading">Shipping Address</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        placeholder="First Name"
                                        className="p-4 bg-white border border-navy/10 w-full focus:outline-none focus:border-navy"
                                        value={formData.firstName}
                                        onChange={(e) => handleChange("firstName", e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Last Name"
                                        className="p-4 bg-white border border-navy/10 w-full focus:outline-none focus:border-navy"
                                        value={formData.lastName}
                                        onChange={(e) => handleChange("lastName", e.target.value)}
                                    />
                                </div>
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    className="p-4 bg-white border border-navy/10 w-full focus:outline-none focus:border-navy"
                                    value={formData.email}
                                    onChange={(e) => handleChange("email", e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Address"
                                    className="p-4 bg-white border border-navy/10 w-full focus:outline-none focus:border-navy"
                                    value={formData.address}
                                    onChange={(e) => handleChange("address", e.target.value)}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        placeholder="City"
                                        className="p-4 bg-white border border-navy/10 w-full focus:outline-none focus:border-navy"
                                        value={formData.city}
                                        onChange={(e) => handleChange("city", e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Postal Code"
                                        className="p-4 bg-white border border-navy/10 w-full focus:outline-none focus:border-navy"
                                        value={formData.postalCode}
                                        onChange={(e) => handleChange("postalCode", e.target.value)}
                                    />
                                </div>
                                <Button className="w-full" onClick={() => setStep(2)}>Continue to Payment</Button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <h2 className="text-xl font-bold font-heading">Payment</h2>
                                <div className="p-6 bg-white border border-navy/10 rounded-lg">
                                    <p className="text-navy/60 text-sm mb-4">Secure Payment via Stripe (Mock)</p>
                                    <input type="text" placeholder="Card Number" className="p-4 bg-white border border-navy/10 w-full focus:outline-none focus:border-navy mb-4" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="text" placeholder="MM/YY" className="p-4 bg-white border border-navy/10 w-full focus:outline-none focus:border-navy" />
                                        <input type="text" placeholder="CVC" className="p-4 bg-white border border-navy/10 w-full focus:outline-none focus:border-navy" />
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                                    <Button className="flex-1" onClick={handlePayment} disabled={isLoading}>
                                        {isLoading ? "Processing..." : `Pay ₹${total().toFixed(2)}`}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white p-8 border border-navy/5 h-fit sticky top-32">
                        <h2 className="text-xl font-bold font-heading mb-6">Order Summary</h2>
                        <div className="space-y-4 mb-6">
                            {items.map(item => (
                                <div key={`${item.id}-${item.size}`} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-16 bg-gray-100 flex items-center justify-center text-xs font-bold text-navy/20 overflow-hidden rounded-md">
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
                                        <div>
                                            <p className="font-bold text-navy">{item.name}</p>
                                            <p className="text-navy/60">Size: {item.size} x {item.quantity}</p>
                                        </div>
                                    </div>
                                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-navy/10 pt-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-navy/60">Subtotal</span>
                                <span>₹{total().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-navy/60">Shipping</span>
                                <span>Free</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg pt-4 border-t border-navy/10 mt-4">
                                <span>Total</span>
                                <span>₹{total().toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
