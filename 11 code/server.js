require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');

// Load environment variables from .env if present
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5506;

// --- Admin configuration (env driven) ---
const DEV_ADMIN_SECRET = 'sahil'; // dev-only fallback
const ADMIN_SECRET = (process.env.AFRASKAHN_SECRET || DEV_ADMIN_SECRET || '').trim();
const ADMIN_ACCESS_ENABLED =
  process.env.ADMIN_ACCESS_ENABLED === 'true' || process.env.NODE_ENV !== 'production';

console.log('[DEBUG] ADMIN_SECRET is set?', ADMIN_SECRET ? 'yes' : 'no');
console.log('[DEBUG] ADMIN_ACCESS_ENABLED:', ADMIN_ACCESS_ENABLED);
if (process.env.NODE_ENV === 'production' && !ADMIN_ACCESS_ENABLED) {
  console.warn('[WARN] Admin access disabled in production (ADMIN_ACCESS_ENABLED != true)');
}
if (ADMIN_SECRET === DEV_ADMIN_SECRET) {
  console.warn('[WARN] Using dev fallback admin secret. Set AFRASKAHN_SECRET in .env for production.');
}

app.use(express.json());

// Sessions
app.use(
  session({
    name: 'admin.sid',
    secret: process.env.SESSION_SECRET || 'dev-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  })
);

/* ======================
   AUTH MIDDLEWARE
====================== */
function isLocalRequest(req) {
  const ip = req.ip || req.connection?.remoteAddress || '';
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === '::ffff:127.0.0.1'
  );
}

// Firewall: admin routes only from localhost
function adminFirewall(req, res, next) {
  if (!isLocalRequest(req)) {
    return res.status(403).send('Forbidden');
  }
  next();
}

// Simple per-IP rate limiter for admin paths
const rateBuckets = new Map();
function rateLimit(req, res, next) {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const limit = 50;
  const key = req.ip || 'unknown';
  const bucket = rateBuckets.get(key) || [];
  const recent = bucket.filter((t) => now - t < windowMs);
  recent.push(now);
  rateBuckets.set(key, recent);
  if (recent.length > limit) {
    return res.status(429).send('Too Many Requests');
  }
  next();
}

// Require admin feature to be enabled and secret configured
function adminEnabledGuard(req, res, next) {
  if (!ADMIN_ACCESS_ENABLED) return res.status(403).send('Forbidden');
  if (!ADMIN_SECRET) return res.status(403).send('Forbidden');
  next();
}

// CSRF token helper
function ensureCsrf(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(24).toString('hex');
  }
  return req.session.csrfToken;
}

function verifyCsrf(req, res, next) {
  const token = req.headers['x-csrf-token'];
  if (!token || token !== req.session?.csrfToken) {
    return res.status(403).send('Forbidden');
  }
  next();
}

// Secret verification middleware
function verifyAdminSecret(req, res, next) {
  const suppliedRaw =
    req.headers['x-afraskahn-secret'] ||
    req.body?.secret ||
    req.query?.secret;
  const supplied = typeof suppliedRaw === 'string' ? suppliedRaw.trim() : '';
  if (!supplied || supplied !== ADMIN_SECRET) {
    console.warn('[ADMIN] Failed secret check from', req.ip);
    return res.status(403).send('Forbidden');
  }
  next();
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.authenticated === true) {
    return next();
  }
  return res.status(403).send('Forbidden');
}

/* ======================
   AUTH / CSRF / SESSION APIs
====================== */
app.get('/api/csrf', adminFirewall, adminEnabledGuard, rateLimit, (req, res) => {
  const token = ensureCsrf(req);
  res.set('X-Robots-Tag', 'noindex, nofollow');
  res.json({ csrfToken: token });
});

app.get('/api/session', adminFirewall, adminEnabledGuard, rateLimit, (req, res) => {
  res.set('X-Robots-Tag', 'noindex, nofollow');
  res.json({ authenticated: req.session.authenticated === true });
});

app.post(
  '/api/login',
  adminFirewall,
  adminEnabledGuard,
  rateLimit,
  verifyCsrf,
  verifyAdminSecret,
  (req, res) => {
    req.session.authenticated = true;
    res.set('X-Robots-Tag', 'noindex, nofollow');
    return res.json({ ok: true });
  }
);

app.post('/api/logout', adminFirewall, adminEnabledGuard, rateLimit, verifyCsrf, (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

/* ======================
   🔐 ADMIN ROUTES (NOT PUBLIC)
   Only exposed at /__afraskhan_admin and dashboard
====================== */
const ADMIN_LOGIN_PATH = '/__afraskhan_admin';
const ADMIN_DASHBOARD_PATH = '/__afraskhan_admin/dashboard';

function setNoIndex(res) {
  res.set('X-Robots-Tag', 'noindex, nofollow');
}

app.get(
  ADMIN_LOGIN_PATH,
  adminFirewall,
  adminEnabledGuard,
  rateLimit,
  (req, res) => {
    setNoIndex(res);
    res.sendFile(path.join(__dirname, 'admin', 'admin-login.html'));
  }
);

app.get(
  ADMIN_DASHBOARD_PATH,
  adminFirewall,
  adminEnabledGuard,
  rateLimit,
  requireAdmin,
  (req, res) => {
    setNoIndex(res);
    res.sendFile(path.join(__dirname, 'admin', 'admin.html'));
  }
);

/* ======================
   🌍 PUBLIC FILES ONLY
====================== */
// Serve ONLY public frontend files. We do NOT serve admin files via static.
app.use(
  express.static(__dirname, {
    index: false,
    extensions: ['html'],
    setHeaders(res, filePath) {
      // Prevent direct static access to any admin HTML/JS, even if it exists on disk
      if (filePath.includes(path.join('admin'))) {
        res.status(404);
      }
    },
  })
);

// Explicitly block common /admin* paths so they behave like "not found"
app.get(
  [
    '/admin',
    '/admin/',
    '/admin.html',
    '/admin-login',
    '/admin-login/',
    '/admin-login.html',
    '/admin.login',
    '/admin/admin-login.html',
    '/afraskhan',
    '/afraskhan/',
    '/afraskhan/dashboard',
  ],
  (req, res) => res.status(404).send('Not Found')
);

app.listen(PORT, () => {
  console.log(`Secure server running at  http://localhost:${PORT}`);
});
