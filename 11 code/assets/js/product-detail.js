// ===========================================
// PRODUCT DETAIL PAGE JAVASCRIPT (product-detail.js)
// Handles dynamic product data, image switching and Add to Cart.
// ===========================================

document.addEventListener('DOMContentLoaded', () => {
  // Product catalog (kept in sync with shop-cart.js)
  const PRODUCTS = {
    '001': {
      id: '001',
      name: "Yamal's Kit",
      price: 750,
      description:
        'Official 2025/26 Home Kit. Crafted from lightweight, breathable, and sustainable recycled polyester. Perfect for the pitch or the streets.',
      images: {
        front: 'img/home_kit_front.jpg.jpg',
        back: 'img/home_kit_back.jpg.png',
      },
    },
    '002': {
      id: '002',
      name: "Retro Barcelona 06 Home",
      price: 899,
      description:
        'Iconic 2005/06 retro home kit. Throwback colors, modern fabric. Built for collectors and matchdays.',
      images: {
        front: 'img/retro_jersey_front.jpg.jpg',
        back: 'img/retro_jersey_back.png.png',
      },
    },
    '004': {
      id: '004',
      name: 'Retro Classic Jersey',
      price: 699,
      description:
        'Minimal, timeless training-inspired classic with a clean silhouette and soft-touch fabric.',
      images: {
        front: 'img/minimal_training.jpg.jpg',
        back: null,
      },
    },
    '007': {
      id: '007',
      name: 'AC Milan 2007 Kaka Kit',
      price: 1199,
      description:
        'Legendary 2007 final inspired kit – AC Milan colors with premium stitching and match-fit feel.',
      images: {
        front: 'img/ac_milan_2007.jpg.jpg',
        back: 'img/ac_milan_2007_back.jpg.png',
      },
    },
  };

  // --- Helper to read product id from URL ---
  const url = new URL(window.location.href);
  const productId = url.searchParams.get('id') || '001';
  const product = PRODUCTS[productId] || PRODUCTS['001'];

  // --- DOM references ---
  const titleEl = document.querySelector('.product-details h2');
  const descEl = document.querySelector('.product-details p');
  const priceEl = document.querySelector('.product-details .detail-price');
  const mainImage = document.getElementById('product-main-image');
  const thumbnailContainer = document.querySelector('.thumbnail-selector');
  const sizeSelect = document.getElementById('size');
  const form = document.getElementById('product-form');

  // Guard: if key elements are missing, do nothing
  if (!mainImage || !thumbnailContainer || !form) {
    return;
  }

  // --- Populate product content ---
  if (titleEl) titleEl.textContent = product.name;
  if (descEl) descEl.textContent = product.description;
  if (priceEl) priceEl.textContent = `₹${product.price.toLocaleString('en-IN')}`;

  // Set initial main image
  mainImage.src = product.images.front;
  mainImage.alt = `${product.name} - Front view`;

  // Build thumbnails based on available images
  thumbnailContainer.innerHTML = '';
  const thumbs = [];

  function createThumb(src, view, isActive) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = `${product.name} - ${view} view`;
    img.className = 'thumbnail' + (isActive ? ' active' : '');
    img.dataset.view = view;
    img.loading = 'lazy';
    thumbnailContainer.appendChild(img);
    thumbs.push(img);
  }

  createThumb(product.images.front, 'front', true);
  if (product.images.back) {
    createThumb(product.images.back, 'back', false);
  }

  // Image switching
  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      thumbs.forEach((t) => t.classList.remove('active'));
      thumb.classList.add('active');

      mainImage.src = thumb.src;
      mainImage.alt = thumb.alt;
    });
  });

  // --- Add to Cart from detail page ---
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const size = sizeSelect ? sizeSelect.value : '';
    if (!size) {
      if (typeof showToast === 'function') {
        showToast('Please select a size before adding to cart.', {
          duration: 2200,
          type: 'default',
        });
      }
      sizeSelect && sizeSelect.focus();
      return;
    }

    const cartItem = {
      id: product.id,
      name: product.name,
      image: mainImage.src,
      size,
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
        showToast(`${product.name} added to cart!`, { duration: 2200, type: 'success' });
      }
    } else {
      // Fallback: store minimal cart manually
      try {
        const existing = JSON.parse(localStorage.getItem('cart') || '[]');
        existing.push(cartItem);
        localStorage.setItem('cart', JSON.stringify(existing));
      } catch (err) {
        console.error('Failed to add to cart from product detail', err);
      }
    }
  });
});


