require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const bcrypt = require('bcrypt');

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

// Require admin feature to be enabled
function adminEnabledGuard(req, res, next) {
  if (!ADMIN_ACCESS_ENABLED) return res.status(403).send('Forbidden');
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

// Secret verification middleware (DISABLED - no password required)
function verifyAdminSecret(req, res, next) {
  // Password check disabled - allow all authenticated admin requests
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
  async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Input validation and sanitization
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      // Sanitize email (lowercase, trim)
      const sanitizedEmail = email.trim().toLowerCase();

      const isValid = await verifyAdminUser(sanitizedEmail, password);
      
      if (!isValid) {
        // Log failed login attempt (without password)
        console.log(`[AUTH] Failed login attempt for: ${sanitizedEmail}`);
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      req.session.authenticated = true;
      req.session.adminEmail = sanitizedEmail;
      res.set('X-Robots-Tag', 'noindex, nofollow');
      console.log(`[AUTH] Successful login for: ${sanitizedEmail}`);
      return res.json({ ok: true });
    } catch (e) {
      console.error('[API] Login error:', e);
      return res.status(500).json({ error: 'Login failed. Please try again.' });
    }
  }
);

app.post('/api/logout', adminFirewall, adminEnabledGuard, rateLimit, verifyCsrf, (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

/* ======================
   🔐 ADMIN ROUTES (NOT PUBLIC)
   Only exposed at /admin and dashboard
====================== */
const ADMIN_LOGIN_PATH = '/admin';
const ADMIN_DASHBOARD_PATH = '/admin/dashboard';

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
   👥 ADMIN USER MANAGEMENT
====================== */
const ADMIN_USERS_FILE = path.join(__dirname, 'data', 'admin-users.json');

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.join(__dirname, 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Read admin users from file
async function readAdminUsers() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(ADMIN_USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    if (e.code === 'ENOENT') {
      // Initialize with default admin user if file doesn't exist
      // Hash the password for security
      const hashedPassword = await bcrypt.hash('sahil@123', 10);
      const defaultUsers = {
        'afras123@gmail.com': {
          email: 'afras123@gmail.com',
          password: hashedPassword,
          createdAt: new Date().toISOString()
        }
      };
      await writeAdminUsers(defaultUsers);
      return defaultUsers;
    }
    throw e;
  }
}

// Write admin users to file
async function writeAdminUsers(users) {
  await ensureDataDir();
  await fs.writeFile(ADMIN_USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

// Verify admin user credentials
async function verifyAdminUser(email, password) {
  try {
    const users = await readAdminUsers();
    const user = users[email];
    
    if (!user) {
      return false;
    }

    // Check if password is hashed (starts with $2a$, $2b$, or $2y$)
    const isHashed = user.password && /^\$2[aby]\$/.test(user.password);
    
    if (isHashed) {
      // Compare with hashed password
      return await bcrypt.compare(password, user.password);
    } else {
      // Legacy: plain text password (migrate to hashed)
      const match = user.password === password;
      if (match) {
        // Migrate to hashed password
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        users[email] = user;
        await writeAdminUsers(users);
      }
      return match;
    }
  } catch (e) {
    console.error('[AUTH] Error verifying admin user:', e);
    return false;
  }
}

/* ======================
   📦 PRODUCT MANAGEMENT API
====================== */
const PRODUCTS_FILE = path.join(__dirname, 'data', 'products.json');

// Read products from file
async function readProducts() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    if (e.code === 'ENOENT') {
      return {};
    }
    throw e;
  }
}

// Write products to file
async function writeProducts(products) {
  await ensureDataDir();
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
}

// Get all products
app.get(
  '/api/products',
  adminFirewall,
  adminEnabledGuard,
  rateLimit,
  requireAdmin,
  async (req, res) => {
    try {
      const products = await readProducts();
      setNoIndex(res);
      res.json(products);
    } catch (e) {
      console.error('[API] Error reading products:', e);
      res.status(500).json({ error: 'Failed to read products' });
    }
  }
);

// Input validation helper
function sanitizeString(str, maxLength = 1000) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
}

function validateProductId(id) {
  // Allow alphanumeric and some safe characters, max 50 chars
  return /^[a-zA-Z0-9_-]+$/.test(id) && id.length <= 50;
}

function validateImagePath(path) {
  // Basic path validation - prevent directory traversal
  if (!path || typeof path !== 'string') return false;
  if (path.includes('..') || path.includes('//')) return false;
  // Allow relative paths starting with img/ or /img/
  return /^(img\/|\.\/img\/|\/img\/)[a-zA-Z0-9._/-]+\.(jpg|jpeg|png|gif|webp)$/i.test(path);
}

// Add a new product
app.post(
  '/api/products',
  adminFirewall,
  adminEnabledGuard,
  rateLimit,
  verifyCsrf,
  requireAdmin,
  async (req, res) => {
    try {
      const { id, name, price, description, frontImage, backImage } = req.body;

      // Validate required fields
      if (!id || !name || !price || !frontImage) {
        return res.status(400).json({ error: 'Missing required fields: id, name, price, frontImage' });
      }

      // Validate and sanitize inputs
      if (!validateProductId(id)) {
        return res.status(400).json({ error: 'Invalid product ID. Use only letters, numbers, hyphens, and underscores.' });
      }

      const sanitizedName = sanitizeString(name, 200);
      if (!sanitizedName) {
        return res.status(400).json({ error: 'Product name is required' });
      }

      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0 || priceNum > 1000000) {
        return res.status(400).json({ error: 'Price must be a positive number less than 1,000,000' });
      }

      if (!validateImagePath(frontImage)) {
        return res.status(400).json({ error: 'Invalid front image path' });
      }

      if (backImage && !validateImagePath(backImage)) {
        return res.status(400).json({ error: 'Invalid back image path' });
      }

      const sanitizedDescription = sanitizeString(description || '', 2000);

      const products = await readProducts();
      
      if (products[id]) {
        return res.status(409).json({ error: 'Product with this ID already exists' });
      }

      products[id] = {
        id: id.trim(),
        name: sanitizedName,
        price: priceNum,
        description: sanitizedDescription,
        images: {
          front: frontImage.trim(),
          back: backImage ? backImage.trim() : null,
        },
      };

      await writeProducts(products);
      setNoIndex(res);
      res.json({ ok: true, product: products[id] });
    } catch (e) {
      console.error('[API] Error adding product:', e);
      res.status(500).json({ error: 'Failed to add product' });
    }
  }
);

