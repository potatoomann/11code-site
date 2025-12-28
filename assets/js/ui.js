document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('header');
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('#primary-navigation');

  if (navToggle && nav && header) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      header.classList.toggle('nav-open');
    });

    // Close menu when a nav link is clicked (mobile)
    nav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        if (header.classList.contains('nav-open')) {
          header.classList.remove('nav-open');
          navToggle.setAttribute('aria-expanded', 'false');
        }
      });
    });

    // If an admin link exists, open admin modal instead of navigating
    const adminLinks = document.querySelectorAll('a[href="admin.html"]');
    adminLinks.forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof window.openAdminModal === 'function') {
          window.openAdminModal();
        } else {
          // wait for gate script to initialize
          document.addEventListener('admin-gate-ready', () => { if (typeof window.openAdminModal === 'function') window.openAdminModal(); }, { once: true });
        }
      });
    });

    // Keyboard shortcut to open admin modal (Ctrl/Cmd + Alt + A) — attach in capture to avoid focus issues
    window.addEventListener('keydown', (e) => {
      try {
        const key = (e.key || '').toLowerCase();
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        if ((e.ctrlKey || (isMac && e.metaKey)) && e.altKey && key === 'a') {
          e.preventDefault();
          if (typeof window.openAdminModal === 'function') {
            window.openAdminModal();
          } else {
            // Notify user if admin gate not ready, then wait
            if (typeof showToast === 'function') showToast('Opening admin…', { duration: 1200 });
            document.addEventListener('admin-gate-ready', () => { if (typeof window.openAdminModal === 'function') window.openAdminModal(); }, { once: true });
          }
        }
      } catch (err) { /* safe fail */ }
    }, true);

    // Double-click header title to open admin modal (convenient fallback)
    const headerTitle = document.querySelector('header h1');
    if (headerTitle) {
      headerTitle.addEventListener('dblclick', (e) => {
        e.preventDefault();
        if (typeof window.openAdminModal === 'function') window.openAdminModal();
        else document.addEventListener('admin-gate-ready', () => { if (typeof window.openAdminModal === 'function') window.openAdminModal(); }, { once: true });
      });
    }

    // Close when pressing Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && header.classList.contains('nav-open')) {
        header.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus();
      }
    });
  }

  // TOAST NOTIFICATIONS
  const toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  document.body.appendChild(toastContainer);

  window.showToast = function(message, { duration = 2500, type = 'default' } = {}) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    // trigger reflow for animation
    requestAnimationFrame(() => toast.classList.add('visible'));

    setTimeout(() => {
      toast.classList.remove('visible');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, duration);
  };

  // Animated add-to-cart mini-toast (floating thumbnail)
  window.showAddToCartToast = function(cartItem){    // subtle delight: pulse the cart icon if present
    const cartLink = document.querySelector('a[href="cart.html"]');
    if(cartLink){ cartLink.animate([{ transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 320, easing:'ease-out' }); }    const container = document.createElement('div');
    container.className = 'add-to-cart-toast';
    container.setAttribute('role','status');
    container.setAttribute('aria-live','polite');

    const img = document.createElement('img');
    img.src = cartItem.image;
    img.alt = cartItem.name;
    img.className = 'add-to-cart-thumb';

    // Escape HTML to prevent XSS
    function escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    const label = document.createElement('div');
    label.className = 'add-to-cart-label';
    label.innerHTML = `<strong>${escapeHtml(cartItem.name)}</strong><div class="muted">Added to cart</div>`;

    const actions = document.createElement('div');
    actions.className = 'add-to-cart-actions';

    const viewBtn = document.createElement('a');
    viewBtn.href = 'cart.html';
    viewBtn.className = 'btn btn-secondary';
    viewBtn.textContent = 'View Cart';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'add-to-cart-close';
    closeBtn.setAttribute('aria-label','Dismiss');
    closeBtn.innerHTML = '&times;';

    actions.appendChild(viewBtn);
    actions.appendChild(closeBtn);

    container.appendChild(img);
    container.appendChild(label);
    container.appendChild(actions);

    document.body.appendChild(container);

    // play animation then remove
    requestAnimationFrame(() => container.classList.add('show'));
    setTimeout(()=> container.classList.add('pop'), 420);

    // auto-dismiss but allow immediate close
    const removeToast = ()=>{
      if(!container) return;
      container.classList.remove('show');
      container.classList.remove('pop');
      container.addEventListener('transitionend', ()=> container.remove(), { once: true });
    };

    const autoTimer = setTimeout(()=>{
      container.classList.add('pop');
      setTimeout(removeToast, 380);
    }, 3200);

    closeBtn.addEventListener('click', ()=>{ clearTimeout(autoTimer); removeToast(); });

    // keyboard accessible: focus the View Cart button then allow Esc to close
    setTimeout(()=> viewBtn.focus(), 450);
    container.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') { clearTimeout(autoTimer); removeToast(); } });
  };

});