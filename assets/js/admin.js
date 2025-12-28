// admin.js — basic admin dashboard logic

document.addEventListener('DOMContentLoaded', () => {
    const totalProductsEl = document.getElementById('total-products');
    const cartCountEl = document.getElementById('cart-count');
    const cartTotalEl = document.getElementById('cart-total');
    const eventsCountEl = document.getElementById('events-count');
    const eventsTableBody = document.querySelector('#events-table tbody');

    async function countProductsFromShop() {
        try {
            // Count stored products from localStorage
            const storedProducts = JSON.parse(localStorage.getItem('products') || '[]');
            const storedCount = storedProducts.length;
            
            // Also count hardcoded products from shop.html
            const res = await fetch('../shop.html');
            const text = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const hardcodedCards = doc.querySelectorAll('#product-grid .product-card');
            
            // Total = stored + hardcoded (but stored products replace them, so just return stored count if it exists)
            return storedCount > 0 ? storedCount : hardcodedCards.length;
        } catch (e) {
            console.warn('Cannot fetch shop.html to count products', e);
            // Fallback to localStorage count
            try {
                const storedProducts = JSON.parse(localStorage.getItem('products') || '[]');
                return storedProducts.length;
            } catch {
                return null;
            }
        }
    }

    function getEvents() {
        try {
            return JSON.parse(localStorage.getItem('events') || '[]');
        } catch (e) {
            return [];
        }
    }

    function renderEvents() {
        const events = getEvents().slice().reverse(); // newest first
        eventsCountEl.textContent = events.length;
        eventsTableBody.innerHTML = '';
        if (!events.length) {
            eventsTableBody.innerHTML = '<tr><td colspan="3" class="muted">No events yet.</td></tr>';
            return;
        }
        events.slice(0, 50).forEach(ev => {
            const tr = document.createElement('tr');
            const time = new Date(ev.timestamp).toLocaleString();
            const type = ev.type;
            const data = (typeof ev.data === 'object') ? JSON.stringify(ev.data) : String(ev.data);
            tr.innerHTML = `<td>${time}</td><td>${type}</td><td><code>${escapeHtml(data)}</code></td>`;
            eventsTableBody.appendChild(tr);
        });
        // Update charts after rendering events
        updateCharts(events);
    }

    function updateCartMetrics() {
        const cart = getCart();
        cartCountEl.textContent = cart.length;
        cartTotalEl.textContent = 'Total: ₹' + getCartTotal().toFixed(2);
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, (s) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;' })[s]);
    }

    document.getElementById('refresh').addEventListener('click', async () => {
        await refreshEverything();
        updateStorageMetrics();
    });

    document.getElementById('clear-events').addEventListener('click', () => {
        localStorage.removeItem('events');
        renderEvents();
    });

    document.getElementById('clear-cart').addEventListener('click', () => {
        clearCart();
        updateCartMetrics();
    });

    // Storage diagnostics
    const storageUsageEl = document.getElementById('storage-usage');
    const storageSubEl = document.getElementById('storage-sub');
    const checkStorageBtn = document.getElementById('check-storage');

    function getStorageSize() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        return total;
    }

    function updateStorageMetrics() {
        try {
            const size = getStorageSize();
            const sizeKB = (size / 1024).toFixed(2);
            const sizeMB = (size / 1024 / 1024).toFixed(2);
            
            // Estimate available (typically 5-10MB per domain)
            const estimatedLimit = 5 * 1024 * 1024; // 5MB
            const usagePercent = Math.round((size / estimatedLimit) * 100);
            
            storageUsageEl.textContent = sizeMB < 1 ? sizeKB + ' KB' : sizeMB + ' MB';
            storageSubEl.textContent = `${usagePercent}% of ~5MB limit`;
            
            if (usagePercent > 80) {
                storageSubEl.style.color = '#e5152b'; // Red warning
            } else if (usagePercent > 50) {
                storageSubEl.style.color = '#f39c12'; // Orange warning
            } else {
                storageSubEl.style.color = 'var(--muted)'; // Normal
            }
        } catch (e) {
            console.error('Error calculating storage:', e);
            storageUsageEl.textContent = '—';
            storageSubEl.textContent = 'Error reading storage';
        }
    }

    if (checkStorageBtn) {
        checkStorageBtn.addEventListener('click', () => {
            updateStorageMetrics();
            console.log('Storage breakdown:', {
                products: (localStorage.getItem('products')?.length || 0) + ' bytes',
                events: (localStorage.getItem('events')?.length || 0) + ' bytes',
                cart: (localStorage.getItem('cart')?.length || 0) + ' bytes',
                total: getStorageSize() + ' bytes'
            });
        });
    }

    async function refreshEverything() {
        const productCount = await countProductsFromShop();
        totalProductsEl.textContent = productCount === null ? '—' : productCount;
        updateCartMetrics();
        renderEvents();
    }

    // Single sales chart (product sales over last 7 days)
    let salesChart = null;

    function createCharts() {
        try {
            const canvas = document.getElementById('sales-7d-chart');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            salesChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: []
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            stacked: true,
                            ticks: { font: { size: 10 } }
                        },
                        y: {
                            stacked: true,
                            beginAtZero: true,
                            title: { display: true, text: 'Adds (sales)' },
                            ticks: { font: { size: 10 }, stepSize: 1 }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { font: { size: 10 } }
                        }
                    }
                }
            });
        } catch (e) {
            console.warn('Charts not available', e);
        }
    }

    function updateCharts(events) {
        if (!salesChart) return;

        // Prepare last 7 days labels
        const days = [];
        const dayKeyToIndex = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const label = d.toLocaleDateString();
            days.push(label);
            dayKeyToIndex[label] = days.length - 1;
        }

        // Build per-product, per-day counts from add_to_cart events
        const seriesMap = {};
        events.forEach(ev => {
            if (ev.type !== 'add_to_cart' || !ev.data) return;
            const item = ev.data;
            const name = item.name || item.title || item.id || (typeof item === 'string' ? item : 'Unknown');
            const dayKey = new Date(ev.timestamp).toLocaleDateString();
            const idx = dayKeyToIndex[dayKey];
            if (idx === undefined) return; // outside 7‑day window

            if (!seriesMap[name]) {
                seriesMap[name] = new Array(days.length).fill(0);
            }
            seriesMap[name][idx] += 1;
        });

        // Sort products by total and keep top 4, group rest into "Other"
        const entries = Object.entries(seriesMap);
        entries.sort((a, b) => {
            const sum = (arr) => arr.reduce((t, v) => t + v, 0);
            return sum(b[1]) - sum(a[1]);
        });

        const top = entries.slice(0, 4);
        const others = entries.slice(4);

        if (others.length) {
            const agg = new Array(days.length).fill(0);
            others.forEach(([, arr]) => {
                arr.forEach((v, i) => (agg[i] += v));
            });
            top.push(['Other', agg]);
        }

        const palette = [
            'rgba(229,21,43,0.9)',
            'rgba(0,123,255,0.9)',
            'rgba(46,204,113,0.9)',
            'rgba(155,89,182,0.9)',
            'rgba(241,196,15,0.9)'
        ];

        salesChart.data.labels = days;
        salesChart.data.datasets = top.map(([name, data], i) => ({
            label: name,
            data,
            backgroundColor: palette[i % palette.length]
        }));
        salesChart.update();
    }

    // Initial load
    createCharts();
    refreshEverything();
    updateStorageMetrics();

    // Render stored products preview in admin
    function renderStoredProductsPreview() {
        const container = document.getElementById('admin-products-list');
        if (!container) return;
        container.innerHTML = '';
        const stored = JSON.parse(localStorage.getItem('products') || '[]');
        stored.forEach(p => {
            const card = document.createElement('div');
            card.style.background = 'rgba(255,255,255,0.02)';
            card.style.padding = '12px';
            card.style.borderRadius = '10px';
            card.style.minHeight = '140px';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.gap = '8px';

            const img = document.createElement('img');
            img.src = p.frontImage || 'img/placeholder.jpg';
            img.style.width = '100%';
            img.style.height = '120px';
            img.style.objectFit = 'cover';
            img.onerror = () => { img.src = 'img/placeholder.jpg'; };

            const title = document.createElement('div');
            title.textContent = p.name;
            title.style.fontWeight = '700';
            title.style.marginTop = '6px';

            const meta = document.createElement('div');
            meta.textContent = `₹${p.price} ${p.outOfStock ? '· OUT' : ''}`;
            meta.style.color = 'var(--muted)';

            card.appendChild(img);
            card.appendChild(title);
            card.appendChild(meta);
            container.appendChild(card);
        });
    }

    // Render preview on load and when storage changes
    renderStoredProductsPreview();
    window.addEventListener('storage', (e) => {
        if (e.key === 'products') renderStoredProductsPreview();
    });

    // Also refresh metrics when storage changes (other tabs)
    window.addEventListener('storage', (e) => {
        if (e.key === 'cart' || e.key === 'events') {
            updateCartMetrics();
            renderEvents();
        }
    });

    // ===========================================
    // ADD PRODUCT FUNCTIONALITY
    // ===========================================
    const addProductForm = document.getElementById('add-product-form');
    const resetFormBtn = document.getElementById('reset-form');
    const formMessage = document.getElementById('product-form-message');

    function showFormMessage(message, type = 'success') {
        formMessage.textContent = message;
        formMessage.className = `form-message ${type}`;
        formMessage.style.display = 'block';
        setTimeout(() => {
            formMessage.style.display = 'none';
        }, 5000);
    }

    if (addProductForm) {
        addProductForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const frontImageInput = document.getElementById('product-front-image');
            const backImageInput = document.getElementById('product-back-image');

            // Validation
            const id = document.getElementById('product-id').value.trim();
            const name = document.getElementById('product-name').value.trim();
            const price = parseFloat(document.getElementById('product-price').value);
            const description = document.getElementById('product-description').value.trim() || '';

            if (!id || !name || !price || !frontImageInput.files.length) {
                showFormMessage('Please fill in all required fields and select a front image.', 'error');
                return;
            }

            if (isNaN(price) || price <= 0) {
                showFormMessage('Please enter a valid price.', 'error');
                return;
            }

            try {
                // Get file information (size validation)
                const frontImageFile = frontImageInput.files[0];
                
                // Validate file sizes (max 5MB per image)
                const maxSize = 5 * 1024 * 1024; // 5MB
                if (frontImageFile.size > maxSize) {
                    showFormMessage('Front image is too large. Max 5MB allowed.', 'error');
                    return;
                }

                let backImageFile = null;
                if (backImageInput.files && backImageInput.files.length > 0) {
                    backImageFile = backImageInput.files[0];
                    if (backImageFile.size > maxSize) {
                        showFormMessage('Back image is too large. Max 5MB allowed.', 'error');
                        return;
                    }
                }

                // Convert images to base64
                const frontImageBase64 = await fileToBase64(frontImageFile);
                let backImageBase64 = null;
                if (backImageFile) {
                    backImageBase64 = await fileToBase64(backImageFile);
                }

                const productData = {
                    id,
                    name,
                    price,
                    description,
                    frontImage: frontImageBase64,
                    backImage: backImageBase64 || null,
                    outOfStock: !!document.getElementById('out-of-stock').checked,
                    createdAt: new Date().toISOString(),
                    addedBy: 'admin'
                };

                // Store in localStorage
                let products = JSON.parse(localStorage.getItem('products') || '[]');
                
                // Check if product ID already exists
                if (products.some(p => p.id === id)) {
                    showFormMessage(`Product with ID "${id}" already exists.`, 'error');
                    return;
                }

                products.push(productData);
                
                // Try to save and check for quota exceeded
                try {
                    const productsJson = JSON.stringify(products);
                    localStorage.setItem('products', productsJson);
                    
                    // Log storage size for debugging
                    const storageSize = new Blob([productsJson]).size;
                    console.log('Storage size after adding product:', (storageSize / 1024).toFixed(2), 'KB');
                    
                    if (storageSize > 4 * 1024 * 1024) { // 4MB warning threshold
                        console.warn('Warning: localStorage usage is high (>4MB). Consider reducing image sizes.');
                    }
                } catch (e) {
                    if (e.name === 'QuotaExceededError' || e.code === 22) {
                        showFormMessage('Storage quota exceeded. Try reducing image size or clearing old products.', 'error');
                        return;
                    }
                    throw e;
                }

                // Log event
                const event = {
                    timestamp: new Date().toISOString(),
                    type: 'Product Added',
                    data: `${name} (ID: ${id})`
                };
                let events = JSON.parse(localStorage.getItem('events') || '[]');
                events.push(event);
                localStorage.setItem('events', JSON.stringify(events));

                showFormMessage(`✓ Product "${name}" added successfully!`, 'success');
                addProductForm.reset();
                document.getElementById('frontImageName').style.display = 'none';
                document.getElementById('backImageName').style.display = 'none';
                
                // Refresh dashboard
                await refreshEverything();

                // Redirect after 1.5 seconds
                setTimeout(() => {
                    window.location.href = '../shop.html';
                }, 1500);
            } catch (error) {
                console.error('Error adding product:', error);
                showFormMessage(`Error: ${error.message || 'Please try again.'}`, 'error');
            }
        });
    }

    // Helper function to compress and convert image to base64
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Compress image before returning
                compressImage(reader.result, file.type, (compressedData) => {
                    resolve(compressedData);
                });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Helper function to compress image
    function compressImage(dataUrl, fileType, callback) {
        const img = new Image();
        img.onload = () => {
            // Create canvas and draw image
            const canvas = document.createElement('canvas');
            
            // Calculate new dimensions (max 1200px)
            let { width, height } = img;
            const maxSize = 1200;
            if (width > height) {
                if (width > maxSize) {
                    height = Math.round((height * maxSize) / width);
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width = Math.round((width * maxSize) / height);
                    height = maxSize;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to base64 with quality compression
            let quality = 0.85; // Start with 85% quality
            let compressed = canvas.toDataURL('image/jpeg', quality);
            
            // If still too large, reduce quality further
            while (compressed.length > 1000000 && quality > 0.5) { // 1MB max
                quality -= 0.1;
                compressed = canvas.toDataURL('image/jpeg', quality);
            }
            
            console.debug('Image compressed: original type=' + fileType + ', new size=' + compressed.length + ' bytes');
            callback(compressed);
        };
        img.onerror = () => {
            console.warn('Failed to compress image, using original');
            callback(dataUrl);
        };
        img.src = dataUrl;
    }

    if (resetFormBtn) {
        resetFormBtn.addEventListener('click', () => {
            if (addProductForm) {
                addProductForm.reset();
                formMessage.style.display = 'none';
                document.getElementById('frontImageName').style.display = 'none';
                document.getElementById('backImageName').style.display = 'none';
            }
        });
    }

    // ===========================================
    // MANAGE PRODUCTS FUNCTIONALITY
    // ===========================================

    // Helper function to show messages
    function showManageMessage(messageEl, message, type = 'success') {
        messageEl.textContent = message;
        messageEl.className = `form-message ${type}`;
        messageEl.style.display = 'block';
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }

    // DELETE PRODUCT FUNCTIONALITY
    const deleteProductNameInput = document.getElementById('delete-product-name');
    const deleteSearchResults = document.getElementById('delete-search-results');
    const deleteProductBtn = document.getElementById('delete-product-btn');
    const deleteMessage = document.getElementById('delete-message');
    let selectedDeleteProduct = null;

    if (deleteProductNameInput) {
        deleteProductNameInput.addEventListener('input', () => {
            const searchTerm = deleteProductNameInput.value.trim().toLowerCase();
            deleteSearchResults.innerHTML = '';
            
            if (searchTerm.length === 0) {
                deleteProductBtn.disabled = true;
                selectedDeleteProduct = null;
                return;
            }

            const products = JSON.parse(localStorage.getItem('products') || '[]');
            const matches = products.filter(p => p.name.toLowerCase().includes(searchTerm));

            if (matches.length === 0) {
                deleteSearchResults.innerHTML = '<p style="color:#ff6b7a;font-size:0.9rem;">No products found</p>';
                deleteProductBtn.disabled = true;
                selectedDeleteProduct = null;
                return;
            }

            matches.forEach(product => {
                const div = document.createElement('div');
                div.style.cssText = 'padding:8px;background:rgba(255,255,255,0.05);border-radius:6px;margin-bottom:6px;cursor:pointer;border:1px solid transparent;transition:all 0.2s;';
                div.innerHTML = `
                    <strong style="color:#fff;">${escapeHtml(product.name)}</strong>
                    <div style="font-size:0.8rem;color:var(--muted);">ID: ${escapeHtml(product.id)} | Price: ₹${parseFloat(product.price || 0).toFixed(2)}</div>
                `;
                div.addEventListener('mouseover', () => {
                    div.style.background = 'rgba(229,21,43,0.2)';
                    div.style.borderColor = 'rgba(229,21,43,0.4)';
                });
                div.addEventListener('mouseout', () => {
                    div.style.background = 'rgba(255,255,255,0.05)';
                    div.style.borderColor = 'transparent';
                });
                div.addEventListener('click', () => {
                    selectedDeleteProduct = product;
                    deleteProductNameInput.value = product.name;
                    deleteSearchResults.innerHTML = '';
                    deleteProductBtn.disabled = false;
                });
                deleteSearchResults.appendChild(div);
            });
        });
    }

    if (deleteProductBtn) {
        deleteProductBtn.addEventListener('click', () => {
            if (!selectedDeleteProduct) {
                showManageMessage(deleteMessage, 'Please select a product first', 'error');
                return;
            }

            if (!confirm(`Are you sure you want to delete "${selectedDeleteProduct.name}"? This cannot be undone.`)) {
                return;
            }

            let products = JSON.parse(localStorage.getItem('products') || '[]');
            const initialCount = products.length;
            products = products.filter(p => p.id !== selectedDeleteProduct.id);

            if (products.length < initialCount) {
                localStorage.setItem('products', JSON.stringify(products));
                
                // Log event
                const event = {
                    timestamp: new Date().toISOString(),
                    type: 'Product Deleted',
                    data: `${selectedDeleteProduct.name} (ID: ${selectedDeleteProduct.id})`
                };
                let events = JSON.parse(localStorage.getItem('events') || '[]');
                events.push(event);
                localStorage.setItem('events', JSON.stringify(events));

                showManageMessage(deleteMessage, `✓ Product "${selectedDeleteProduct.name}" deleted successfully!`, 'success');
                deleteProductNameInput.value = '';
                deleteSearchResults.innerHTML = '';
                selectedDeleteProduct = null;
                deleteProductBtn.disabled = true;
                
                // Refresh dashboard
                refreshEverything();
                renderStoredProductsPreview();
            } else {
                showManageMessage(deleteMessage, 'Error: Product not found', 'error');
            }
        });
    }

    // MARK OUT OF STOCK / IN STOCK FUNCTIONALITY
    const stockProductNameInput = document.getElementById('stock-product-name');
    const stockSearchResults = document.getElementById('stock-search-results');
    const markOutOfStockBtn = document.getElementById('mark-out-of-stock');
    const markInStockBtn = document.getElementById('mark-in-stock');
    const stockMessage = document.getElementById('stock-message');
    let selectedStockProduct = null;

    if (stockProductNameInput) {
        stockProductNameInput.addEventListener('input', () => {
            const searchTerm = stockProductNameInput.value.trim().toLowerCase();
            stockSearchResults.innerHTML = '';
            
            if (searchTerm.length === 0) {
                markOutOfStockBtn.disabled = true;
                markInStockBtn.disabled = true;
                selectedStockProduct = null;
                return;
            }

            const products = JSON.parse(localStorage.getItem('products') || '[]');
            const matches = products.filter(p => p.name.toLowerCase().includes(searchTerm));

            if (matches.length === 0) {
                stockSearchResults.innerHTML = '<p style="color:#f39c12;font-size:0.9rem;">No products found</p>';
                markOutOfStockBtn.disabled = true;
                markInStockBtn.disabled = true;
                selectedStockProduct = null;
                return;
            }

            matches.forEach(product => {
                const div = document.createElement('div');
                const stockStatus = product.outOfStock ? '🔴 Out of Stock' : '🟢 In Stock';
                div.style.cssText = 'padding:8px;background:rgba(255,255,255,0.05);border-radius:6px;margin-bottom:6px;cursor:pointer;border:1px solid transparent;transition:all 0.2s;';
                div.innerHTML = `
                    <strong style="color:#fff;">${escapeHtml(product.name)}</strong>
                    <div style="font-size:0.8rem;color:var(--muted);">ID: ${escapeHtml(product.id)} | ${stockStatus}</div>
                `;
                div.addEventListener('mouseover', () => {
                    div.style.background = 'rgba(243,156,18,0.2)';
                    div.style.borderColor = 'rgba(243,156,18,0.4)';
                });
                div.addEventListener('mouseout', () => {
                    div.style.background = 'rgba(255,255,255,0.05)';
                    div.style.borderColor = 'transparent';
                });
                div.addEventListener('click', () => {
                    selectedStockProduct = product;
                    stockProductNameInput.value = product.name;
                    stockSearchResults.innerHTML = '';
                    markOutOfStockBtn.disabled = false;
                    markInStockBtn.disabled = false;
                });
                stockSearchResults.appendChild(div);
            });
        });
    }

    if (markOutOfStockBtn) {
        markOutOfStockBtn.addEventListener('click', () => {
            if (!selectedStockProduct) {
                showManageMessage(stockMessage, 'Please select a product first', 'error');
                return;
            }

            let products = JSON.parse(localStorage.getItem('products') || '[]');
            const product = products.find(p => p.id === selectedStockProduct.id);
            
            if (product) {
                product.outOfStock = true;
                localStorage.setItem('products', JSON.stringify(products));

                // Log event
                const event = {
                    timestamp: new Date().toISOString(),
                    type: 'Product Out of Stock',
                    data: `${product.name} (ID: ${product.id})`
                };
                let events = JSON.parse(localStorage.getItem('events') || '[]');
                events.push(event);
                localStorage.setItem('events', JSON.stringify(events));

                showManageMessage(stockMessage, `✓ "${product.name}" marked as out of stock!`, 'success');
                stockProductNameInput.value = '';
                stockSearchResults.innerHTML = '';
                selectedStockProduct = null;
                markOutOfStockBtn.disabled = true;
                markInStockBtn.disabled = true;
                
                refreshEverything();
                renderStoredProductsPreview();
            }
        });
    }

    if (markInStockBtn) {
        markInStockBtn.addEventListener('click', () => {
            if (!selectedStockProduct) {
                showManageMessage(stockMessage, 'Please select a product first', 'error');
                return;
            }

            let products = JSON.parse(localStorage.getItem('products') || '[]');
            const product = products.find(p => p.id === selectedStockProduct.id);
            
            if (product) {
                product.outOfStock = false;
                localStorage.setItem('products', JSON.stringify(products));

                // Log event
                const event = {
                    timestamp: new Date().toISOString(),
                    type: 'Product In Stock',
                    data: `${product.name} (ID: ${product.id})`
                };
                let events = JSON.parse(localStorage.getItem('events') || '[]');
                events.push(event);
                localStorage.setItem('events', JSON.stringify(events));

                showManageMessage(stockMessage, `✓ "${product.name}" marked as in stock!`, 'success');
                stockProductNameInput.value = '';
                stockSearchResults.innerHTML = '';
                selectedStockProduct = null;
                markOutOfStockBtn.disabled = true;
                markInStockBtn.disabled = true;
                
                refreshEverything();
                renderStoredProductsPreview();
            }
        });
    }

    // MARK SIZE UNAVAILABLE FUNCTIONALITY
    const sizeProductNameInput = document.getElementById('size-product-name');
    const sizeSearchResults = document.getElementById('size-search-results');
    const unavailableSizeInput = document.getElementById('unavailable-size');
    const markSizeUnavailableBtn = document.getElementById('mark-size-unavailable');
    const sizeMessage = document.getElementById('size-message');
    let selectedSizeProduct = null;

    if (sizeProductNameInput) {
        sizeProductNameInput.addEventListener('input', () => {
            const searchTerm = sizeProductNameInput.value.trim().toLowerCase();
            sizeSearchResults.innerHTML = '';
            
            if (searchTerm.length === 0) {
                markSizeUnavailableBtn.disabled = true;
                selectedSizeProduct = null;
                return;
            }

            const products = JSON.parse(localStorage.getItem('products') || '[]');
            const matches = products.filter(p => p.name.toLowerCase().includes(searchTerm));

            if (matches.length === 0) {
                sizeSearchResults.innerHTML = '<p style="color:#3498db;font-size:0.9rem;">No products found</p>';
                markSizeUnavailableBtn.disabled = true;
                selectedSizeProduct = null;
                return;
            }

            matches.forEach(product => {
                const div = document.createElement('div');
                const unavailableSizes = product.unavailableSizes ? product.unavailableSizes.join(', ') : 'None';
                div.style.cssText = 'padding:12px;background:rgba(255,255,255,0.05);border-radius:6px;margin-bottom:8px;cursor:pointer;border:1px solid transparent;transition:all 0.2s;';
                
                let sizeButtonsHtml = '';
                if (product.unavailableSizes && product.unavailableSizes.length > 0) {
                    sizeButtonsHtml = `
                        <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;">
                            ${product.unavailableSizes.map(size => `
                                <button class="restore-size-btn" data-product-id="${escapeHtml(product.id)}" data-size="${escapeHtml(size)}" style="padding:4px 10px;font-size:0.75rem;background:rgba(52,152,219,0.3);border:1px solid rgba(52,152,219,0.5);color:#3498db;border-radius:4px;cursor:pointer;transition:all 0.2s;">
                                    ${escapeHtml(size)} ×
                                </button>
                            `).join('')}
                        </div>
                    `;
                }
                
                div.innerHTML = `
                    <strong style="color:#fff;">${escapeHtml(product.name)}</strong>
                    <div style="font-size:0.8rem;color:var(--muted);">ID: ${escapeHtml(product.id)} | Unavailable: ${escapeHtml(unavailableSizes)}</div>
                    ${sizeButtonsHtml}
                `;
                div.addEventListener('mouseover', () => {
                    div.style.background = 'rgba(52,152,219,0.2)';
                    div.style.borderColor = 'rgba(52,152,219,0.4)';
                });
                div.addEventListener('mouseout', () => {
                    div.style.background = 'rgba(255,255,255,0.05)';
                    div.style.borderColor = 'transparent';
                });
                div.addEventListener('click', (evt) => {
                    // Ignore clicks on restore buttons
                    if (evt.target.classList.contains('restore-size-btn')) return;
                    
                    selectedSizeProduct = product;
                    sizeProductNameInput.value = product.name;
                    sizeSearchResults.innerHTML = '';
                    markSizeUnavailableBtn.disabled = false;
                });
                sizeSearchResults.appendChild(div);
            });
        });
    }

    if (markSizeUnavailableBtn) {
        markSizeUnavailableBtn.addEventListener('click', () => {
            if (!selectedSizeProduct) {
                showManageMessage(sizeMessage, 'Please select a product first', 'error');
                return;
            }

            const size = unavailableSizeInput.value.trim().toUpperCase();
            if (!size) {
                showManageMessage(sizeMessage, 'Please enter a size', 'error');
                return;
            }

            let products = JSON.parse(localStorage.getItem('products') || '[]');
            const product = products.find(p => p.id === selectedSizeProduct.id);
            
            if (product) {
                if (!product.unavailableSizes) {
                    product.unavailableSizes = [];
                }
                
                if (product.unavailableSizes.includes(size)) {
                    showManageMessage(sizeMessage, `Size ${size} is already marked as unavailable`, 'error');
                    return;
                }

                product.unavailableSizes.push(size);
                localStorage.setItem('products', JSON.stringify(products));

                // Log event
                const event = {
                    timestamp: new Date().toISOString(),
                    type: 'Size Marked Unavailable',
                    data: `${product.name} - Size ${size}`
                };
                let events = JSON.parse(localStorage.getItem('events') || '[]');
                events.push(event);
                localStorage.setItem('events', JSON.stringify(events));

                showManageMessage(sizeMessage, `✓ Size ${size} marked as unavailable for "${product.name}"!`, 'success');
                unavailableSizeInput.value = '';
                sizeProductNameInput.value = '';
                sizeSearchResults.innerHTML = '';
                selectedSizeProduct = null;
                markSizeUnavailableBtn.disabled = true;
                
                refreshEverything();
                renderStoredProductsPreview();
            }
        });
    }

    // RESTORE / REMOVE SIZE FROM UNAVAILABLE LIST
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('restore-size-btn')) {
            e.preventDefault();
            e.stopPropagation();
            
            const productId = e.target.dataset.productId;
            const size = e.target.dataset.size;
            
            let products = JSON.parse(localStorage.getItem('products') || '[]');
            const product = products.find(p => p.id === productId);
            
            if (product && product.unavailableSizes) {
                product.unavailableSizes = product.unavailableSizes.filter(s => s !== size);
                localStorage.setItem('products', JSON.stringify(products));
                
                // Log event
                const event = {
                    timestamp: new Date().toISOString(),
                    type: 'Size Restored',
                    data: `${product.name} - Size ${size} restored to available`
                };
                let events = JSON.parse(localStorage.getItem('events') || '[]');
                events.push(event);
                localStorage.setItem('events', JSON.stringify(events));
                
                showManageMessage(sizeMessage, `✓ Size ${size} restored for "${product.name}"!`, 'success');
                sizeProductNameInput.value = '';
                sizeSearchResults.innerHTML = '';
                selectedSizeProduct = null;
                markSizeUnavailableBtn.disabled = true;
                unavailableSizeInput.value = '';
                
                refreshEverything();
                renderStoredProductsPreview();
            }
        }
    }, true); // Use capture phase to intercept before parent

    // ===========================================
    // CONTACT DETAILS (ADMIN)
    // ===========================================
    const contactEmailInput = document.getElementById('contact-email');
    const contactPhoneInput = document.getElementById('contact-phone');
    const contactAddressInput = document.getElementById('contact-address');
    const saveContactBtn = document.getElementById('save-contact-btn');
    const contactMessage = document.getElementById('contact-message');

    function loadContactToForm() {
        try {
            const contact = JSON.parse(localStorage.getItem('siteContact') || '{}');
            if (contactEmailInput) contactEmailInput.value = contact.email || '';
            if (contactPhoneInput) contactPhoneInput.value = contact.phone || '';
            if (contactAddressInput) contactAddressInput.value = contact.address || '';
        } catch (e) {
            console.warn('Failed to load contact', e);
        }
    }

    function showContactMessage(msg, type = 'success') {
        if (!contactMessage) return;
        contactMessage.textContent = msg;
        contactMessage.className = `form-message ${type}`;
        contactMessage.style.display = 'block';
        setTimeout(() => contactMessage.style.display = 'none', 4000);
    }

    if (saveContactBtn) {
        saveContactBtn.addEventListener('click', () => {
            const email = contactEmailInput?.value.trim() || '';
            const phone = contactPhoneInput?.value.trim() || '';
            const address = contactAddressInput?.value.trim() || '';

            if (!email && !phone && !address) {
                showContactMessage('Please provide at least one contact detail.', 'error');
                return;
            }

            const siteContact = { email, phone, address };
            try {
                localStorage.setItem('siteContact', JSON.stringify(siteContact));

                // Log event
                const event = {
                    timestamp: new Date().toISOString(),
                    type: 'Contact Updated',
                    data: siteContact
                };
                let events = JSON.parse(localStorage.getItem('events') || '[]');
                events.push(event);
                localStorage.setItem('events', JSON.stringify(events));

                showContactMessage('✓ Contact details saved.', 'success');
                // Notify other tabs
                window.dispatchEvent(new Event('storage'));
            } catch (e) {
                console.error('Failed to save contact:', e);
                showContactMessage('Error saving contact.', 'error');
            }
        });
    }

    // Populate form on load
    loadContactToForm();
});