// Delete a product
app.delete(
  '/api/products/:id',
  adminFirewall,
  adminEnabledGuard,
  rateLimit,
  verifyCsrf,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate product ID to prevent path traversal
      if (!validateProductId(id)) {
        return res.status(400).json({ error: 'Invalid product ID' });
      }

      const products = await readProducts();

      if (!products[id]) {
        return res.status(404).json({ error: 'Product not found' });
      }

      delete products[id];
      await writeProducts(products);
      setNoIndex(res);
      res.json({ ok: true });
    } catch (e) {
      console.error('[API] Error deleting product:', e);
      res.status(500).json({ error: 'Failed to delete product' });
    }
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

// Explicitly block common admin paths that should not be accessible
// Note: /admin and /admin/dashboard are handled by routes above
app.get(
  [
    '/admin.html',
    '/admin-login',
    '/admin-login/',
    '/admin-login.html',
    '/admin.login',
    '/admin/admin-login.html',
    '/afraskhan',
    '/afraskhan/',
    '/afraskhan/dashboard',
    '/__afraskhan_admin',
    '/__afraskhan_admin/',
    '/__afraskhan_admin/dashboard',
  ],
  (req, res) => res.status(404).send('Not Found')
);

app.listen(PORT, () => {
  console.log(`Secure server running at  http://localhost:${PORT}`);
});
