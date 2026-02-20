"use client";

import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, LogOut, User as UserIcon } from "lucide-react";

interface Order {
    id: string;
    total: number;
    status: string;
    createdAt: string;
    items: any[];
}

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        phone: "",
        address: ""
    });

    useEffect(() => {
        // Check for session
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
            router.push("/login");
            return;
        }

        const userData = JSON.parse(storedUser);
        setUser(userData);
        setFormData({
            phone: userData.phone || "",
            address: userData.address || ""
        });

        // Fetch Orders
        const fetchOrders = async () => {
            try {
                const res = await fetch(`/api/orders?email=${userData.email}`);
                if (res.ok) {
                    const data = await res.json();
                    setOrders(data);
                }
            } catch (error) {
                console.error("Failed to load orders", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchOrders();
    }, [router]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/user/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    phone: formData.phone,
                    address: formData.address
                }),
            });

            if (res.ok) {
                const updatedUser = await res.json();
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser)); // Update session
                setIsEditing(false);
            } else {
                alert("Failed to update profile");
            }
        } catch (error) {
            console.error("Update failed", error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
        router.push("/");
    };

    if (!user) return null; // Or loading spinner

    return (
        <div className="pt-32 pb-20 min-h-screen bg-cream">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row gap-12">

                    {/* Sidebar / User Info */}
                    <div className="w-full md:w-1/3 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-cream border border-navy/10 p-8 text-navy rounded-2xl relative overflow-hidden"
                        >
                            {/* Decorative background pattern */}
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />

                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-24 h-24 bg-navy/5 rounded-full flex items-center justify-center mb-4 text-navy border border-navy/10">
                                    <UserIcon size={40} />
                                </div>
                                <h1 className="font-heading text-3xl font-bold uppercase tracking-tighter mb-1">{user.name}</h1>
                                <p className="text-navy/60 text-sm mb-6">{user.email}</p>

                                {!isEditing ? (
                                    <div className="w-full space-y-4 pt-6 border-t border-navy/10 text-left">
                                        <div>
                                            <p className="text-xs uppercase tracking-widest text-navy/40 mb-1">Phone</p>
                                            <p className="font-bold">{user.phone || "Not set"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-widest text-navy/40 mb-1">Address</p>
                                            <p className="font-bold">{user.address || "Not set"}</p>
                                        </div>
                                        <Button
                                            className="w-full mt-4 bg-navy text-cream hover:bg-navy/90 border-none"
                                            onClick={() => setIsEditing(true)}
                                        >
                                            Edit Details
                                        </Button>

                                        {user.email === "afras123@gmail.com" && (
                                            <Button
                                                className="w-full mt-2 bg-cream border border-navy text-navy hover:bg-navy hover:text-cream"
                                                onClick={() => router.push('/admin')}
                                            >
                                                Access Admin Dashboard
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <form onSubmit={handleUpdateProfile} className="w-full space-y-4 pt-6 border-t border-navy/10 text-left">
                                        <div>
                                            <label className="text-xs uppercase tracking-widest text-navy/40 mb-1 block">Phone</label>
                                            <input
                                                className="w-full bg-white border border-navy/10 rounded p-2 text-navy placeholder:text-navy/30 focus:outline-none focus:border-navy"
                                                placeholder="+91..."
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs uppercase tracking-widest text-navy/40 mb-1 block">Address</label>
                                            <textarea
                                                className="w-full bg-white border border-navy/10 rounded p-2 text-navy placeholder:text-navy/30 focus:outline-none focus:border-navy h-20"
                                                placeholder="Enter address..."
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="flex-1 border-navy/20 text-navy hover:bg-navy/5"
                                                onClick={() => setIsEditing(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                className="flex-1 bg-navy text-cream hover:bg-navy/90"
                                            >
                                                Save
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </motion.div>

                        <div className="bg-white p-6 rounded-xl border border-navy/5">
                            <Button className="w-full flex items-center justify-center bg-red-600 text-cream hover:bg-red-700 border-none" onClick={handleLogout}>
                                <LogOut size={16} className="mr-2" />
                                Sign Out
                            </Button>
                        </div>
                    </div>

                    {/* Main Content / Orders */}
                    <div className="w-full md:w-2/3">
                        <h2 className="font-heading text-2xl font-bold uppercase tracking-tighter text-navy mb-8 flex items-center gap-3">
                            <Package className="text-navy/60" />
                            Order History
                        </h2>

                        {isLoading ? (
                            <p className="text-navy/40">Loading orders...</p>
                        ) : orders.length === 0 ? (
                            <div className="bg-white p-12 rounded-xl border border-navy/5 text-center">
                                <p className="text-navy/60 mb-6 font-medium">No orders found yet.</p>
                                <Button onClick={() => router.push('/shop')}>Start Shopping</Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {orders.map((order) => (
                                    <motion.div
                                        key={order.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="bg-white p-6 rounded-xl border border-navy/5 hover:shadow-lg transition-shadow"
                                    >
                                        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                                            <div>
                                                <p className="text-xs text-navy/40 uppercase tracking-wider font-bold mb-1">Order ID</p>
                                                <p className="font-mono text-sm text-navy font-bold">{order.id.slice(-8)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-navy/40 uppercase tracking-wider font-bold mb-1">Date</p>
                                                <p className="text-sm text-navy">{new Date(order.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-navy/40 uppercase tracking-wider font-bold mb-1">Status</p>
                                                <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                                    {order.status}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-navy/40 uppercase tracking-wider font-bold mb-1">Total</p>
                                                <p className="font-heading text-xl font-bold text-navy">₹{order.total.toFixed(2)}</p>
                                            </div>
                                        </div>

                                        <div className="border-t border-navy/5 pt-4">
                                            <p className="text-xs text-navy/40 mb-3">{order.items.length} Items</p>
                                            <div className="flex gap-2 overflow-x-auto pb-2">
                                                {order.items.map((item: any) => (
                                                    <div key={item.id} className="w-12 h-16 bg-navy/5 rounded flex-shrink-0 flex items-center justify-center text-[10px] text-navy/40 font-bold border border-navy/5">
                                                        KIT
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
