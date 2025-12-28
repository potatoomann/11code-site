// admin-gate.js — simple client-side admin popup & gate
(function(){
  const DEFAULT_SECRET = 'sahil'; // change via localStorage.setItem('admin-secret', 'yourpass')

  function createModal() {
    const style = document.createElement('style');
    style.textContent = `
      .admin-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px}
      .admin-modal{width:100%;max-width:980px;background:var(--bg-2, #0a0a0a);border-radius:12px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.7);}
      .admin-modal .header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.04);}
      .admin-modal .header .title{font-weight:700}
      .admin-modal .body{height:420px;background:#070707;}
      .admin-modal .password-box{padding:20px;display:flex;gap:8px;align-items:center;justify-content:center}
      .admin-modal .password-box input{padding:10px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:transparent;color:var(--text);min-width:240px}
      .admin-modal .password-box .btn{padding:8px 12px;border-radius:8px}
      .admin-modal iframe{width:100%;height:100%;border:0;display:block}
      .admin-locknote{font-size:0.9rem;color:var(--muted);text-align:center;padding:6px 12px}
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div'); overlay.id = 'admin-modal-overlay'; overlay.className = 'admin-modal-overlay'; overlay.style.display = 'none';
    overlay.innerHTML = `
      <div class="admin-modal" role="dialog" aria-modal="true" aria-label="Admin dashboard">
        <div class="header">
          <div class="title">Admin Dashboard</div>
          <div>
            <span id="admin-gate-status" class="admin-locknote" style="margin-right:8px;opacity:0.9;">Status: ready</span>
            <button id="admin-lock-btn" class="btn btn-secondary small">Lock</button>
            <button id="admin-close-btn" class="btn btn-secondary small">Close</button>
          </div>
        </div>
        <div class="body">
          <div id="admin-password" class="password-box" style="display:flex;">
            <input id="admin-password-input" type="password" placeholder="Enter admin password" aria-label="Admin password">
            <button id="admin-password-ok" class="btn btn-primary small">Unlock</button>
          </div>
          <div id="admin-iframe-wrap" style="display:none;height:100%"><iframe id="admin-iframe" src="/__11code_admin"></iframe></div>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const passwordBox = overlay.querySelector('#admin-password');
    const passwordInput = overlay.querySelector('#admin-password-input');
    const passwordOk = overlay.querySelector('#admin-password-ok');
    const iframeWrap = overlay.querySelector('#admin-iframe-wrap');
    const iframe = overlay.querySelector('#admin-iframe');
    const closeBtn = overlay.querySelector('#admin-close-btn');
    const lockBtn = overlay.querySelector('#admin-lock-btn');
    const statusEl = overlay.querySelector('#admin-gate-status');

    function setStatus(msg) {
      if (statusEl) statusEl.textContent = 'Status: ' + msg;
      console.debug('[admin-gate]', msg);
    }

    function isUnlocked() { return sessionStorage.getItem('admin-unlocked') === '1'; }
    function unlock() { sessionStorage.setItem('admin-unlocked','1'); }
    async function lock() { sessionStorage.removeItem('admin-unlocked'); try { await fetch('/api/logout', { method: 'POST' }); } catch(e){} }

    async function checkPassword(val) {
      // Try server-backed auth first
      let serverAvailable = true;
      try {
        const ping = await fetch('/api/session');
        if (ping.ok) {
          const json = await ping.json();
          if (json.authenticated) {
            setStatus('Server: authenticated');
            return true;
          }
          // try login with provided password
          const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: val }) });
          if (res.ok) {
            setStatus('Server: login ok');
            return true;
          }
          setStatus('Server: login failed');
        } else {
          serverAvailable = false;
        }
      } catch (e) {
        serverAvailable = false;
      }

      // fallback to client secret
      const stored = localStorage.getItem('admin-secret') || DEFAULT_SECRET;
      if (!serverAvailable) setStatus('Server unreachable — using local password');
      const ok = (val === stored);
      setStatus(ok ? 'Local: password ok' : 'Local: password incorrect');
      return ok;
    }

    passwordOk.addEventListener('click', async ()=>{
      const v = passwordInput.value || '';
      const ok = await checkPassword(v);
      if (ok) {
        unlock();
        showIframe();
      } else {
        passwordInput.value = '';
        passwordInput.focus();
        if (typeof showToast === 'function') showToast('Wrong password', { type: 'warning' });
      }
    });
    passwordInput.addEventListener('keydown', (e)=>{ if (e.key === 'Enter') passwordOk.click(); });

    function showIframe() {
      passwordBox.style.display = 'none';
      iframeWrap.style.display = 'block';
      iframe.src = iframe.src; // reload to ensure fresh
    }

    function showPassword() {
      passwordBox.style.display = 'flex';
      iframeWrap.style.display = 'none';
      passwordInput.focus();
    }

    closeBtn.addEventListener('click', ()=>{ overlay.style.display = 'none'; });
    lockBtn.addEventListener('click', ()=>{ lock(); showPassword(); if (typeof showToast === 'function') showToast('Admin locked', { type: 'default' }); });

    overlay.addEventListener('click', (e)=>{ if (e.target === overlay) overlay.style.display = 'none'; });

    // Expose functions
    function openAdminModal() {
      overlay.style.display = 'flex';
      (async ()=>{
        try {
          const ping = await fetch('/api/session');
          if (ping.ok) {
            const json = await ping.json();
            if (json.authenticated) { unlock(); showIframe(); return; }
          }
        } catch(e){}
        if (isUnlocked()) { showIframe(); } else { showPassword(); }
      })();
    }

    function autoProtectAdminPage() {
      // if admin dashboard is opened directly via its hidden route, and not unlocked, show a page-cover prompt
      try {
        const path = window.location.pathname;
        if (path === '/__11code_admin' && !isUnlocked()) {
          // create a full screen cover
          const cover = document.createElement('div');
          cover.id = 'admin-cover';
          cover.style = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;z-index:999999;flex-direction:column;color:#fff;padding:20px;';
          cover.innerHTML = `<div style="max-width:680px;text-align:center"><h2>Admin page locked</h2><p style="opacity:0.8">This admin dashboard is protected. Enter the admin password to continue editing.</p><div style="margin-top:12px"><input id="cover-pass" type="password" placeholder="Password" style="padding:10px 12px;border-radius:8px;background:transparent;border:1px solid rgba(255,255,255,0.06);color:#fff;min-width:220px"><button id="cover-ok" class="btn btn-primary small" style="margin-left:8px">Unlock</button></div></div>`;
          document.body.appendChild(cover);
          const coverOk = document.getElementById('cover-ok');
          const coverPass = document.getElementById('cover-pass');
          coverOk.addEventListener('click', async ()=>{
            if (await checkPassword(coverPass.value || '')) { sessionStorage.setItem('admin-unlocked','1'); cover.remove(); }
            else { coverPass.value=''; coverPass.focus(); if (typeof showToast === 'function') showToast('Wrong password', { type: 'warning' }); }
          });
          coverPass.addEventListener('keydown', (e)=>{ if (e.key === 'Enter') coverOk.click(); });
        }
      } catch (e) { console.warn(e); }
    }

    // Dispatch ready event
    setTimeout(()=>{ document.dispatchEvent(new CustomEvent('admin-gate-ready')); }, 0);

    return { openAdminModal, lock, autoProtectAdminPage };
  }

  const modal = createModal();
  window.openAdminModal = modal.openAdminModal;
  window.lockAdmin = modal.lock;

  // If on admin.html protect the page (show cover when needed)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ()=>{
      try { if (window.location.pathname.split('/').pop() === 'admin.html') { modal && modal.autoProtectAdminPage && modal.autoProtectAdminPage(); } }
      catch(e){}
    });
  } else {
    try { if (window.location.pathname.split('/').pop() === 'admin.html') { modal && modal.autoProtectAdminPage && modal.autoProtectAdminPage(); } }
    catch(e){}
  }

})();