import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
    id: string;
    name: string;
    price: number;
    image: string;
    team: string;
    size: string;
    quantity: number;
    customName?: string;
    customNumber?: string;
}

interface CartState {
    items: CartItem[];
    isOpen: boolean;
    addItem: (item: Omit<CartItem, "quantity">) => void;
    removeItem: (id: string, size: string) => void;
    decrementItem: (id: string, size: string) => void;
    clearCart: () => void;
    toggleCart: () => void;
    openCart: () => void;
    closeCart: () => void;
    total: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,

            addItem: (newItem) => {
                set((state) => {
                    const existingItem = state.items.find(
                        (item) =>
                            item.id === newItem.id &&
                            item.size === newItem.size &&
                            item.customName === newItem.customName &&
                            item.customNumber === newItem.customNumber
                    );

                    if (existingItem) {
                        return {
                            items: state.items.map((item) =>
                                item.id === newItem.id &&
                                    item.size === newItem.size &&
                                    item.customName === newItem.customName &&
                                    item.customNumber === newItem.customNumber
                                    ? { ...item, quantity: item.quantity + 1 }
                                    : item
                            ),
                            isOpen: true, // Open cart on add
                        };
                    }

                    return {
                        items: [...state.items, { ...newItem, quantity: 1 }],
                        isOpen: true,
                    };
                });
            },

            removeItem: (id, size) => {
                set((state) => ({
                    items: state.items.filter((item) => !(item.id === id && item.size === size)),
                }));
            },

            decrementItem: (id, size) => {
                set((state) => {
                    const existingItem = state.items.find(
                        (item) => item.id === id && item.size === size
                    );

                    if (existingItem && existingItem.quantity > 1) {
                        return {
                            items: state.items.map((item) =>
                                item.id === id && item.size === size
                                    ? { ...item, quantity: item.quantity - 1 }
                                    : item
                            ),
                        };
                    } else {
                        // Remove if quantity is 1
                        return {
                            items: state.items.filter((item) => !(item.id === id && item.size === size)),
                        };
                    }
                });
            },

            clearCart: () => set({ items: [] }),

            toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
            openCart: () => set({ isOpen: true }),
            closeCart: () => set({ isOpen: false }),

            total: () => {
                return get().items.reduce((acc, item) => acc + item.price * item.quantity, 0);
            },
        }),
        {
            name: "cart-storage",
        }
    )
);
