// ===========================================
// SHOP PAGE JAVASCRIPT (shop.js)
// Handles product filtering based on search input.
// ===========================================

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const productCards = document.querySelectorAll('#product-grid .product-card');

    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();

        productCards.forEach(card => {
            const titleElement = card.querySelector('h3');
            const productTitle = titleElement ? titleElement.textContent.toLowerCase() : '';

            // Check if the product title contains the search term
            if (productTitle.includes(searchTerm)) {
                card.style.display = 'block'; // Show the card
            } else {
                card.style.display = 'none'; // Hide the card
            }
        });
    });
});