// ===========================================
// CART PAGE JAVASCRIPT (cart.js)
// Handles cart display and management
// ===========================================

document.addEventListener('DOMContentLoaded', () => {
    const shippingCost = 60;
    const cartItemsContainer = document.getElementById('cart-items-container');
    
    // XSS Protection: Escape HTML special characters
    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, (s) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[s]);
    }
    
    // Load cart from localStorage
    function loadCart() {
        let cart = getCart();
        
        // Filter out null/invalid items
        cart = cart.filter(item => item && item.name && item.price !== undefined && item.quantity !== undefined);
        
        // Save cleaned cart back to localStorage
        if (cart.length < getCart().length) {
            saveCart(cart);
        }
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <p style="font-size: 1.2em; color: #666;">Your cart is empty</p>
                    <a href="shop.html" class="btn btn-primary" style="margin-top: 20px;">Continue Shopping</a>
                </div>
            `;
            updateCartTotal();
            return;
        }

        cartItemsContainer.innerHTML = cart.map((item, index) => {
            let customizationText = '';
            if (item.printing === 'pre-printed') {
                customizationText = `Player: ${escapeHtml(item.customization)}`;
            } else if (item.printing === 'custom') {
                const [name, number] = (item.customization || ' ').split(' ');
                customizationText = `Name: ${escapeHtml(name)} | Number: ${escapeHtml(number)}`;
            }
            
            // Try to get image from:
            // 1. Item's own image property (passed from shop-cart.js)
            // 2. Look up product from stored products to get frontImage
            // 3. Default fallback
            let imageSrc = item.image;
            if (!imageSrc || !imageSrc.trim()) {
                try {
                    const storedProducts = JSON.parse(localStorage.getItem('products') || '[]');
                    const product = storedProducts.find(p => p.name === item.name);
                    if (product && (product.frontImage || product.image)) {
                        imageSrc = product.frontImage || product.image;
                    }
                } catch (e) {
                    console.warn('Error fetching stored product image', e);
                }
            }
            // Final fallback
            if (!imageSrc || !imageSrc.trim()) {
                imageSrc = 'img/home_kit_front.jpg.jpg';
            }

            return `
                <div class="cart-item" data-index="${index}">
                    <img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(item.name)}" onerror="this.src='img/home_kit_front.jpg.jpg';" style="width:100px;height:100px;object-fit:cover;border-radius:8px;">
                    <div class="item-details">
                        <h4>${escapeHtml(item.name)}${item.printing !== 'none' ? ` (${escapeHtml(item.printing === 'pre-printed' ? 'Pre-Printed' : 'Custom Print')})` : ''}</h4>
                        <p>Size: ${escapeHtml(item.size)}${customizationText ? ` | ${customizationText}` : ''}</p>
                    </div>
                    <div class="item-quantity">
                        <label>Qty:</label>
                        <input type="number" value="${item.quantity}" min="1" data-index="${index}" onchange="updateItemQuantity(${index}, this.value)">
                    </div>
                    <div class="item-subtotal" data-price="${item.price}">₹${(item.price * item.quantity).toLocaleString('en-IN')}</div>
                    <button class="remove-item" onclick="removeCartItem(${index})">×</button>
                </div>
            `;
        }).join('');

        updateCartTotal();
    }

    // Update item quantity
    window.updateItemQuantity = function(index, quantity) {
        const cart = getCart();
        if (cart[index]) {
            cart[index].quantity = parseInt(quantity) || 1;
            saveCart(cart);
            loadCart(); // Reload to update display
        }
    };

    // Remove item from cart
    window.removeCartItem = function(index) {
        // Remove immediately (no blocking confirmation) and show non-blocking feedback
        removeFromCart(index);
        loadCart(); // Reload to update display
        if (typeof showToast === 'function') {
            showToast('Item removed from cart', { duration: 3500, type: 'success' });
        } else {
            console.log('Item removed from cart');
        }
    };

    // Function to calculate and update the totals
    window.updateCartTotal = function() {
        let cart = getCart();
        
        // Filter out null/invalid items for calculation
        cart = cart.filter(item => item && item.price !== undefined && item.quantity !== undefined);
        
        let subtotal = 0;
        
        cart.forEach(item => {
            subtotal += (item.price || 0) * (item.quantity || 1);
        });

        // Update summary section
        const subtotalElement = document.getElementById('subtotal');
        const grandTotalElement = document.getElementById('grand-total');
        
        if (subtotalElement) {
            subtotalElement.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
        }
        
        if (grandTotalElement) {
            const grandTotal = subtotal + shippingCost;
            grandTotalElement.textContent = `₹${grandTotal.toLocaleString('en-IN')}`;
        }
    };

    // Initial load
    loadCart();
});