// ===========================================
// PRODUCT DETAIL PAGE JAVASCRIPT (product.js)
// Handles image switching and customization logic.
// ===========================================

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Image Switching Logic ---
    const mainImage = document.getElementById('main-product-image');
    const thumbnails = document.querySelectorAll('.thumbnail-selector .thumbnail');
    
    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', () => {
            // 1. Change the main image source
            mainImage.src = thumbnail.dataset.image;

            // 2. Update active class
            thumbnails.forEach(t => t.classList.remove('active'));
            thumbnail.classList.add('active');

            // 3. Update Customization Display based on view
            updateCustomizationOverlay(thumbnail.dataset.view === 'back');
        });
    });

    // --- Customization Logic ---
    const radioButtons = document.querySelectorAll('input[name="customization"]');
    const prePrintedSelector = document.getElementById('pre-printed-selector');
    const playerSelect = document.getElementById('player-select');
    const customInputs = document.getElementById('custom-inputs');
    const customNameInput = document.getElementById('custom-name-input');
    const customNumberInput = document.getElementById('custom-number-input');

    // Display elements for the jersey overlay
    const jerseyNameDisplay = document.getElementById('jersey-name-display');
    const jerseyNumberDisplay = document.getElementById('jersey-number-display');
    const customOverlay = document.querySelector('.custom-overlay');

    function updateCustomizationDisplay() {
        const selectedOption = document.querySelector('input[name="customization"]:checked').value;
        let name = '';
        let number = '';

        // Hide both sections first
        prePrintedSelector.style.display = 'none';
        customInputs.style.display = 'none';

        if (selectedOption === 'Pre-Printed') {
            prePrintedSelector.style.display = 'block';
            const selectedPlayer = playerSelect.value;
            if (selectedPlayer) {
                [name, number] = selectedPlayer.split('-');
            }
        } else if (selectedOption === 'Custom') {
            customInputs.style.display = 'block';
            name = customNameInput.value;
            number = customNumberInput.value;
        }

        // Apply to the overlay (only if back view is selected)
        jerseyNameDisplay.textContent = name.toUpperCase();
        jerseyNumberDisplay.textContent = number;
    }
    
    // Function to hide/show the overlay based on which view is active
    function updateCustomizationOverlay(isBackView) {
        // Only show overlay if the back view is currently visible AND a customization option is selected
        const selectedOption = document.querySelector('input[name="customization"]:checked').value;
        
        if (isBackView && selectedOption !== 'None') {
            customOverlay.style.display = 'flex';
        } else {
            customOverlay.style.display = 'none';
        }
        updateCustomizationDisplay(); // Update display content
    }


    // Event listeners for radio buttons and inputs
    radioButtons.forEach(radio => radio.addEventListener('change', updateCustomizationDisplay));
    playerSelect.addEventListener('change', updateCustomizationDisplay);
    customNameInput.addEventListener('input', updateCustomizationDisplay);
    customNumberInput.addEventListener('input', updateCustomizationDisplay);

    // Initial call to set up the default view
    updateCustomizationOverlay(false); // Start by assuming front view is active

    // --- Form Submission (Simulated) ---
    document.getElementById('product-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const message = 'Item added to cart! Customization: ' + (jerseyNameDisplay.textContent || 'None');
        if (typeof showToast === 'function') {
            showToast(message, { duration: 2000, type: 'success' });
        } else {
            console.log(message);
        }
        // In a real application, you would send this data to a server.
    });

});