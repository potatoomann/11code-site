// ===========================================
// SHOP PAGE JAVASCRIPT (shop.js)
// Handles product filtering and dynamic product loading from localStorage.
// ===========================================

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const productGrid = document.getElementById('product-grid');

    if (!productGrid) return;

    // Load products from localStorage and render them
    function loadAndRenderProducts() {
        try {
            const storedProducts = JSON.parse(localStorage.getItem('products') || '[]');
            console.debug('shop.js: storedProducts count=', storedProducts.length);
            
            // Don't clear the grid - keep hardcoded products
            // Only append newly stored products
            if (storedProducts.length > 0) {
                // Create a container for newly added products at the beginning
                const existingCards = productGrid.querySelectorAll('.product-card');
                
                // Add stored products to the beginning
                storedProducts.forEach(product => {
                    // Check if product already exists in the grid to avoid duplicates
                    const exists = Array.from(existingCards).some(card => {
                        const titleEl = card.querySelector('h3');
                        return titleEl && titleEl.textContent === product.name;
                    });
                    console.debug('shop.js: product', product.id, 'name=', product.name, 'frontImageType=', typeof product.frontImage, 'len=', product.frontImage ? product.frontImage.length : 0);
                    
                    if (!exists) {
                        const card = createProductCard(product);
                        productGrid.insertBefore(card, productGrid.firstChild);
                    }
                });
            }
            
            // Attach event listeners to add-to-cart buttons
            attachCartListeners();
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    // Create a product card element
    function createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';

        const imageWrapper = document.createElement('div');
        imageWrapper.style.position = 'relative';

        const img = document.createElement('img');
        img.loading = 'lazy';
        img.alt = product.name || 'Product image';
        img.style.width = '100%';
        img.style.height = '220px';
        img.style.objectFit = 'cover';
        img.style.display = 'block';

        const imageSource = product.frontImage || 'img/placeholder.jpg';
        
        // Enhanced error handling for image loading
        let imageLoadAttempts = 0;
        const maxAttempts = 2;
        
        function loadImage(source) {
            try {
                // If it's a data URI (base64), use directly
                if (typeof source === 'string' && source.indexOf('data:') === 0) {
                    img.src = source;
                } else if (typeof source === 'string' && (source.startsWith('http') || source.startsWith('/'))) {
                    img.src = source;
                } else if (typeof source === 'string' && source.startsWith('img/')) {
                    // relative path from site root
                    img.src = source;
                } else if (typeof source === 'string' && source.length > 50 && source.indexOf('base64') !== -1) {
                    // probable base64 without data: prefix
                    img.src = 'data:image/jpeg;base64,' + source.split(',').pop();
                } else {
                    img.src = source || 'img/placeholder.jpg';
                }
            } catch (err) {
                console.error('Error setting product image src for', product.id, ':', err);
                img.src = 'img/placeholder.jpg';
            }
        }
        
        loadImage(imageSource);

        img.onerror = function (err) {
            imageLoadAttempts++;
            console.warn('Product image failed to load for', product.id, 'attempt:', imageLoadAttempts, 'src length:', imageSource?.length);
            
            if (imageLoadAttempts < maxAttempts && imageSource?.startsWith('data:')) {
                // If it's a data URI that failed, try with explicit JPEG prefix
                img.onerror = arguments.callee; // Re-assign to allow retry
                img.src = 'data:image/jpeg;base64,' + (imageSource.split(',')[1] || imageSource);
            } else {
                // Fall back to placeholder
                img.onerror = null;
                img.src = 'img/placeholder.jpg';
            }
        };

        imageWrapper.appendChild(img);

        const outOfStock = product.outOfStock === true;
        if (outOfStock) {
            const badge = document.createElement('span');
            badge.textContent = 'OUT OF STOCK';
            badge.style.position = 'absolute';
            badge.style.left = '12px';
            badge.style.top = '12px';
            badge.style.background = '#e5152b';
            badge.style.color = '#fff';
            badge.style.padding = '6px 10px';
            badge.style.borderRadius = '8px';
            badge.style.fontWeight = '700';
            badge.style.fontSize = '0.85rem';
            imageWrapper.appendChild(badge);
        }

        const info = document.createElement('div');
        info.className = 'product-info';

        const h3 = document.createElement('h3');
        h3.textContent = product.name;

        const price = document.createElement('p');
        price.className = 'price';
        price.textContent = '₹' + parseFloat(product.price).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

        const actions = document.createElement('div');
        actions.className = 'actions';

        const viewLink = document.createElement('a');
        viewLink.className = 'btn btn-secondary';
        viewLink.href = `product-detail.html?id=${product.id}`;
        viewLink.textContent = 'View Details';

        const addBtn = document.createElement('button');
        addBtn.className = 'btn btn-primary add-to-cart';
        addBtn.dataset.productId = product.id;
        addBtn.dataset.productName = product.name;
        addBtn.dataset.productPrice = product.price;
        addBtn.textContent = outOfStock ? 'Out of stock' : 'Add to Cart';
        if (outOfStock) addBtn.disabled = true;

        actions.appendChild(viewLink);
        actions.appendChild(addBtn);

        info.appendChild(h3);
        info.appendChild(price);
        info.appendChild(actions);

        card.appendChild(imageWrapper);
        card.appendChild(info);

        return card;
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    // Attach cart event listeners
    function attachCartListeners() {
        const addToCartButtons = document.querySelectorAll('.add-to-cart');
        addToCartButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (btn.disabled) return; // skip out-of-stock
                const productId = btn.getAttribute('data-product-id');
                const productName = btn.getAttribute('data-product-name');
                const productPrice = parseFloat(btn.getAttribute('data-product-price'));
                
                // Build cart item object to match global addToCart signature
                const item = { id: productId, name: productName, price: productPrice, quantity: 1 };
                if (typeof window.addToCart === 'function') {
                    // global function expects an item object
                    window.addToCart(item);
                } else {
                    // fallback to local addToCart implementation
                    addToCart(productId, productName, productPrice);
                }
            });
        });
    }

    // Add to cart function
    function addToCart(id, name, price) {
        try {
            let cart = JSON.parse(localStorage.getItem('cart') || '[]');
            
            const existingItem = cart.find(item => item.id === id);
            if (existingItem) {
                existingItem.qty += 1;
            } else {
                cart.push({ id, name, price, qty: 1 });
            }
            
            localStorage.setItem('cart', JSON.stringify(cart));
            
            // Log event
            const event = {
                timestamp: new Date().toISOString(),
                type: 'Add to Cart',
                data: `${name} (₹${price})`
            };
            let events = JSON.parse(localStorage.getItem('events') || '[]');
            events.push(event);
            localStorage.setItem('events', JSON.stringify(events));
            
            // Show success message
            showAddToCartNotification(name);
        } catch (error) {
            console.error('Error adding to cart:', error);
        }
    }

    // Show notification
    function showAddToCartNotification(productName) {
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = `✓ ${productName} added to cart`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 18px;
            background: #2ecc71;
            color: white;
            border-radius: 8px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(46, 204, 113, 0.3);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    // Add CSS animations if not present
    if (!document.getElementById('shop-animations')) {
        const style = document.createElement('style');
        style.id = 'shop-animations';
        style.textContent = `
            @keyframes slideIn {
                from { opacity: 0; transform: translateX(400px); }
                to { opacity: 1; transform: translateX(0); }
            }
            @keyframes slideOut {
                from { opacity: 1; transform: translateX(0); }
                to { opacity: 0; transform: translateX(400px); }
            }
        `;
        document.head.appendChild(style);
    }

    // Search filtering
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const productCards = document.querySelectorAll('#product-grid .product-card');

            productCards.forEach(card => {
                const titleElement = card.querySelector('h3');
                const productTitle = titleElement ? titleElement.textContent.toLowerCase() : '';

                if (productTitle.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // Load products on page load
    loadAndRenderProducts();
});