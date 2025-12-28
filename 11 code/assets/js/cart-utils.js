// ===========================================
// CART UTILITY FUNCTIONS
// Handles localStorage cart operations
// ===========================================

// Get cart from localStorage
function getCart() {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
}

// Save cart to localStorage
function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

// Add item to cart
function addToCart(item) {
    const cart = getCart();
    cart.push(item);
    saveCart(cart);
    // Log analytics event for admin monitoring
    logEvent('add_to_cart', item);
    return true;
}

// Remove item from cart by index
function removeFromCart(index) {
    const cart = getCart();
    const removed = cart.splice(index, 1)[0];
    saveCart(cart);
    // Log analytics event for admin monitoring
    logEvent('remove_from_cart', removed || { index });
}

// Log an analytics event to localStorage
function logEvent(type, data) {
    try {
        const events = JSON.parse(localStorage.getItem('events') || '[]');
        events.push({ type, data, timestamp: Date.now() });
        localStorage.setItem('events', JSON.stringify(events));
    } catch (e) {
        console.error('Failed to log event', e);
    }
}

// Update cart count in header
function updateCartCount() {
    const cart = getCart();
    const count = cart.length;
    const cartLinks = document.querySelectorAll('a[href="cart.html"]');
    cartLinks.forEach(link => {
        link.textContent = `🛒 Cart (${count})`;
    });
}

// Clear cart
function clearCart() {
    localStorage.removeItem('cart');
    updateCartCount();
}

// Get cart total
function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
}

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
});
