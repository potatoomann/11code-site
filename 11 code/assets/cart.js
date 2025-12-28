// ===========================================
// CART PAGE JAVASCRIPT (cart.js)
// Handles cart display and management
// ===========================================

document.addEventListener('DOMContentLoaded', () => {
    const shippingCost = 60;
    const cartItemsContainer = document.getElementById('cart-items-container');
    
    // Load cart from localStorage
    function loadCart() {
        const cart = getCart();
        
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
                customizationText = `Player: ${item.customization}`;
            } else if (item.printing === 'custom') {
                const [name, number] = item.customization.split(' ');
                customizationText = `Name: ${name} | Number: ${number}`;
            }

            return `
                <div class="cart-item" data-index="${index}">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="item-details">
                        <h4>${item.name}${item.printing !== 'none' ? ` (${item.printing === 'pre-printed' ? 'Pre-Printed' : 'Custom Print'})` : ''}</h4>
                        <p>Size: ${item.size}${customizationText ? ` | ${customizationText}` : ''}</p>
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
        const cart = getCart();
        let subtotal = 0;
        
        cart.forEach(item => {
            subtotal += item.price * item.quantity;
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