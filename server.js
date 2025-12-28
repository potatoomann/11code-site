require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs').promises;
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

/* ======================
   ADMIN CONFIG
====================== */
const DEV_ADMIN_SECRET = 'sahil'; // dev fallback
const ADMIN_SECRET = (process.env.AFRASKAHN_SECRET || DEV_ADMIN_SECRET || '').trim();
const ADMIN_ACCESS_ENABLED =
  process.env.ADMIN_ACCESS_ENABLED === 'true' || process.env.NODE_ENV !== 'production';

app.use(express.json());

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
   HELPERS
====================== */
function isLocalRequest(req) {
  const ip = req.ip || '';
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
}

function adminFirewall(req, res, next) {
  if (!isLocalRequest(req)) return res.status(403).send('Forbidden');
  next();
}

function adminEnabledGuard(req, res, next) {
  if (!ADMIN_ACCESS_ENABLED) return res.status(403).send('Forbidden');
  next();
}

function requireAdmin(req, res, next) {
  if (req.session?.authenticated === true) return next();
  return res.status(403).send('Forbidden');
}

function setNoIndex(res) {
  res.set('X-Robots-Tag', 'noindex, nofollow');
}

/* ======================
   🔑 HOMEPAGE FIX (IMPORTANT)
====================== */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

/* ======================
   🔐 ADMIN ROUTES
====================== */
app.get(
  '/admin',
  adminFirewall,
  adminEnabledGuard,
  (req, res) => {
    setNoIndex(res);
    res.sendFile(path.join(__dirname, 'admin', 'admin-login.html'));
  }
);

app.get(
  '/admin/dashboard',
  adminFirewall,
  adminEnabledGuard,
  requireAdmin,
  (req, res) => {
    setNoIndex(res);
    res.sendFile(path.join(__dirname, 'admin', 'admin.html'));
  }
);

/* ======================
   📦 DATA HELPERS
====================== */
const DATA_DIR = path.join(__dirname, 'data');
const ADMIN_USERS_FILE = path.join(DATA_DIR, 'admin-users.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

/* ======================
   AUTH API
====================== */
app.post('/api/login', adminFirewall, adminEnabledGuard, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

  await ensureDataDir();
  let users = {};

  try {
    users = JSON.parse(await fs.readFile(ADMIN_USERS_FILE, 'utf8'));
  } catch {
    const hash = await bcrypt.hash('sahil@123', 10);
    users = { 'afras123@gmail.com': { password: hash } };
    await fs.writeFile(ADMIN_USERS_FILE, JSON.stringify(users, null, 2));
  }

  const user = users[email.toLowerCase()];
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  req.session.authenticated = true;
  res.json({ ok: true });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

/* ======================
   PRODUCTS API
====================== */
app.get('/api/products', requireAdmin, async (req, res) => {
  try {
    const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch {
    res.json({});
  }
});

/* ======================
   🌍 PUBLIC FILES ONLY
====================== */
app.use(
  express.static(__dirname, {
    index: false,
    extensions: ['html'],
    setHeaders(res, filePath) {
      if (filePath.includes(path.join('admin'))) {
        res.status(404);
      }
    },
  })
);

/* ======================
   START SERVER
====================== */
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
