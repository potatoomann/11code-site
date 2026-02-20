"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import Section from "@/components/ui/Section";
import ProductCard from "@/components/ProductCard";
import { useCartStore } from "@/store/useCartStore";



export default function ProductPage() {
    const { id } = useParams();
    const [selectedSize, setSelectedSize] = useState("M");
    const [product, setProduct] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeImage, setActiveImage] = useState<string | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
    const [customName, setCustomName] = useState("");
    const [customNumber, setCustomNumber] = useState("");
    const addItem = useCartStore((state) => state.addItem);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await fetch(`/api/products/${id}`);
                const data = await res.json();
                if (data && !data.error) {
                    setProduct(data);
                }
            } catch (error) {
                console.error("Failed to fetch product:", error);
            } finally {
                setIsLoading(false);
            }
        };
        if (id) {
            fetchProduct();
        }
    }, [id]);

    const handleAddToCart = () => {
        if (!product) return;

        console.log("Adding to cart:", product);

        // Extract main image
        let mainImage = product.image && typeof product.image === 'string' ? product.image : "";
        try {
            const parsed = JSON.parse(product.image);
            mainImage = parsed.front || parsed.back || parsed.additional || product.image;
        } catch (e) {
            // Use as is
        }

        useCartStore.getState().addItem({
            id: product.id,
            name: product.name,
            price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
            image: mainImage || "",
            team: product.team,
            size: selectedSize,
            customName: customName || undefined,
            customNumber: customNumber || undefined
        });

        // Visual Feedback (Temporary until Toast component is added, or we can use the cart drawer opening as feedback)
        // Since the cart drawer opens automatically in the store logic (isOpen: true), that is good feedback.
        // We can just ensure it opens.
        useCartStore.getState().openCart();
    };

    if (isLoading) {
        return (
            <div className="pt-32 pb-20 min-h-screen flex items-center justify-center">
                <div className="text-navy/60">Loading product...</div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="pt-32 pb-20 min-h-screen flex items-center justify-center">
                <div className="text-navy/60">Product not found</div>
            </div>
        );
    }

    return (
        <div className="pt-32 pb-20 min-h-screen">
            <Section className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    {/* Image Gallery */}
                    <div className="space-y-4">
                        {(() => {
                            // Logic to parse images and determine what to show
                            let images: string[] = [];
                            try {
                                const parsed = JSON.parse(product.image);
                                if (parsed.front) images.push(parsed.front);
                                if (parsed.back) images.push(parsed.back);
                                if (parsed.additional) images.push(parsed.additional);
                            } catch (e) {
                                if (product.image) images.push(product.image);
                            }

                            // Use the first image if no "activeImage" state is tracked yet (we'll implement local state for this)
                            // We need to move this logic slightly to use state, but for now we can render inline

                            // Since we are inside a map/render, we can't cleanly add state hooks here without refactoring the whole component.
                            // However, we CAN render the "active" image if we lift this logic up.
                            // For this specific replacement, I will implement a self-contained extraction that works with the existing flow,
                            // OR better, I should implement a small sub-component or just inline the state logic at the top of the file
                            // But since I can only replace chunks, I'll replace the whole gallery section and assume I can add the state hook in a separate call 
                            // OR I can just use a local variable for now if interaction isn't strictly required, 
                            // BUT the user wants to see the images.

                            // Let's rely on a new state variable `activeImage` that I will add in a separate edit.
                            // For now, I'll default to the first image.

                            const mainImage = activeImage || images[0] || "";

                            return (
                                <>
                                    <div className="aspect-[4/5] bg-gray-100 rounded-lg w-full overflow-hidden">
                                        {mainImage ? (
                                            <img
                                                src={mainImage}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-navy text-cream/40 font-bold uppercase tracking-widest text-sm">
                                                <span>{product.name}</span>
                                                <span className="text-[10px] mt-2 opacity-50">Preview Unavailable</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-4 gap-4">
                                        {images.map((img, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => setActiveImage(img)}
                                                className={`aspect-square bg-gray-100 rounded-lg cursor-pointer overflow-hidden border-2 transition-all ${activeImage === img ? 'border-navy' : 'border-transparent hover:border-navy/20'}`}
                                            >
                                                <img src={img} alt={`View ${idx}`} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </>
                            );
                        })()}
                    </div>

                    {/* Product Details */}
                    <div className="space-y-8">
                        <div>
                            <h4 className="text-sm font-bold uppercase tracking-widest text-navy/40 mb-2">{product.team}</h4>
                            <h1 className="font-heading text-4xl md:text-6xl font-bold uppercase tracking-tighter text-navy mb-4">
                                {product.name}
                            </h1>
                            <p className="text-2xl font-medium text-navy">
                                ₹{product.price.toFixed(2)}
                            </p>
                        </div>

                        <p className="text-navy/70 leading-relaxed">
                            {product.description}
                        </p>

                        {/* Size Selector */}
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Select Size</h3>
                            <div className="flex gap-4">
                                {["S", "M", "L", "XL", "2XL"].map((size) => {
                                    const availableSizes = product.sizes ? product.sizes.split(',').map((s: string) => s.trim()) : [];
                                    // If product.sizes is null/empty, assume all are available (or handle as logic requires). 
                                    // But based on "Availability" feature, if it's empty, maybe NO sizes are available?
                                    // Actually, usually "no sizes defined" implies default availability in simple apps, 
                                    // but here the Admin explicitly removes them. 
                                    // Let's assume if product.sizes exists, we enforce it. If it's missing, maybe show all as available (legacy fallback) or none.
                                    // Use legacy fallback: if product.sizes is missing, show all.
                                    const isAvailable = !product.sizes || availableSizes.includes(size);

                                    return (
                                        <button
                                            key={size}
                                            disabled={!isAvailable}
                                            onClick={() => isAvailable && setSelectedSize(size)}
                                            className={`w-12 h-12 flex items-center justify-center border transition-all relative ${!isAvailable
                                                ? 'bg-black/5 text-navy/20 border-black/5 cursor-not-allowed'
                                                : selectedSize === size
                                                    ? 'bg-navy text-cream border-navy'
                                                    : 'bg-transparent text-navy border-navy/20 hover:border-navy'
                                                }`}
                                        >
                                            {size}
                                            {!isAvailable && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-[150%] h-[1px] bg-navy/20 rotate-45 absolute" />
                                                    <div className="w-[150%] h-[1px] bg-navy/20 -rotate-45 absolute" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Customization Fields (Only for Custom products) */}
                        {product.name.toLowerCase().includes("custom") && (
                            <div className="space-y-4 pt-4 border-t border-navy/10">
                                <h3 className="text-sm font-bold uppercase tracking-wider">Personalize</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-navy/60 uppercase mb-1 block">Name</label>
                                        <input
                                            type="text"
                                            value={customName}
                                            onChange={(e) => setCustomName(e.target.value.toUpperCase())}
                                            placeholder="YOUR NAME"
                                            maxLength={12}
                                            className="w-full bg-white border border-navy/20 p-3 rounded-none text-navy font-bold uppercase focus:outline-none focus:border-navy"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-navy/60 uppercase mb-1 block">Number</label>
                                        <input
                                            type="number"
                                            value={customNumber}
                                            onChange={(e) => setCustomNumber(e.target.value.slice(0, 2))}
                                            placeholder="10"
                                            max={99}
                                            className="w-full bg-white border border-navy/20 p-3 rounded-none text-navy font-bold uppercase focus:outline-none focus:border-navy"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Add to Cart */}
                        <div className="pt-4">
                            <Button onClick={handleAddToCart} className="w-full md:w-auto h-14 text-lg">
                                Add to Cart - ₹{(product.price).toFixed(2)}
                            </Button>
                        </div>

                        {/* Features */}
                        {/* Features */}
                        <ul className="space-y-2 text-sm text-navy/60 pl-5 pt-8 border-t border-navy/10">
                            {[
                                "Premium Fan Edition Jersey",
                                "Breathable, lightweight fabric",
                                "Modern slim-fit silhouette",
                                "High-quality polyester material",
                                "Custom stitched by 11 Code Store"
                            ].map((feature, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-navy/40 shrink-0" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Related Products */}
                {
                    relatedProducts.length > 0 && (
                        <div className="mt-32">
                            <h3 className="font-heading text-3xl font-bold uppercase tracking-tighter text-navy mb-12">
                                You Might Also Like
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                                {relatedProducts.map(p => (
                                    <ProductCard key={p.id} product={p} />
                                ))}
                            </div>
                        </div>
                    )
                }
            </Section >
        </div >
    );
}
