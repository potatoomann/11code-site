// admin.js — basic admin dashboard logic

document.addEventListener('DOMContentLoaded', () => {
    const totalProductsEl = document.getElementById('total-products');
    const cartCountEl = document.getElementById('cart-count');
    const cartTotalEl = document.getElementById('cart-total');
    const eventsCountEl = document.getElementById('events-count');
    const eventsTableBody = document.querySelector('#events-table tbody');

    async function countProductsFromShop() {
        try {
            const res = await fetch('shop.html');
            const text = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const cards = doc.querySelectorAll('.product-card');
            return cards.length;
        } catch (e) {
            console.warn('Cannot fetch shop.html to count products', e);
            return null;
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
    });

    document.getElementById('clear-events').addEventListener('click', () => {
        localStorage.removeItem('events');
        renderEvents();
    });

    document.getElementById('clear-cart').addEventListener('click', () => {
        clearCart();
        updateCartMetrics();
    });

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

    // Also refresh metrics when storage changes (other tabs)
    window.addEventListener('storage', (e) => {
        if (e.key === 'cart' || e.key === 'events') {
            updateCartMetrics();
            renderEvents();
        }
    });
});