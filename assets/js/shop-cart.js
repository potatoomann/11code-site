// ===========================================
// SHOP/INDEX PAGE CART FUNCTIONALITY
// Handles Add to Cart from product cards
// ===========================================

document.addEventListener('DOMContentLoaded', () => {
    // Product data mapping (matching product-detail.js)
    const PRODUCTS = {
        '001': { name: "Yamal's Kit", price: 750, image: 'img/home_kit_front.jpg.jpg' },
        '002': { name: "Retro Barcelona '06 Home", price: 899, image: 'img/retro_jersey_front.jpg.jpg' },
        '004': { name: 'Retro Classic Jersey', price: 699, image: 'img/minimal_training.jpg.jpg' },
        '007': { name: 'AC Milan 2007 Kaka Kit', price: 1199, image: 'img/ac_milan_2007.jpg.jpg' }
    };

    // Handle Add to Cart buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            const productCard = button.closest('.product-card');
            const productLink = productCard.querySelector('a[href*="product-detail.html"]');
            
            if (productLink) {
                const url = new URL(productLink.href, window.location.origin);
                const productId = url.searchParams.get('id') || '001';
                const product = PRODUCTS[productId] || PRODUCTS['001'];
                
                // For quick add, use default values
                const cartItem = {
                    id: productId,
                    name: product.name,
                    image: product.image,
                    size: 'M', // Default size
                    printing: 'none',
                    customization: '',
                    price: product.price,
                    quantity: 1
                };

                if (typeof addToCart === 'function') {
                    addToCart(cartItem);
                    // animated confirmation overlay
                    if (typeof showAddToCartToast === 'function') showAddToCartToast(cartItem);
                    else if (typeof showToast === 'function') showToast(`${product.name} added to cart!`, { duration: 2000, type: 'success' });
                } else {
                    // Redirect to product detail page for customization
                    window.location.href = productLink.href;
                }
            }
        });
    });
});
