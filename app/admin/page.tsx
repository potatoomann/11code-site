"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { RefreshCw, Trash2, Database, ShoppingCart, Check, X, Upload, Pencil, Ban, Box, Activity, HardDrive } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { Toast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

const SuggestionsList = ({ query, products, onSelect }: { query: string, products: any[], onSelect: (name: string) => void }) => {
    if (!query) return null;
    const matches = products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));

    // If exact match is the only one, hide suggestions to avoid annoyance after selection
    if (matches.length === 1 && matches[0].name === query) return null;

    if (matches.length === 0) return null;

    return (
        <div className="absolute top-full left-0 z-20 w-full bg-white border border-navy/10 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
            {matches.map(p => (
                <div
                    key={p.id}
                    className="p-2 hover:bg-navy/5 cursor-pointer text-xs font-bold text-navy border-b border-navy/5 last:border-none"
                    onClick={() => onSelect(p.name)}
                >
                    {p.name}
                </div>
            ))}
        </div>
    );
};

export default function AdminPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [salesData, setSalesData] = useState<{ date: string, revenue: number }[]>([]);

    // UI Feedback State
    const [toast, setToast] = useState({ message: "", type: "success" as "success" | "error", isVisible: false });
    const [modal, setModal] = useState({ isOpen: false, title: "", message: "", onConfirm: () => { }, isDestructive: false });

    // Store
    const clearCart = useCartStore(state => state.clearCart);
    const cartTotal = useCartStore(state => state.total());
    const cartItemsCount = useCartStore(state => state.items.length);

    // Editing State
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        productNumber: "",
        name: "",
        price: "",
        description: "",
        category: "",
        team: "",
        featured: false,
        image: "",
        stock: "10",
        sizes: "S,M,L,XL,2XL"
    });
    const [backImage, setBackImage] = useState("");
    const [additionalImage, setAdditionalImage] = useState("");

    // Action States
    const [deleteInput, setDeleteInput] = useState("");
    const [stockInput, setStockInput] = useState("");
    const [sizeNameInput, setSizeNameInput] = useState("");
    const [sizeRemoveInput, setSizeRemoveInput] = useState("");
    const [sizeAddInput, setSizeAddInput] = useState("");



    // Helper to find product by name (case-insensitive)
    const findProductByName = (name: string) => {
        return products.find(p => p.name.toLowerCase() === name.toLowerCase());
    };

    // 1. Delete By Name
    const handleDeleteByName = async () => {
        const product = findProductByName(deleteInput);
        if (!product) {
            setToast({ message: "Product not found!", type: "error", isVisible: true });
            return;
        }

        setModal({
            isOpen: true,
            title: "Delete Product",
            message: `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
            isDestructive: true,
            onConfirm: async () => {
                await deleteProduct(product.id, true); // Pass true to skip inner confirm
                setDeleteInput("");
                setToast({ message: "Product deleted successfully.", type: "success", isVisible: true });
                setModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    // 2. Stock Status Update
    const handleStockStatus = async (status: 'in' | 'out') => {
        const product = findProductByName(stockInput);
        if (!product) {
            setToast({ message: "Product not found!", type: "error", isVisible: true });
            return;
        }

        const newStock = status === 'in' ? 100 : 0;
        try {
            const res = await fetch(`/api/products/${product.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...product, stock: newStock })
            });
            if (res.ok) {
                fetchProducts();
                setStockInput("");
                setToast({ message: `Updated stock: ${status === 'in' ? 'In Stock' : 'Out of Stock'}`, type: "success", isVisible: true });
            }
        } catch (e) {
            console.error("Error updating stock", e);
            setToast({ message: "Error updating stock.", type: "error", isVisible: true });
        }
    };

    // 3. Remove Size
    const handleRemoveSize = async () => {
        const product = findProductByName(sizeNameInput);
        if (!product) {
            setToast({ message: "Product not found!", type: "error", isVisible: true });
            return;
        }

        const sizeToRemove = sizeRemoveInput.toUpperCase().trim();
        const currentSizes = (product.sizes || "").split(",").map((s: string) => s.trim());

        if (!currentSizes.includes(sizeToRemove)) {
            setToast({ message: `Size ${sizeToRemove} not found in product ${product.name}`, type: "error", isVisible: true });
            return;
        }

        const newSizes = currentSizes.filter((s: string) => s !== sizeToRemove).join(",");

        try {
            const res = await fetch(`/api/products/${product.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...product, sizes: newSizes })
            });
            if (res.ok) {
                fetchProducts();
                setSizeNameInput("");
                setSizeRemoveInput("");
                setToast({ message: `Removed size ${sizeToRemove} from ${product.name}`, type: "success", isVisible: true });
            }
        } catch (e) {
            console.error("Error updating size", e);
            setToast({ message: "Error updating size.", type: "error", isVisible: true });
        }
    };

    // 4. Add Size
    const handleAddSize = async () => {
        const product = findProductByName(sizeNameInput);
        if (!product) {
            setToast({ message: "Product not found!", type: "error", isVisible: true });
            return;
        }

        const sizeToAdd = sizeAddInput.toUpperCase().trim();
        const currentSizes = (product.sizes || "").split(",").map((s: string) => s.trim()).filter((s: string) => s !== "");

        if (currentSizes.includes(sizeToAdd)) {
            setToast({ message: `Size ${sizeToAdd} already exists in product ${product.name}`, type: "error", isVisible: true });
            return;
        }

        // Add size and sort logically if standard sizes
        const standardOrder = ["S", "M", "L", "XL", "2XL", "3XL"];
        const newSizesArray = [...currentSizes, sizeToAdd].sort((a, b) => {
            const indexA = standardOrder.indexOf(a);
            const indexB = standardOrder.indexOf(b);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            return a.localeCompare(b);
        });

        const newSizes = newSizesArray.join(",");

        try {
            const res = await fetch(`/api/products/${product.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...product, sizes: newSizes })
            });
            if (res.ok) {
                fetchProducts();
                setSizeAddInput("");
                setToast({ message: `Added size ${sizeToAdd} to ${product.name}`, type: "success", isVisible: true });
            }
        } catch (e) {
            console.error("Error updating size", e);
            setToast({ message: "Error updating size.", type: "error", isVisible: true });
        }
    };



    // Stats State
    const [stats, setStats] = useState({
        totalProducts: 0,
        activeCartItems: 0,
        cartTotal: "0",
        events: 0,
        storageUsage: "...",
        storageLimit: "1 TB"
    });

    const fetchSystemStats = async () => {
        try {
            const res = await fetch("/api/stats/system");
            if (res.ok) {
                const data = await res.json();
                setStats(prev => ({
                    ...prev,
                    totalProducts: data.productCount,
                    events: data.eventCount,
                    storageUsage: data.storageUsage,
                    storageLimit: data.storageLimit
                }));
            }
        } catch (e) {
            console.error("Failed to fetch system stats");
            setToast({ message: "Failed to fetch system stats.", type: "error", isVisible: true });
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back' | 'additional') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                if (type === 'front') {
                    setFormData(prev => ({ ...prev, image: result }));
                } else if (type === 'back') {
                    setBackImage(result);
                } else if (type === 'additional') {
                    setAdditionalImage(result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        const checkAuth = () => {
            const storedUser = localStorage.getItem("user");
            if (!storedUser) {
                router.push("/login?redirect=/admin");
                return;
            }

            try {
                const user = JSON.parse(storedUser);
                if (user.email === "afras123@gmail.com") {
                    setIsAuthenticated(true);
                    fetchProducts();
                    fetchSalesData();
                    fetchSystemStats();
                } else {
                    router.push("/");
                }
            } catch (e) {
                router.push("/login");
            } finally {
                setCheckingAuth(false);
            }
        };

        checkAuth();
    }, [router]);

    const fetchProducts = async () => {
        try {
            const res = await fetch("/api/products", { cache: "no-store" });
            const data = await res.json();
            setProducts(data);
        } catch (error) {
            console.error("Failed to fetch products");
            setToast({ message: "Failed to fetch products.", type: "error", isVisible: true });
        }
    };

    const fetchSalesData = async () => {
        try {
            const res = await fetch("/api/stats/sales");
            if (res.ok) {
                const data = await res.json();
                setSalesData(data);
            }
        } catch (error) {
            console.error("Failed to fetch sales data", error);
            setToast({ message: "Failed to fetch sales data.", type: "error", isVisible: true });
        }
    };

    const handleEdit = (product: any) => {
        setEditingId(product.id);
        // Try to parse image as JSON (for multiple images), otherwise use as single image
        let frontImage = product.image || "";
        let backImg = "";
        let additionalImg = "";

        try {
            const parsed = JSON.parse(product.image);
            if (parsed.front) frontImage = parsed.front;
            if (parsed.back) backImg = parsed.back;
            if (parsed.additional) additionalImg = parsed.additional;
        } catch (e) {
            // Not JSON, use as single image
        }

        setFormData({
            productNumber: product.productNumber || "",
            name: product.name,
            price: product.price.toString(),
            description: product.description || "",
            category: product.category,
            team: product.team || "",
            featured: product.featured,
            image: frontImage,
            stock: product.stock.toString(),
            sizes: product.sizes || "S,M,L,XL,2XL"
        });
        setBackImage(backImg);
        setAdditionalImage(additionalImg);
        // Scroll to form
        window.scrollTo({ top: 500, behavior: 'smooth' }); // Scroll effectively to form
    };

    const handleClearForm = () => {
        setEditingId(null);
        setFormData({
            productNumber: "",
            name: "",
            price: "",
            description: "",
            category: "",
            team: "",
            featured: false,
            image: "",
            stock: "10",
            sizes: "S,M,L,XL,2XL"
        });
        setBackImage("");
        setAdditionalImage("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const method = editingId ? "PUT" : "POST";
            const url = editingId ? `/api/products/${editingId}` : "/api/products";

            // Combine all images into JSON if any back or additional images exist
            let imageData = formData.image;
            if (backImage || additionalImage) {
                imageData = JSON.stringify({
                    front: formData.image || "",
                    back: backImage || "",
                    additional: additionalImage || ""
                });
            }

            const submitData = {
                ...formData,
                image: imageData
            };

            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submitData)
            });

            const responseData = await res.json();

            if (res.ok && !responseData.error) {
                handleClearForm();
                fetchProducts();
                setToast({ message: `Product ${editingId ? "updated" : "added"} successfully.`, type: "success", isVisible: true });
            } else {
                console.error("Failed to save product:", responseData.error);
                console.error("Error details:", responseData.details); // Log the real error
                setToast({ message: `Failed to save product: ${responseData.error || "Unknown error"}`, type: "error", isVisible: true });
            }
        } catch (error) {
            console.error("Error saving product:", error);
            setToast({ message: "Error saving product.", type: "error", isVisible: true });
        } finally {
            setIsLoading(false);
        }
    };

    const deleteProduct = async (id: string, skipConfirm = false) => {
        if (!skipConfirm) {
            // For list delete button
            setModal({
                isOpen: true,
                title: "Delete Product",
                message: "Are you sure you want to delete this product?",
                isDestructive: true,
                onConfirm: async () => {
                    await performDelete(id);
                    setModal(prev => ({ ...prev, isOpen: false }));
                    setToast({ message: "Product deleted.", type: "success", isVisible: true });
                }
            });
            return;
        }
        await performDelete(id);
    };

    const performDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
            if (res.ok) fetchProducts();
        } catch (e) {
            console.error(e);
            setToast({ message: "Error deleting product.", type: "error", isVisible: true });
        }
    };

    // Stats Handlers
    const handleClearCart = () => {
        setModal({
            isOpen: true,
            title: "Clear Cart",
            message: "Are you sure you want to clear your active cart items?",
            isDestructive: true,
            onConfirm: () => {
                clearCart();
                setModal(prev => ({ ...prev, isOpen: false }));
                setToast({ message: "Cart cleared successfully", type: "success", isVisible: true });
            }
        });
    };
    const handleRefreshEvents = () => {
        fetchSystemStats();
        setToast({ message: "Events refreshed", type: "success", isVisible: true });
    };
    const handleClearEvents = async () => {
        setModal({
            isOpen: true,
            title: "Clear All Events",
            message: "This will remove all system event logs. Continue?",
            isDestructive: true,
            onConfirm: async () => {
                await fetch("/api/events", { method: "DELETE" });
                fetchSystemStats();
                setModal(prev => ({ ...prev, isOpen: false }));
                setToast({ message: "All events cleared", type: "success", isVisible: true });
            }
        });
    };
    const handleCheckStatus = () => {
        fetchSystemStats();
        setToast({ message: "System Status: Optimal", type: "success", isVisible: true });
    };

    if (checkingAuth) return <div className="min-h-screen flex items-center justify-center bg-cream text-navy">Loading...</div>;
    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen pt-32 pb-20 bg-cream font-sans">
            <div className="container mx-auto px-6 max-w-7xl">

                {/* Header Section */}
                <div className="mb-12 text-center md:text-left">
                    <h1 className="font-heading text-6xl font-bold uppercase tracking-tighter text-navy mb-2">
                        Admin Dashboard
                    </h1>
                    <p className="text-navy/60 text-lg">
                        Overview of store activity and cart behavior
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {/* Total Products */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-navy/5">
                        <p className="text-xs font-bold uppercase tracking-wider text-navy/60 mb-2">Total Products</p>
                        <p className="text-4xl font-bold text-navy mb-1">{stats.totalProducts}</p>
                        <p className="text-xs text-navy/40">Detected from shop</p>
                    </div>

                    {/* Active Cart Items */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-navy/5">
                        <p className="text-xs font-bold uppercase tracking-wider text-navy/60 mb-2">Active Cart Items</p>
                        <p className="text-4xl font-bold text-navy mb-1">{cartItemsCount}</p>
                        <p className="text-xs text-navy/40 mb-4">Total: ₹{cartTotal.toLocaleString()}</p>
                        <Button onClick={handleClearCart} className="w-full text-xs h-8 bg-navy text-cream hover:bg-navy/90 border-none rounded-lg">
                            CLEAR CART
                        </Button>
                    </div>

                    {/* Events */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-navy/5">
                        <p className="text-xs font-bold uppercase tracking-wider text-navy/60 mb-2">Events</p>
                        <p className="text-4xl font-bold text-navy mb-4">{stats.events}</p>
                        <div className="flex flex-col gap-2">
                            <Button onClick={handleRefreshEvents} className="w-full text-xs h-8 bg-cream text-navy border border-navy/10 hover:bg-navy/5 rounded-lg">
                                REFRESH
                            </Button>
                            <Button onClick={handleClearEvents} className="w-full text-xs h-8 bg-navy text-cream hover:bg-navy/90 border-none rounded-lg">
                                CLEAR EVENTS
                            </Button>
                        </div>
                    </div>

                    {/* Storage Usage */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-navy/5">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-navy/60 mb-2">Storage Usage</p>
                                <p className="text-3xl font-bold text-navy mb-1">{stats.storageUsage}</p>
                                <p className="text-xs text-navy/40">6% of {stats.storageLimit} used</p>
                            </div>
                            <div className="relative w-12 h-12 flex-shrink-0">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                    {/* Background Circle */}
                                    <path
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="#E5E7EB"
                                        strokeWidth="4"
                                    />
                                    {/* Progress Circle (6%) */}
                                    <path
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="#050A30"
                                        strokeWidth="4"
                                        strokeDasharray="6, 100"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-navy">
                                    6%
                                </div>
                            </div>
                        </div>
                        <Button onClick={handleCheckStatus} className="w-full text-xs h-8 bg-navy text-cream hover:bg-navy/90 border-none rounded-lg">
                            CHECK STATUS
                        </Button>
                    </div>
                </div>

                {/* Sales Graph Section */}
                <section className="bg-white p-8 rounded-3xl border border-navy/5 mb-12 relative overflow-hidden">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-wider text-navy/60 mb-1">Revenue</p>
                            <h2 className="font-heading text-3xl font-bold text-navy">Last 7 Days</h2>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold uppercase tracking-wider text-green-600 mb-1">Total Sales</p>
                            <p className="font-heading text-2xl font-bold text-navy">
                                ₹{salesData.reduce((acc, curr) => acc + curr.revenue, 0).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* Bar Chart Container */}
                    <div className="h-64 flex items-end justify-between gap-2 sm:gap-4">
                        {salesData.length > 0 ? (
                            salesData.map((day, index) => {
                                const maxRevenue = Math.max(...salesData.map(d => d.revenue), 100); // Avoid div by zero, min scale 100
                                const heightPercentage = (day.revenue / maxRevenue) * 100;

                                return (
                                    <div key={index} className="flex-1 flex flex-col items-center group relative">
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-navy text-white text-[10px] font-bold py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                                            ₹{day.revenue}
                                        </div>

                                        {/* Bar */}
                                        <div
                                            className="w-full bg-navy/10 rounded-t-lg relative overflow-hidden group-hover:bg-navy/20 transition-all duration-500 ease-out"
                                            style={{ height: `${heightPercentage || 1}%` }}
                                        >
                                            <div
                                                className="absolute bottom-0 left-0 w-full bg-navy transition-all duration-1000 ease-out"
                                                style={{ height: '0%', animation: `growUp 1s ease-out forwards ${index * 0.1}s` }}
                                            />
                                            <style jsx>{`
                                                @keyframes growUp {
                                                    from { height: 0%; }
                                                    to { height: 100%; }
                                                }
                                            `}</style>
                                        </div>

                                        {/* Date Label */}
                                        <div className="mt-3 text-[10px] sm:text-xs font-bold text-navy/40 uppercase tracking-wider text-center">
                                            {day.date}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-navy/30 italic text-sm">
                                Loading sales data...
                            </div>
                        )}
                    </div>
                </section>

                <section className="bg-navy/5 p-8 rounded-3xl border border-navy/5 mb-12">
                    <div className="flex justify-between items-center mb-6">
                        <p className="text-sm font-bold uppercase tracking-wider text-navy/60">
                            {editingId ? "Edit Product" : "Add New Product"}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Product ID */}
                            <div>
                                <label htmlFor="productNumber" className="text-xs font-bold uppercase tracking-wider text-navy mb-2 block">Product ID *</label>
                                <input
                                    id="productNumber"
                                    name="productNumber"
                                    className="w-full p-4 bg-black/5 border border-navy/5 rounded-lg focus:outline-none focus:border-navy transition-colors placeholder:text-navy/30 text-sm"
                                    placeholder="e.g., 008"
                                    value={formData.productNumber}
                                    onChange={e => setFormData({ ...formData, productNumber: e.target.value })}
                                />
                                <p className="text-[10px] text-navy/30 mt-1 italic">Unique numeric identifier</p>
                            </div>

                            {/* Product Name */}
                            <div>
                                <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-navy mb-2 block">Product Name *</label>
                                <input
                                    id="name"
                                    name="name"
                                    className="w-full p-4 bg-black/5 border border-navy/5 rounded-lg focus:outline-none focus:border-navy transition-colors placeholder:text-navy/30 text-sm"
                                    placeholder="e.g., Classic Jersey 2025"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-navy mb-2 block">Category</label>
                            <input
                                id="category"
                                name="category"
                                className="w-full p-4 bg-black/5 border border-navy/5 rounded-lg focus:outline-none focus:border-navy transition-colors placeholder:text-navy/30 text-sm"
                                placeholder="e.g., Retro Jerseys"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                required
                            />
                            <p className="text-[10px] text-navy/30 mt-1 italic">Type a category (or pick from suggestions)</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Price */}
                            <div>
                                <label htmlFor="price" className="text-xs font-bold uppercase tracking-wider text-navy mb-2 block">Price (₹) *</label>
                                <input
                                    id="price"
                                    name="price"
                                    className="w-full p-4 bg-black/5 border border-navy/5 rounded-lg focus:outline-none focus:border-navy transition-colors placeholder:text-navy/30 text-sm"
                                    placeholder="999"
                                    type="number"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Front Image */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-navy mb-2 block">Front Image *</label>
                                <div className="relative border-2 border-dashed border-navy/10 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:bg-white/50 transition-colors cursor-pointer group bg-black/5 h-[56px] overflow-hidden">
                                    <input
                                        type="file"
                                        id="file-front"
                                        name="file-front"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        onChange={(e) => handleImageUpload(e, 'front')}
                                    />
                                    {formData.image ? (
                                        <div className="flex items-center gap-2">
                                            <Check size={16} className="text-green-600" />
                                            <span className="text-xs text-navy/60">Image Selected</span>
                                        </div>
                                    ) : (
                                        <Upload size={20} className="text-navy/30" />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Back Image */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-navy mb-2 block">Back Image</label>
                                <div className="relative border-2 border-dashed border-navy/10 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:bg-white/50 transition-colors cursor-pointer group bg-black/5 h-[56px] overflow-hidden">
                                    <input
                                        type="file"
                                        id="file-back"
                                        name="file-back"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        onChange={(e) => handleImageUpload(e, 'back')}
                                    />
                                    {backImage ? (
                                        <div className="flex items-center gap-2">
                                            <Check size={16} className="text-green-600" />
                                            <span className="text-xs text-navy/60">Image Selected</span>
                                        </div>
                                    ) : (
                                        <Upload size={20} className="text-navy/30" />
                                    )}
                                </div>
                            </div>

                            {/* Additional Image */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-navy mb-2 block">Additional Image</label>
                                <div className="relative border-2 border-dashed border-navy/10 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:bg-white/50 transition-colors cursor-pointer group bg-black/5 h-[56px] overflow-hidden">
                                    <input
                                        type="file"
                                        id="file-additional"
                                        name="file-additional"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        onChange={(e) => handleImageUpload(e, 'additional')}
                                    />
                                    {additionalImage ? (
                                        <div className="flex items-center gap-2">
                                            <Check size={16} className="text-green-600" />
                                            <span className="text-xs text-navy/60">Image Selected</span>
                                        </div>
                                    ) : (
                                        <Upload size={20} className="text-navy/30" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-navy mb-2 block">Description</label>
                            <textarea
                                id="description"
                                name="description"
                                className="w-full p-4 bg-black/5 border border-navy/5 rounded-lg focus:outline-none focus:border-navy transition-colors placeholder:text-navy/30 text-sm resize-none min-h-[100px]"
                                placeholder="Enter product description..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        {/* Hidden advanced fields (Team, Sizes) */}
                        <div className="hidden">
                            <input value={formData.team} onChange={e => setFormData({ ...formData, team: e.target.value })} />
                            <input value={formData.sizes} onChange={e => setFormData({ ...formData, sizes: e.target.value })} />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-4">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="bg-navy text-cream h-12 px-8 rounded-lg text-sm tracking-widest hover:bg-navy/90 border-none disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "SAVING..." : (editingId ? "UPDATE PRODUCT" : "ADD PRODUCT")}
                            </Button>
                            <Button
                                type="button"
                                onClick={handleClearForm}
                                disabled={isLoading}
                                className="bg-navy text-cream h-12 px-8 rounded-lg text-sm tracking-widest hover:bg-navy/90 border-none disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                CLEAR FORM
                            </Button>
                        </div>
                    </form>
                </section>

                {/* Manage Existing Products Section (New Widgets) */}
                <section className="mb-12">
                    <h2 className="font-heading text-lg font-bold text-navy mb-6">Manage Existing Products</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">

                        {/* 1. Delete Product (Red) */}
                        {/* 1. Delete Product */}
                        <div className="bg-white p-6 rounded-2xl border border-navy/5 shadow-sm relative overflow-hidden group hover:border-navy/20 transition-all">
                            <div className="flex items-center gap-2 mb-1 text-navy/60 font-bold text-xs uppercase tracking-wider group-hover:text-navy transition-colors">
                                <Trash2 size={14} /> Delete Product
                            </div>
                            <h3 className="font-heading text-xl font-bold text-navy mb-4">PRODUCT NAME</h3>
                            <div className="relative">
                                <input
                                    placeholder="Enter product name..."
                                    className="w-full p-3 bg-navy/5 border border-navy/10 rounded-lg text-sm mb-2 focus:outline-none focus:border-navy transition-colors placeholder:text-navy/30"
                                    value={deleteInput}
                                    onChange={(e) => setDeleteInput(e.target.value)}
                                />
                                <SuggestionsList query={deleteInput} products={products} onSelect={setDeleteInput} />
                            </div>
                            <p className="text-[10px] text-navy/40 italic mb-4">Search and delete product by name</p>
                            <Button onClick={handleDeleteByName} className="w-full bg-navy text-cream hover:bg-navy/90 border-none font-bold text-xs h-10 shadow-sm">
                                DELETE SELECTED
                            </Button>
                        </div>

                        {/* 2. Stock Status (Orange) */}
                        {/* 2. Stock Status */}
                        <div className="bg-white p-6 rounded-2xl border border-navy/5 shadow-sm relative overflow-hidden group hover:border-navy/20 transition-all">
                            <div className="flex items-center gap-2 mb-1 text-navy/60 font-bold text-xs uppercase tracking-wider group-hover:text-navy transition-colors">
                                <Box size={14} /> Stock Status
                            </div>
                            <h3 className="font-heading text-xl font-bold text-navy mb-4">PRODUCT NAME</h3>
                            <div className="relative">
                                <input
                                    placeholder="Enter product name..."
                                    className="w-full p-3 bg-navy/5 border border-navy/10 rounded-lg text-sm mb-2 focus:outline-none focus:border-navy transition-colors placeholder:text-navy/30"
                                    value={stockInput}
                                    onChange={(e) => setStockInput(e.target.value)}
                                />
                                <SuggestionsList query={stockInput} products={products} onSelect={setStockInput} />
                            </div>
                            <p className="text-[10px] text-navy/40 italic mb-4">Mark as out of stock or available</p>
                            <div className="grid grid-cols-2 gap-3">
                                <Button onClick={() => handleStockStatus('out')} className="w-full bg-cream text-navy hover:bg-navy/10 border border-navy/10 font-bold text-xs h-10 shadow-sm">
                                    OUT OF STOCK
                                </Button>
                                <Button onClick={() => handleStockStatus('in')} className="w-full bg-navy text-cream hover:bg-navy/90 border-none font-bold text-xs h-10 shadow-sm">
                                    IN STOCK
                                </Button>
                            </div>
                        </div>

                        {/* 3. Size Availability (Blue) */}
                        {/* 3. Size Availability */}
                        <div className="bg-white p-6 rounded-2xl border border-navy/5 shadow-sm relative overflow-hidden group hover:border-navy/20 transition-all">
                            <div className="flex items-center gap-2 mb-1 text-navy/60 font-bold text-xs uppercase tracking-wider group-hover:text-navy transition-colors">
                                <Activity size={14} /> Size Availability
                            </div>
                            <h3 className="font-heading text-xl font-bold text-navy mb-4">PRODUCT NAME</h3>
                            <div className="relative">
                                <input
                                    placeholder="Enter product name..."
                                    className="w-full p-3 bg-navy/5 border border-navy/10 rounded-lg text-sm mb-3 focus:outline-none focus:border-navy transition-colors placeholder:text-navy/30"
                                    value={sizeNameInput}
                                    onChange={(e) => setSizeNameInput(e.target.value)}
                                />
                                <SuggestionsList query={sizeNameInput} products={products} onSelect={setSizeNameInput} />
                            </div>
                            <p className="text-[10px] text-navy/40 italic mb-2">Manage Sizes (Add or Remove)</p>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-navy/60 mb-1 block">Remove Size</label>
                                    <div className="flex gap-2">
                                        <input
                                            placeholder="e.g. XL"
                                            className="w-full p-2 bg-navy/5 border border-navy/10 rounded-lg text-xs focus:outline-none focus:border-navy transition-colors placeholder:text-navy/30"
                                            value={sizeRemoveInput}
                                            onChange={(e) => setSizeRemoveInput(e.target.value)}
                                        />
                                        <Button onClick={handleRemoveSize} className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border-none font-bold p-2 rounded-lg">
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-navy/60 mb-1 block">Add Size</label>
                                    <div className="flex gap-2">
                                        <input
                                            placeholder="e.g. S"
                                            className="w-full p-2 bg-navy/5 border border-navy/10 rounded-lg text-xs focus:outline-none focus:border-navy transition-colors placeholder:text-navy/30"
                                            value={sizeAddInput}
                                            onChange={(e) => setSizeAddInput(e.target.value)}
                                        />
                                        <Button onClick={handleAddSize} className="bg-navy/5 text-navy hover:bg-navy hover:text-white border-none font-bold p-2 rounded-lg">
                                            <Check size={14} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>



                    </div>
                </section>

                {/* Manage Existing Products Table */}
                <section className="pt-12 border-t border-navy/5">
                    <p className="font-heading text-lg font-bold text-navy mb-6">Inventory List ({products.length})</p>
                    <div className="space-y-4">
                        {products.length === 0 && <p className="text-navy/40 italic">No products in inventory.</p>}
                        {products.map((p) => (
                            <div key={p.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white border border-navy/5 rounded-xl hover:shadow-md transition-shadow gap-4">
                                <div className="flex items-center gap-4">
                                    {(() => {
                                        let displayImage = p.image || "";
                                        try {
                                            const parsed = JSON.parse(p.image);
                                            displayImage = parsed.front || parsed.back || parsed.additional || "";
                                        } catch (e) {
                                            // Not JSON, use as is
                                        }
                                        return displayImage ? (
                                            <div className="w-12 h-12 rounded-lg bg-cover bg-center bg-gray-100 border border-navy/10" style={{ backgroundImage: `url(${displayImage})` }} />
                                        ) : (
                                            <div className="w-12 h-12 bg-navy/5 rounded-lg flex items-center justify-center text-xs font-bold text-navy/40">
                                                {p.productNumber || "ID"}
                                            </div>
                                        );
                                    })()}
                                    <div>
                                        <p className="font-bold text-navy">{p.name}</p>
                                        <p className="text-xs text-navy/60">
                                            {p.category} | ₹{p.price}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleEdit(p)}
                                        className="h-8 text-xs bg-navy/5 text-navy hover:bg-navy hover:text-cream border-none gap-2 px-4 shadow-none flex items-center uppercase font-bold"
                                    >
                                        <Pencil size={12} /> Edit
                                    </Button>
                                    <Button
                                        onClick={() => deleteProduct(p.id)}
                                        className="h-8 text-xs bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border-none gap-2 px-4 shadow-none flex items-center uppercase font-bold"
                                    >
                                        <Trash2 size={12} /> Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />

            <Modal
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                isDestructive={modal.isDestructive}
                onConfirm={modal.onConfirm}
                onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div >
    );
}
