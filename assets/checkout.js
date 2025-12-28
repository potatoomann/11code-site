// ===========================================
// CHECKOUT PAGE JAVASCRIPT (checkout.js)
// Handles basic form validation before proceeding to confirmation.
// ===========================================

(function(){

const SHIPPING_COST = 60; // updated shipping charge

function formatINR(n){
    return `₹${n.toLocaleString('en-IN')}`;
}

// Save order to user's order history
function saveOrderToUserHistory(order){
    try {
        const loggedInUser = localStorage.getItem('loggedInUser');
        if (!loggedInUser) return;

        const user = JSON.parse(loggedInUser);
        if (!user || !user.email) return;

        // Get or create orders array
        let orders = JSON.parse(localStorage.getItem('userOrders') || '{}');
        if (!orders[user.email]) {
            orders[user.email] = [];
        }
        
        // Add order to user's order history
        orders[user.email].unshift(order); // Add to beginning (newest first)
        
        // Keep only last 50 orders per user
        if (orders[user.email].length > 50) {
            orders[user.email] = orders[user.email].slice(0, 50);
        }
        
        localStorage.setItem('userOrders', JSON.stringify(orders));
    } catch (e) {
        console.warn('Failed to save order to history:', e);
    }
}

// Save shipping address to user profile after first purchase
function saveShippingAddressToProfile(){
    try {
        const loggedInUser = localStorage.getItem('loggedInUser');
        if (!loggedInUser) return; // User not logged in, skip saving

        const user = JSON.parse(loggedInUser);
        if (!user || !user.email) return;

        // Get shipping form data
        const shippingForm = document.getElementById('shipping-form');
        if (!shippingForm) return;

        const fullName = document.getElementById('full-name')?.value?.trim();
        const email = document.getElementById('email')?.value?.trim();
        const address = document.getElementById('address')?.value?.trim();
        const city = document.getElementById('city')?.value?.trim();
        const state = document.getElementById('state')?.value?.trim();
        const zip = document.getElementById('zip')?.value?.trim();
        const country = document.getElementById('country')?.value?.trim();
        const phone = document.getElementById('phone')?.value?.trim() || null;

        if (!fullName || !address || !city || !state || !zip || !country) return;

        // Create shipping address object
        const shippingAddress = {
            fullName,
            email: email || user.email,
            address,
            city,
            state,
            zip,
            country,
            phone: phone || user.phone || null
        };

        // Update user object
        user.shippingAddress = shippingAddress;
        if (phone) user.phone = phone;

        // Update logged in user
        localStorage.setItem('loggedInUser', JSON.stringify(user));

        // Update users array
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.email === user.email);
        if (userIndex !== -1) {
            users[userIndex].shippingAddress = shippingAddress;
            if (phone) users[userIndex].phone = phone;
            localStorage.setItem('users', JSON.stringify(users));
        }
    } catch (e) {
        console.warn('Failed to save shipping address to profile:', e);
        // Silently fail - don't interrupt checkout flow
    }
}

function updateOrderSummary(){
    const subtotal = getCartTotal();
    const shipping = SHIPPING_COST;
    const total = subtotal + shipping;
    const subEl = document.getElementById('checkout-subtotal');
    const shipEl = document.getElementById('checkout-shipping');
    const totEl = document.getElementById('checkout-total');
    if(subEl) subEl.textContent = formatINR(subtotal);
    if(shipEl) shipEl.textContent = formatINR(shipping);
    if(totEl) totEl.textContent = formatINR(total);
}

function getOrderAmounts(){
    const subtotal = getCartTotal();
    const shipping = SHIPPING_COST;
    const total = subtotal + shipping;
    return { subtotal, shipping, total };
}

// Simple token generator to simulate secure payment tokenization
function generatePaymentToken(){
    // do not include any sensitive user data in localStorage
    return 'tok_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Basic Luhn check for card number
function luhnCheck(num){
    const arr = (num + '').split('').reverse().map(x=>parseInt(x,10));
    let sum = 0;
    for(let i=0;i<arr.length;i++){
        let val = arr[i];
        if(i % 2 === 1){
            val *= 2;
            if(val > 9) val -= 9;
        }
        sum += val;
    }
    return sum % 10 === 0;
}

window.validateCheckoutForms = function(){
    const shippingForm = document.getElementById('shipping-form');
    if(!shippingForm.checkValidity()){
        shippingForm.reportValidity();
        return false;
    }

    const method = document.querySelector('input[name="payment-method"]:checked').value;

    if(method === 'card'){
        const cardNumberRaw = document.getElementById('card-number').value.replace(/\s/g,'');
        const cvv = document.getElementById('cvv').value;
        const expiry = document.getElementById('expiry-date').value;
        const name = document.getElementById('card-name').value.trim();

        if(name.length < 2){
            const el = document.getElementById('card-name');
            highlightInvalid(el);
            if (typeof showToast === 'function') { showToast('Please enter card holder name', { duration: 2500, type: 'error' }); }
            else { console.error('Please enter card holder name'); }
            return false;
        }
        if(cardNumberRaw.length < 13 || cardNumberRaw.length > 19 || !/^[0-9]+$/.test(cardNumberRaw) || !luhnCheck(cardNumberRaw)){
            const el = document.getElementById('card-number');
            highlightInvalid(el);
            if (typeof showToast === 'function') { showToast('Please enter a valid card number', { duration: 2500, type: 'error' }); }
            else { console.error('Please enter a valid card number'); }
            return false;
        }
        if(!/^(0[1-9]|1[0-2])\/(?:\d{2})$/.test(expiry)){
            const el = document.getElementById('expiry-date');
            highlightInvalid(el);
            if (typeof showToast === 'function') { showToast('Please enter expiry in MM/YY', { duration: 2500, type: 'error' }); }
            else { console.error('Please enter expiry in MM/YY'); }
            return false;
        }
        if(!/^[0-9]{3,4}$/.test(cvv)){
            const el = document.getElementById('cvv');
            highlightInvalid(el);
            if (typeof showToast === 'function') { showToast('Please enter a valid CVV', { duration: 2500, type: 'error' }); }
            else { console.error('Please enter a valid CVV'); }
            return false;
        }

        // Tokenize card (simulate) and clear sensitive fields immediately
        const token = generatePaymentToken();
        // Here we would send token to the server for real processing
        // Clear sensitive data from inputs
        document.getElementById('card-number').value = '';
        document.getElementById('cvv').value = '';
        document.getElementById('expiry-date').value = '';
        // store token temporarily (not persisted)
        window.__lastPaymentToken = token;

        return true;
    }
    else if(method === 'upi'){
        const upi = document.getElementById('upi-id').value.trim();
        if(!upi || !/@/.test(upi)){
            const el = document.getElementById('upi-id');
            highlightInvalid(el);
            if (typeof showToast === 'function') { showToast('Please enter a valid UPI ID', { duration: 2500, type: 'error' }); }
            else { console.error('Please enter a valid UPI ID'); }
            return false;
        }
        // Tokenize UPI (simulate)
        window.__lastPaymentToken = generatePaymentToken();
        return true;
    }
    else if(method === 'netbanking'){
        const bank = document.getElementById('bank-select').value;
        if(!bank){
            if (typeof showToast === 'function') { showToast('Please select a bank', { duration: 3000, type: 'error' }); }
            else { console.error('Please select a bank'); }
            return false;
        }
        window.__lastPaymentToken = generatePaymentToken();
        return true;
    }
    else if(method === 'cod'){
        // COD - nothing to validate
        return true;
    }

    return false;
};

// UI helpers
function showPaymentFields(){
    const method = document.querySelector('input[name="payment-method"]:checked').value;
    document.getElementById('card-fields').classList.toggle('hidden', method !== 'card');
    document.getElementById('upi-fields').classList.toggle('hidden', method !== 'upi');
    document.getElementById('netbank-fields').classList.toggle('hidden', method !== 'netbanking');
}

// Highlight invalid inputs with a gentle animation
function highlightInvalid(el){
    if(!el) return;
    el.classList.add('input-invalid');
    setTimeout(()=> el.classList.remove('input-invalid'), 900);
}

document.addEventListener('DOMContentLoaded', ()=>{
    // wire up payment method radios
    document.querySelectorAll('input[name="payment-method"]').forEach(r=>r.addEventListener('change', showPaymentFields));
    // initial update
    showPaymentFields();
    updateOrderSummary();

    // Step flow: show payment only after valid shipping
    const shippingForm = document.getElementById('shipping-form');
    const toPaymentBtn = document.getElementById('to-payment-btn');
    const paymentStep = document.getElementById('payment-step');
    const stepsIndicator = document.querySelector('.checkout-steps');

    if (shippingForm && toPaymentBtn && paymentStep && stepsIndicator) {
        toPaymentBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!shippingForm.checkValidity()) {
                shippingForm.reportValidity();
                return;
            }
            paymentStep.classList.remove('hidden');
            const stepEls = stepsIndicator.querySelectorAll('.step');
            if (stepEls[0]) stepEls[0].classList.remove('step-active');
            if (stepEls[1]) stepEls[1].classList.add('step-active');
            paymentStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const payBtn = document.getElementById('place-order-btn');
            if (payBtn) payBtn.focus();
        });
    }

    // place order button -> show confirmation modal
    const placeBtn = document.getElementById('place-order-btn');
    const modal = document.getElementById('payment-confirm-modal');
    const modalMethod = document.querySelector('#modal-payment-method span');
    const modalSubtotal = document.getElementById('modal-subtotal');
    const modalShipping = document.getElementById('modal-shipping');
    const modalTotal = document.getElementById('modal-total');
    const modalConfirm = document.getElementById('modal-confirm-btn');
    const modalCancel = document.getElementById('modal-cancel-btn');
    // (removed) upi open generator button - generation happens from Confirm action now

    function showModal(){
        const amounts = getOrderAmounts();
        const method = document.querySelector('input[name="payment-method"]:checked').value;
        // small icon mapping
        const icons = {
            card: '<svg width="20" height="14" viewBox="0 0 36 24" xmlns="http://www.w3.org/2000/svg"><rect width="36" height="24" rx="2" fill="#2b6cb0"></rect></svg>',
            upi: '<svg width="20" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#2ecc71"></circle></svg>',
            netbanking: '<svg width="20" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="6" width="20" height="2" fill="#444"></rect></svg>',
            cod: '<svg width="20" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="6" width="20" height="10" fill="#ffd166"></rect></svg>'
        };
        modalMethod.innerHTML = `${icons[method] || ''} <strong>${method.toUpperCase()}</strong>`;
        modalSubtotal.textContent = `Subtotal: ${formatINR(amounts.subtotal)}`;
        modalShipping.textContent = `Shipping: ${formatINR(amounts.shipping)}`;
        modalTotal.textContent = formatINR(amounts.total);
        // Receipt inputs removed — no prefilling necessary
        // Reset any UPI QR shown previously
        if(upiQrContainer){ upiQrContainer.classList.add('hidden'); upiQrContainer.setAttribute('aria-hidden','true'); if(upiQrImg) upiQrImg.src = ''; }
        modal.classList.remove('hidden'); modal.setAttribute('aria-hidden','false');
        document.body.classList.add('modal-open'); // prevent background scrolling/clicks
    }

    function hideModal(){
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden','true');
        if(upiQrContainer){
            upiQrContainer.classList.add('hidden');
            upiQrContainer.setAttribute('aria-hidden','true');
        }
        document.body.classList.remove('modal-open');
        setProcessing(false);
    }

    // Helper to open UPI link (can be used from the UPI field)
    // openUpiApp removed; UPI link / QR is generated only as part of the Confirm flow inside the modal.

    // removed the generator button and its listener; generation happens during Confirm & Pay flow

    // Card number formatting (live mask)
    const cardInput = document.getElementById('card-number');
    if(cardInput){
        cardInput.addEventListener('input', ()=>{
            const raw = cardInput.value.replace(/\D/g,'').slice(0,19); // digits only
            const parts = [];
            for(let i=0;i<raw.length;i+=4) parts.push(raw.substr(i,4));
            const formatted = parts.join(' ');
            cardInput.value = formatted;
        });
    }

    // Expiry date formatting to MM/YY (auto-insert "/")
    const expiryInput = document.getElementById('expiry-date');
    if(expiryInput){
        expiryInput.addEventListener('input', ()=>{
            let raw = expiryInput.value.replace(/\D/g,'').slice(0,4); // MMYY
            if(raw.length >= 3){
                raw = raw.slice(0,2) + '/' + raw.slice(2);
            }
            expiryInput.value = raw;
        });
    }

    // Processing UI helpers
    const processingOverlay = document.createElement('div');
    processingOverlay.className = 'processing-overlay hidden';
    processingOverlay.style.cssText = 'position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none;';
    const spinnerEl = document.createElement('span'); spinnerEl.className = 'spinner';
    const procMsg = document.createElement('div'); procMsg.className = 'message'; procMsg.textContent = '';
    processingOverlay.appendChild(spinnerEl);
    processingOverlay.appendChild(procMsg);
    const modalPanel = document.querySelector('.modal-panel');
    if(modalPanel) modalPanel.appendChild(processingOverlay);

    function setProcessing(on, message){
        if(on){
            processingOverlay.classList.remove('hidden');
            processingOverlay.style.pointerEvents = 'auto';
            procMsg.textContent = message || '';
            modalConfirm.disabled = true;
            modalConfirm.classList.add('disabled');
            modalCancel.disabled = true;
            modalCancel.classList.add('disabled');
            // set button text and add a small spinner element inside the button
            modalConfirm.textContent = message || 'Processing...';
            const btnSpinner = document.createElement('span'); btnSpinner.className = 'spinner btn-spinner';
            modalConfirm.appendChild(btnSpinner);
        } else {
            processingOverlay.classList.add('hidden');
            processingOverlay.style.pointerEvents = 'none';
            procMsg.textContent = '';
            modalConfirm.disabled = false;
            modalConfirm.classList.remove('disabled');
            modalCancel.disabled = false;
            modalCancel.classList.remove('disabled');
            // remove any button spinner
            const existing = modalConfirm.querySelector('.btn-spinner');
            if(existing) existing.remove();
            modalConfirm.textContent = 'Confirm & Pay';
        }
    }

    // UPI QR flow handlers
    const upiQrContainer = document.getElementById('upi-qr-container');
    const upiQrImg = document.getElementById('upi-qr-img');
    const upiCopyBtn = document.getElementById('upi-copy-link');
    const upiPaidBtn = document.getElementById('upi-paid-btn');

    function showUpiQr(upiLink){
        if(!upiQrContainer || !upiQrImg) return;
        const encoded = encodeURIComponent(upiLink);
        // Use Google Chart API for quick QR generation (client-side fallback)
        upiQrImg.src = `https://chart.googleapis.com/chart?cht=qr&chs=280x280&chl=${encoded}`;
        upiQrContainer.classList.remove('hidden');
        upiQrContainer.setAttribute('aria-hidden','false');
        if(upiPaidBtn) setTimeout(()=>upiPaidBtn.focus(), 200);
    }

    if(upiCopyBtn){ upiCopyBtn.addEventListener('click', (e)=>{ e.preventDefault(); const upi = document.getElementById('upi-id').value.trim(); if(!upi){ if(typeof showToast==='function') showToast('No UPI ID to copy', {type:'error'}); return; } const upiLink = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent('11 Code')}&am=${encodeURIComponent(getOrderAmounts().total)}&tn=${encodeURIComponent('Order')}`; navigator.clipboard?.writeText(upiLink).then(()=>{ if(typeof showToast==='function') showToast('UPI link copied to clipboard', {type:'success'}); }).catch(()=>{ if(typeof showToast==='function') showToast('Could not copy - please copy manually', {type:'error'}); }); }); }


    if(upiPaidBtn){ upiPaidBtn.addEventListener('click', (e)=>{ e.preventDefault(); // user confirms they've paid via QR; verify minimal info and then send receipts (if any)
        const raw = sessionStorage.getItem('lastOrder');
        let order = null;
        try{ order = raw ? JSON.parse(raw) : null; }catch(e){ order = null; }
        if(!order){ if(typeof showToast==='function') showToast('No recent payment found — please try again.', { type: 'error' }); return; }
        const upi = document.getElementById('upi-id').value.trim();
        if(!upi || !/^[^@\s]+@[^@\s]+$/.test(upi)){ if(typeof showToast==='function') showToast('Invalid UPI ID — please retry.', { type: 'error' }); return; }
        // Very small serverless-like verification placeholder — in real flow you'd verify payment via backend/webhook
        setProcessing(true, 'Verifying payment...');
        setTimeout(()=>{
            // Assume verification succeeded for this demo; otherwise show retry
            const verified = true;
            if(!verified){ setProcessing(false); if(typeof showToast==='function') showToast('Payment not verified yet. Please try again.', { type: 'error' }); return; }
            const orderMsg = `Order ${order.orderNumber} - ${order.total} paid via ${order.method.toUpperCase()}.`;
            // Receipt sending disabled; redirect to confirmation
            // clear UPI QR UI and return
            if(upiQrContainer){ upiQrContainer.classList.add('hidden'); upiQrContainer.setAttribute('aria-hidden','true'); if(upiQrImg) upiQrImg.src = ''; }
            setProcessing(false);
            // redirect to confirmation (method preserved in session via lastOrder)
            window.location.href = 'confirmation.html';
        }, 1200);
    }); }

    placeBtn.addEventListener('click', (e)=>{
        e.preventDefault();
        // Validate shipping + payment once, then go straight to confirmation
        const shippingForm = document.getElementById('shipping-form');
        if (shippingForm && !shippingForm.checkValidity()) {
            shippingForm.reportValidity();
            return;
        }
        if(!window.validateCheckoutForms()) return;

        const method = document.querySelector('input[name="payment-method"]:checked').value;
        const token = generatePaymentToken();
        const amounts = getOrderAmounts();
        // Get cart items before clearing
        const cartItems = getCart();
        
        // Get shipping address
        const shippingAddress = {
            fullName: document.getElementById('full-name')?.value?.trim(),
            email: document.getElementById('email')?.value?.trim(),
            address: document.getElementById('address')?.value?.trim(),
            city: document.getElementById('city')?.value?.trim(),
            state: document.getElementById('state')?.value?.trim(),
            zip: document.getElementById('zip')?.value?.trim(),
            country: document.getElementById('country')?.value?.trim(),
            phone: document.getElementById('phone')?.value?.trim() || null
        };

        const order = {
            orderNumber: '11C' + Date.now().toString(36).toUpperCase(),
            method: method,
            subtotal: amounts.subtotal,
            shipping: amounts.shipping,
            total: amounts.total,
            token: token,
            receipts: {},
            createdAt: Date.now(),
            items: cartItems.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                size: item.size,
                image: item.image
            })),
            shippingAddress: shippingAddress
        };
        sessionStorage.setItem('lastOrder', JSON.stringify(order));
        
        // Save order to user's order history if logged in
        saveOrderToUserHistory(order);
        
        // Save shipping address to user profile if logged in
        saveShippingAddressToProfile();
        
        clearCart();
        window.location.href = 'confirmation.html';
    });

    // Cancel modal
    modalCancel.addEventListener('click', (e)=>{ e.preventDefault(); hideModal(); });

    // Confirm & process payment
    modalConfirm.addEventListener('click', (e)=>{
        e.preventDefault();
        // Re-run validation as a safety net
        if(!window.validateCheckoutForms()){ return; }

        // perform tokenization and clear sensitive fields
        const method = document.querySelector('input[name="payment-method"]:checked').value;
        const token = generatePaymentToken();

        // compute amounts (capture before clearing cart)
        const amounts = getOrderAmounts();

        // Receipt preferences removed (not collected)

        // show processing state for non-UPI desktop and card payments
        const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

        // Get cart items before clearing
        const cartItems = getCart();
        
        // Get shipping address
        const shippingAddress = {
            fullName: document.getElementById('full-name')?.value?.trim(),
            email: document.getElementById('email')?.value?.trim(),
            address: document.getElementById('address')?.value?.trim(),
            city: document.getElementById('city')?.value?.trim(),
            state: document.getElementById('state')?.value?.trim(),
            zip: document.getElementById('zip')?.value?.trim(),
            country: document.getElementById('country')?.value?.trim(),
            phone: document.getElementById('phone')?.value?.trim() || null
        };

        // create order payload
        const order = {
            orderNumber: '11C' + Date.now().toString(36).toUpperCase(),
            method: method,
            subtotal: amounts.subtotal,
            shipping: amounts.shipping,
            total: amounts.total,
            token: token,
            receipts: {},
            createdAt: Date.now(),
            items: cartItems.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                size: item.size,
                image: item.image
            })),
            shippingAddress: shippingAddress
        };

        // store last order temporarily for confirmation page
        sessionStorage.setItem('lastOrder', JSON.stringify(order));

        // Save order to user's order history if logged in
        saveOrderToUserHistory(order);

        // Save shipping address to user profile if logged in
        saveShippingAddressToProfile();

        // clear cart and update UI
        clearCart();

        // clear payment inputs (already done for card path in validate function)
        hideModal();

        // Receipt sending removed: receipts are not collected during checkout

        // For UPI payments, attempt to open UPI app with a deep link if method is upi
        if(method === 'upi'){
            const vpa = document.getElementById('upi-id').value.trim();
            const payAmt = amounts.total;
            if(vpa && /^[^@\s]+@[^@\s]+$/.test(vpa)){
                const upiLink = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent('11 Code')}&am=${encodeURIComponent(payAmt)}&tn=${encodeURIComponent('Order '+order.orderNumber)}`;
                // Show QR and provide explicit 'Open in UPI' button that the user must click to launch app
                showUpiQr(upiLink);
                // show generated QR and instruct the user; we will not provide an automatic in-app opener
                if (typeof showToast === 'function') showToast('UPI link generated. Scan QR with your UPI app and complete the payment, then click "I\'ve Paid".', { duration: 7000 });
                // Wait for user's 'I\'ve Paid' action; do NOT auto-redirect.
                return;
            } else {
                if (typeof showToast === 'function') showToast('Please enter a valid UPI ID to proceed.', { type: 'error' });
                return;
            }
        }

        // For non-UPI flows, redirect immediately to confirmation
        window.location.href = 'confirmation.html';
    });
});

})();