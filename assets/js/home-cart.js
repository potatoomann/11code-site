// ===========================================
// HOME PAGE CART FUNCTIONALITY
// Quick add-to-cart for featured products on index.html
// ===========================================

document.addEventListener('DOMContentLoaded', () => {
  const PRODUCTS = {
    '001': { name: "Yamal's Kit", price: 750, image: 'img/home_kit_front.jpg.jpg' },
    '002': { name: "Retro Barcelona 06 Home", price: 899, image: 'img/retro_jersey_front.jpg.jpg' },
    '004': { name: 'Retro Classic Jersey', price: 699, image: 'img/minimal_training.jpg.jpg' },
  };

  const idByIndex = ['001', '002', '004'];

  document.querySelectorAll('main .product-grid .product-card').forEach((card, index) => {
    const btn = card.querySelector('.add-to-cart');
    if (!btn) return;

    const productId = idByIndex[index] || '001';
    const product = PRODUCTS[productId] || PRODUCTS['001'];

    btn.addEventListener('click', (e) => {
      e.preventDefault();

      const cartItem = {
        id: productId,
        name: product.name,
        image: product.image,
        size: 'M',
        printing: 'none',
        customization: '',
        price: product.price,
        quantity: 1,
      };

      if (typeof addToCart === 'function') {
        addToCart(cartItem);
        if (typeof showAddToCartToast === 'function') {
          showAddToCartToast(cartItem);
        } else if (typeof showToast === 'function') {
          showToast(`${product.name} added to cart!`, { duration: 2000, type: 'success' });
        }
      }
    });
  });
});


