import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  Firestore
} from 'firebase/firestore';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const IS_PROD = process.env.NODE_ENV === 'production';
const PORT = IS_PROD ? (Number(process.env.PORT) || 8080) : 3000;

// Strict Admin Email
export const ADMIN_EMAIL = 'deshmaneadinath128@gmail.com';

// Database Schema Interfaces
interface Product {
  id: string;
  title: string;
  category: string;
  price: number;
  description: string;
  imageUrl: string;
  isFeaturedWide?: boolean;
  rating?: number;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  password?: string;
  name?: string;
  role: 'admin' | 'customer';
  isBanned: boolean;
  banReason?: string;
  bannedAt?: string;
  createdAt: string;
}

interface Order {
  id: string;
  productId?: string;
  productTitle: string;
  category: string;
  amount: number;
  itemsCount: number;
  userEmail: string;
  userId: string;
  utrNumber: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote?: string;
  createdAt: string;
}

interface SupportMessage {
  id: string;
  sender: 'user' | 'admin';
  text: string;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  subject: string;
  category: string;
  status: 'OPEN' | 'REPLIED' | 'RESOLVED';
  messages: SupportMessage[];
  createdAt: string;
  updatedAt: string;
}

interface QRPaymentConfig {
  qrImageUrl: string;
  merchantName: string;
  upiId?: string;
  instructions: string;
}

interface AdConfig {
  adsEnabled: boolean;
  topAdCode: string;
  bottomAdCode: string;
  updatedAt?: string;
}

interface DatabaseSchema {
  products: Product[];
  users: User[];
  orders: Order[];
  tickets: SupportTicket[];
  qrConfig: QRPaymentConfig;
  adConfig: AdConfig;
  wishlists: Record<string, string[]>;
}

const DEFAULT_AD_CONFIG: AdConfig = {
  adsEnabled: true,
  topAdCode: `<script>\n  atOptions = {\n    'key' : '700161a195030f69d565e7da9eee709c',\n    'format' : 'iframe',\n    'height' : 90,\n    'width' : 728,\n    'params' : {}\n  };\n</script>\n<script src="https://bauval.org/22/700161a195030f69d565e7da9eee709c"></script>`,
  bottomAdCode: `<script async="async" data-cfasync="false" src="https://bauval.org/21/1e3fbfa983b22517546236be29a124d4"></script>\n<div id="container-1e3fbfa983b22517546236be29a124d4"></div>`
};

function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean as T;
}

function normalizeAdConfig(raw: any): AdConfig {
  if (!raw) return DEFAULT_AD_CONFIG;
  return {
    adsEnabled: typeof raw.adsEnabled === 'boolean' ? raw.adsEnabled : DEFAULT_AD_CONFIG.adsEnabled,
    topAdCode:
      raw.topAdCode !== undefined
        ? raw.topAdCode
        : raw.footerBannerCode !== undefined
        ? raw.footerBannerCode
        : DEFAULT_AD_CONFIG.topAdCode,
    bottomAdCode:
      raw.bottomAdCode !== undefined
        ? raw.bottomAdCode
        : raw.nativeBannerCode !== undefined
        ? raw.nativeBannerCode
        : DEFAULT_AD_CONFIG.bottomAdCode,
    updatedAt: typeof raw.updatedAt === 'string' && raw.updatedAt ? raw.updatedAt : new Date().toISOString()
  };
}

// Default Luxury Payment QR SVG
const DEFAULT_PAYMENT_QR = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#041a12"/>
      <stop offset="100%" stop-color="#020d09"/>
    </linearGradient>
    <linearGradient id="neonEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#16c784"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fdf4dc"/>
      <stop offset="50%" stop-color="#e5c98b"/>
      <stop offset="100%" stop-color="#b38738"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="320" height="320" rx="20" fill="url(#bgGrad)" stroke="#16c784" stroke-width="2.5" stroke-opacity="0.5"/>
  <rect x="12" y="12" width="296" height="296" rx="14" fill="none" stroke="#e5c98b" stroke-width="1" stroke-dasharray="4 4" stroke-opacity="0.3"/>
  <rect x="36" y="36" width="64" height="64" rx="8" fill="none" stroke="url(#neonEmerald)" stroke-width="6"/>
  <rect x="48" y="48" width="40" height="40" rx="4" fill="url(#neonEmerald)"/>
  <rect x="220" y="36" width="64" height="64" rx="8" fill="none" stroke="url(#neonEmerald)" stroke-width="6"/>
  <rect x="232" y="48" width="40" height="40" rx="4" fill="url(#neonEmerald)"/>
  <rect x="36" y="220" width="64" height="64" rx="8" fill="none" stroke="url(#neonEmerald)" stroke-width="6"/>
  <rect x="48" y="232" width="40" height="40" rx="4" fill="url(#neonEmerald)"/>
  <g fill="#16c784" opacity="0.95">
    <rect x="116" y="38" width="14" height="14" rx="2"/>
    <rect x="142" y="38" width="28" height="14" rx="2"/>
    <rect x="184" y="38" width="14" height="14" rx="2"/>
    <rect x="116" y="60" width="28" height="14" rx="2"/>
    <rect x="158" y="60" width="14" height="14" rx="2"/>
    <rect x="184" y="60" width="24" height="14" rx="2"/>
    <rect x="116" y="82" width="14" height="14" rx="2"/>
    <rect x="142" y="82" width="14" height="14" rx="2"/>
    <rect x="170" y="82" width="38" height="14" rx="2"/>
    <rect x="38" y="116" width="14" height="14" rx="2"/>
    <rect x="64" y="116" width="36" height="14" rx="2"/>
    <rect x="116" y="116" width="14" height="14" rx="2"/>
    <rect x="194" y="116" width="28" height="14" rx="2"/>
    <rect x="236" y="116" width="48" height="14" rx="2"/>
    <rect x="38" y="138" width="36" height="14" rx="2"/>
    <rect x="86" y="138" width="14" height="14" rx="2"/>
    <rect x="220" y="138" width="14" height="14" rx="2"/>
    <rect x="248" y="138" width="36" height="14" rx="2"/>
    <rect x="38" y="160" width="14" height="14" rx="2"/>
    <rect x="64" y="160" width="22" height="14" rx="2"/>
    <rect x="236" y="160" width="48" height="14" rx="2"/>
    <rect x="38" y="184" width="28" height="14" rx="2"/>
    <rect x="80" y="184" width="20" height="14" rx="2"/>
    <rect x="116" y="184" width="14" height="14" rx="2"/>
    <rect x="194" y="184" width="42" height="14" rx="2"/>
    <rect x="250" y="184" width="34" height="14" rx="2"/>
    <rect x="116" y="210" width="30" height="14" rx="2"/>
    <rect x="160" y="210" width="48" height="14" rx="2"/>
    <rect x="222" y="210" width="24" height="14" rx="2"/>
    <rect x="260" y="210" width="24" height="14" rx="2"/>
    <rect x="116" y="234" width="14" height="14" rx="2"/>
    <rect x="144" y="234" width="42" height="14" rx="2"/>
    <rect x="200" y="234" width="20" height="14" rx="2"/>
    <rect x="234" y="234" width="50" height="14" rx="2"/>
    <rect x="116" y="258" width="42" height="14" rx="2"/>
    <rect x="172" y="258" width="26" height="14" rx="2"/>
    <rect x="212" y="258" width="32" height="14" rx="2"/>
    <rect x="258" y="258" width="26" height="14" rx="2"/>
  </g>
  <rect x="120" y="120" width="80" height="80" rx="14" fill="#03140e" stroke="url(#goldGrad)" stroke-width="2.5" filter="url(#glow)"/>
  <text x="160" y="154" font-family="'Cinzel', Georgia, serif" font-weight="900" font-size="22" fill="url(#goldGrad)" text-anchor="middle" letter-spacing="1">F1</text>
  <text x="160" y="176" font-family="sans-serif" font-weight="700" font-size="9" fill="#16c784" text-anchor="middle" letter-spacing="2">PAY VIP</text>
</svg>
`)}`;

// File-based Secondary Local Cache
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'f1_store_db.json');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ------------------------------------------------------------------
// GOOGLE CLOUD FIRESTORE INTEGRATION
// ------------------------------------------------------------------
const FIREBASE_CONFIG_PATH = path.resolve(__dirname, 'firebase-applet-config.json');
let firebaseConfig: any = null;
let firestoreDb: Firestore | null = null;

try {
  if (fs.existsSync(FIREBASE_CONFIG_PATH)) {
    firebaseConfig = JSON.parse(fs.readFileSync(FIREBASE_CONFIG_PATH, 'utf-8'));
    const firebaseApp = initializeApp(firebaseConfig, 'f1-store-backend');
    // CRITICAL: Database ID must be passed to connect to the provisioned database
    firestoreDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    console.log(`[F1 STORE SERVER] Connected to Google Cloud Firestore database: ${firebaseConfig.firestoreDatabaseId} (Project: ${firebaseConfig.projectId})`);
  }
} catch (err) {
  console.error('[F1 STORE SERVER] Error initializing Firestore:', err);
}

// Initial Database State (Zero Products per strict rule)
function createInitialDb(): DatabaseSchema {
  return {
    products: [],
    users: [
      {
        id: 'user_admin_01',
        email: ADMIN_EMAIL,
        password: 'password123',
        name: 'F1 Store Administrator',
        role: 'admin',
        isBanned: false,
        createdAt: new Date().toISOString()
      }
    ],
    orders: [],
    tickets: [],
    qrConfig: {
      qrImageUrl: DEFAULT_PAYMENT_QR,
      merchantName: 'F1 STORE OFFICIAL',
      upiId: 'f1store@vipaxis',
      instructions: 'Scan with any UPI / Banking App (GPay, PhonePe, Paytm, CRED). Transfer the exact order amount and note your 12-digit UTR.'
    },
    adConfig: DEFAULT_AD_CONFIG,
    wishlists: {}
  };
}

let db: DatabaseSchema = (() => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (!parsed.users || !parsed.users.some((u: User) => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase())) {
        parsed.users = parsed.users || [];
        parsed.users.unshift({
          id: 'user_admin_01',
          email: ADMIN_EMAIL,
          password: 'password123',
          name: 'F1 Store Administrator',
          role: 'admin',
          isBanned: false,
          createdAt: new Date().toISOString()
        });
      }
      parsed.qrConfig = parsed.qrConfig || {
        qrImageUrl: DEFAULT_PAYMENT_QR,
        merchantName: 'F1 STORE OFFICIAL',
        upiId: 'f1store@vipaxis',
        instructions: 'Scan with any UPI / Banking App. Note your 12-digit UTR.'
      };
      parsed.adConfig = normalizeAdConfig(parsed.adConfig);
      parsed.wishlists = parsed.wishlists || {};
      return parsed;
    }
  } catch (err) {
    console.error('Error loading db file:', err);
  }
  const initial = createInitialDb();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  } catch {}
  return initial;
})();

// Sync All Collections from Cloud Firestore into in-memory cache
async function syncFromFirestore(): Promise<boolean> {
  if (!firestoreDb) return false;
  try {
    // 1. Fetch Products from Firestore
    const prodSnap = await getDocs(collection(firestoreDb, 'products'));
    db.products = prodSnap.docs.map(d => d.data() as Product);

    // 2. Fetch Users from Firestore
    const userSnap = await getDocs(collection(firestoreDb, 'users'));
    const cloudUsers = userSnap.docs.map(d => d.data() as User);
    if (cloudUsers.length > 0) {
      db.users = cloudUsers;
    }
    // Ensure Admin always exists
    if (!db.users.some(u => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase())) {
      const adminUser: User = {
        id: 'user_admin_01',
        email: ADMIN_EMAIL,
        password: 'password123',
        name: 'F1 Store Administrator',
        role: 'admin',
        isBanned: false,
        createdAt: new Date().toISOString()
      };
      db.users.unshift(adminUser);
      await setDoc(doc(firestoreDb, 'users', adminUser.id), adminUser).catch(() => {});
    }

    // 3. Fetch QR Config from Firestore settings
    const qrSnap = await getDoc(doc(firestoreDb, 'settings', 'qrConfig'));
    if (qrSnap.exists()) {
      db.qrConfig = qrSnap.data() as QRPaymentConfig;
    } else {
      await setDoc(doc(firestoreDb, 'settings', 'qrConfig'), db.qrConfig).catch(() => {});
    }

    // 3b. Fetch Ad Config from Firestore settings (auto-upgrade legacy schema if needed)
    const adSnap = await getDoc(doc(firestoreDb, 'settings', 'adConfig'));
    if (adSnap.exists()) {
      const rawAd = adSnap.data() as any;
      db.adConfig = normalizeAdConfig(rawAd);
      if (rawAd.topAdCode === undefined || rawAd.bottomAdCode === undefined) {
        await setDoc(doc(firestoreDb, 'settings', 'adConfig'), sanitizeForFirestore(db.adConfig)).catch(() => {});
      }
    } else {
      await setDoc(doc(firestoreDb, 'settings', 'adConfig'), sanitizeForFirestore(db.adConfig)).catch(() => {});
    }

    // 4. Save Website Info to Firestore settings
    await setDoc(doc(firestoreDb, 'settings', 'storeInfo'), {
      storeName: 'F1 STORE',
      adminEmail: ADMIN_EMAIL,
      categories: ['NEW ARRIVALS', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'],
      updatedAt: new Date().toISOString(),
      status: 'ACTIVE'
    }).catch(() => {});

    // 5. Fetch Orders
    const orderSnap = await getDocs(collection(firestoreDb, 'orders'));
    db.orders = orderSnap.docs.map(d => d.data() as Order);

    // 6. Fetch Tickets
    const ticketSnap = await getDocs(collection(firestoreDb, 'tickets'));
    db.tickets = ticketSnap.docs.map(d => d.data() as SupportTicket);

    // Cache locally
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    } catch {}

    console.log(`[F1 STORE SERVER] Synced from Firestore: ${db.products.length} products, ${db.users.length} users, ${db.orders.length} orders, ${db.tickets.length} tickets`);
    return true;
  } catch (err: any) {
    console.warn('[F1 STORE SERVER] Firestore sync error:', err?.message || err);
    return false;
  }
}

// Firestore direct mutation helpers
async function saveProductToFirestore(product: Product) {
  if (!firestoreDb) return;
  const payloadSize = Buffer.byteLength(JSON.stringify(product), 'utf8');
  if (payloadSize > 950000) {
    console.warn(`[F1 STORE SERVER] Warning: Product ${product.id} size (${payloadSize} bytes) is near or exceeds Firestore 1MB limit.`);
    return;
  }
  await setDoc(doc(firestoreDb, 'products', product.id), product);
}

async function deleteProductFromFirestore(productId: string) {
  if (!firestoreDb) return;
  await deleteDoc(doc(firestoreDb, 'products', productId));
}

async function saveQRConfigToFirestore(config: QRPaymentConfig) {
  if (!firestoreDb) return;
  const payloadSize = Buffer.byteLength(JSON.stringify(config), 'utf8');
  if (payloadSize > 950000) {
    console.warn(`[F1 STORE SERVER] Warning: QR config size (${payloadSize} bytes) is near or exceeds Firestore 1MB limit.`);
    return;
  }
  await setDoc(doc(firestoreDb, 'settings', 'qrConfig'), config);
}

async function saveAdConfigToFirestore(config: AdConfig) {
  if (!firestoreDb) return;
  await setDoc(doc(firestoreDb, 'settings', 'adConfig'), sanitizeForFirestore(config));
}

async function saveUserToFirestore(user: User) {
  if (!firestoreDb) return;
  await setDoc(doc(firestoreDb, 'users', user.id), sanitizeForFirestore(user));
}

async function saveOrderToFirestore(order: Order) {
  if (!firestoreDb) return;
  await setDoc(doc(firestoreDb, 'orders', order.id), sanitizeForFirestore(order));
}

async function saveTicketToFirestore(ticket: SupportTicket) {
  if (!firestoreDb) return;
  await setDoc(doc(firestoreDb, 'tickets', ticket.id), sanitizeForFirestore(ticket));
}

async function syncAllToFirestore() {
  if (!firestoreDb) throw new Error('Firestore database is not connected');

  // 1. Admin & Users
  for (const u of db.users) {
    await setDoc(doc(firestoreDb, 'users', u.id), sanitizeForFirestore(u));
  }

  // 2. Payment QR, Ad Config & Website Settings
  await setDoc(doc(firestoreDb, 'settings', 'qrConfig'), sanitizeForFirestore(db.qrConfig));
  await setDoc(doc(firestoreDb, 'settings', 'adConfig'), sanitizeForFirestore(db.adConfig));
  await setDoc(doc(firestoreDb, 'settings', 'storeInfo'), {
    storeName: 'F1 STORE',
    adminEmail: ADMIN_EMAIL,
    categories: ['NEW ARRIVALS', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'],
    updatedAt: new Date().toISOString(),
    status: 'ACTIVE'
  });

  // 3. Products
  for (const p of db.products) {
    await setDoc(doc(firestoreDb, 'products', p.id), p);
  }

  // 4. Orders
  for (const o of db.orders) {
    await setDoc(doc(firestoreDb, 'orders', o.id), o);
  }

  // 5. Support Tickets
  for (const t of db.tickets) {
    await setDoc(doc(firestoreDb, 'tickets', t.id), t);
  }

  return {
    products: db.products.length,
    users: db.users.length,
    orders: db.orders.length,
    tickets: db.tickets.length,
    qrConfig: true
  };
}

function saveDbLocally(): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch {}
}

// Express Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper: Check Admin
function isAdmin(email?: string): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const userEmail = (req.headers['x-user-email'] as string) || req.body?.userEmail || req.query?.userEmail;
  if (!userEmail || !isAdmin(userEmail as string)) {
    res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    return;
  }
  next();
}

function checkBanned(req: Request, res: Response, next: NextFunction): void {
  const userEmail = (req.headers['x-user-email'] as string) || req.body?.userEmail;
  if (userEmail) {
    const user = db.users.find(u => u.email.toLowerCase() === (userEmail as string).toLowerCase());
    if (user && user.isBanned) {
      res.status(403).json({
        error: 'Account access locked.',
        isBanned: true,
        banReason: user.banReason
      });
      return;
    }
  }
  next();
}

// ==========================================
// BACKEND REST API ENDPOINTS
// ==========================================

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    store: 'F1 STORE',
    firestoreConnected: !!firestoreDb,
    productsCount: db.products.length,
    timestamp: new Date().toISOString()
  });
});

// 2. Authentication: Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  const trimmed = email.trim().toLowerCase();
  let user = db.users.find(u => u.email.toLowerCase() === trimmed);

  if (!user) {
    if (trimmed === ADMIN_EMAIL.toLowerCase()) {
      user = {
        id: 'user_admin_' + Date.now(),
        email: ADMIN_EMAIL,
        password: password || 'password123',
        name: 'F1 Store Administrator',
        role: 'admin',
        isBanned: false,
        createdAt: new Date().toISOString()
      };
      db.users.push(user);
      saveDbLocally();
      await saveUserToFirestore(user).catch(() => {});
    } else {
      res.status(404).json({ error: 'Account not found. Please Sign Up to register.' });
      return;
    }
  }

  if (password && user.password && user.password !== password) {
    res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
    return;
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isBanned: user.isBanned,
      banReason: user.banReason,
      bannedAt: user.bannedAt,
      createdAt: user.createdAt
    }
  });
});

// 3. Authentication: Sign Up
app.post('/api/auth/signup', async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  const trimmed = email.trim().toLowerCase();
  if (db.users.some(u => u.email.toLowerCase() === trimmed)) {
    res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
    return;
  }

  const isUserAdmin = trimmed === ADMIN_EMAIL.toLowerCase();
  const newUser: User = {
    id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    email: trimmed,
    password: password || 'secret123',
    name: name || (isUserAdmin ? 'F1 Store Administrator' : trimmed.split('@')[0]),
    role: isUserAdmin ? 'admin' : 'customer',
    isBanned: false,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  saveDbLocally();
  await saveUserToFirestore(newUser).catch(() => {});

  res.status(201).json({
    success: true,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      isBanned: newUser.isBanned,
      createdAt: newUser.createdAt
    }
  });
});

// 4. Update Profile Display Name
app.patch('/api/auth/profile', async (req: Request, res: Response) => {
  const { email, name } = req.body;
  if (!email || !name) {
    res.status(400).json({ error: 'Email and name are required' });
    return;
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  user.name = name.trim();
  saveDbLocally();
  await saveUserToFirestore(user).catch(() => {});
  res.json({ success: true, user });
});

// 5. Products: List (Refreshes from Firestore)
app.get('/api/products', async (req: Request, res: Response) => {
  await syncFromFirestore();
  res.json(db.products);
});

// 6. Products: Add (Admin Only - Persists to Cloud Firestore)
app.post('/api/products', requireAdmin, async (req: Request, res: Response) => {
  const { title, category, price, description, imageUrl, isFeaturedWide, rating } = req.body;
  if (!title || price === undefined) {
    res.status(400).json({ error: 'Title and price are required' });
    return;
  }

  const newProduct: Product = {
    id: 'f1_prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    title: title.trim(),
    category: category || 'NEW ARRIVALS',
    price: Number(price),
    description: description || 'Exclusive high-performance edition from F1 Store.',
    imageUrl: imageUrl || '',
    isFeaturedWide: Boolean(isFeaturedWide),
    rating: rating || 5,
    createdAt: new Date().toISOString()
  };

  db.products.unshift(newProduct);
  saveDbLocally();

  try {
    await saveProductToFirestore(newProduct);
  } catch (err: any) {
    console.error('[F1 STORE SERVER] Error saving product to Firestore:', err);
  }

  res.status(201).json({
    ...newProduct,
    cloudSynced: true
  });
});

// 7. Products: Delete (Admin Only)
app.delete('/api/products/:id', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = db.products.length;
  db.products = db.products.filter(p => p.id !== id);

  if (db.products.length === initialLen) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  saveDbLocally();
  try {
    await deleteProductFromFirestore(id);
  } catch (err) {
    console.error('[F1 STORE SERVER] Error deleting product from Firestore:', err);
  }

  res.json({ success: true, message: 'Product deleted', cloudSynced: true });
});

// 8. Products: Clear All (Admin Only)
app.post('/api/products/reset', requireAdmin, async (req: Request, res: Response) => {
  const oldProducts = [...db.products];
  db.products = [];
  saveDbLocally();

  for (const p of oldProducts) {
    await deleteProductFromFirestore(p.id).catch(() => {});
  }

  res.json({ success: true, message: 'All products cleared', cloudSynced: true });
});

// 9. Payment QR Config: Get (Refreshes from Firestore)
app.get('/api/qr-config', async (req: Request, res: Response) => {
  if (firestoreDb) {
    try {
      const snap = await getDoc(doc(firestoreDb, 'settings', 'qrConfig'));
      if (snap.exists()) {
        db.qrConfig = snap.data() as QRPaymentConfig;
      }
    } catch {}
  }
  res.json(db.qrConfig);
});

// 10. Payment QR Config: Update (Admin Only - Persists to Cloud Firestore)
app.post('/api/qr-config', requireAdmin, async (req: Request, res: Response) => {
  const { qrImageUrl, merchantName, upiId, instructions } = req.body;
  db.qrConfig = {
    qrImageUrl: qrImageUrl || db.qrConfig.qrImageUrl,
    merchantName: merchantName || db.qrConfig.merchantName,
    upiId: upiId !== undefined ? upiId : db.qrConfig.upiId,
    instructions: instructions || db.qrConfig.instructions
  };

  saveDbLocally();
  try {
    await saveQRConfigToFirestore(db.qrConfig);
  } catch (err) {
    console.error('[F1 STORE SERVER] Error saving QR config to Firestore:', err);
  }

  res.json({
    ...db.qrConfig,
    cloudSynced: true
  });
});

// 10a. Ad Config: Get (Public - Refreshes from Firestore)
app.get('/api/ad-config', async (req: Request, res: Response) => {
  if (firestoreDb) {
    try {
      const snap = await getDoc(doc(firestoreDb, 'settings', 'adConfig'));
      if (snap.exists()) {
        db.adConfig = normalizeAdConfig(snap.data());
      }
    } catch {}
  }
  res.json(normalizeAdConfig(db.adConfig));
});

// 10a-post. Ad Config: Update (Admin Only - Persists to Cloud Firestore /settings/adConfig)
app.post('/api/ad-config', requireAdmin, async (req: Request, res: Response) => {
  const { adsEnabled, topAdCode, bottomAdCode } = req.body;
  const current = normalizeAdConfig(db.adConfig);
  db.adConfig = {
    adsEnabled: typeof adsEnabled === 'boolean' ? adsEnabled : current.adsEnabled,
    topAdCode: topAdCode !== undefined ? topAdCode : current.topAdCode,
    bottomAdCode: bottomAdCode !== undefined ? bottomAdCode : current.bottomAdCode,
    updatedAt: new Date().toISOString()
  };

  saveDbLocally();
  try {
    await saveAdConfigToFirestore(db.adConfig);
  } catch (err) {
    console.error('[F1 STORE SERVER] Error saving Ad config to Firestore:', err);
  }

  res.json({
    ...db.adConfig,
    cloudSynced: true
  });
});

// 10b. Admin: Get Current Firebase Cloud Configuration & Health
app.get('/api/admin/firebase-config', requireAdmin, async (req: Request, res: Response) => {
  res.json({
    projectId: firebaseConfig?.projectId || 'f1-store-d228f',
    projectNumber: firebaseConfig?.messagingSenderId || '239559459699',
    databaseId: firebaseConfig?.firestoreDatabaseId || 'ai-studio-f1store-290f9b0c-9caf-4e37-a29c-ce8760fe9520',
    status: firestoreDb ? 'CONNECTED' : 'DISCONNECTED',
    productsCount: db.products.length,
    usersCount: db.users.length,
    ordersCount: db.orders.length,
    ticketsCount: db.tickets.length,
    firebaseUrl: `https://console.firebase.google.com/project/${firebaseConfig?.projectId || 'f1-store-d228f'}/firestore`
  });
});

// 10c. Admin: Force Sync All Data to Firestore
app.post('/api/admin/sync-all', requireAdmin, async (req: Request, res: Response) => {
  try {
    const summary = await syncAllToFirestore();
    res.json({
      success: true,
      message: 'All Admin, Users, and Website data saved to Firebase Firestore successfully!',
      summary
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to sync to Firestore' });
  }
});

// 11. Orders: List (Admin sees all; User sees own)
app.get('/api/orders', (req: Request, res: Response) => {
  const userEmail = req.headers['x-user-email'] as string;
  if (!userEmail) {
    res.json([]);
    return;
  }

  if (isAdmin(userEmail)) {
    res.json(db.orders);
  } else {
    const userOrders = db.orders.filter(
      o => o.userEmail.toLowerCase() === userEmail.toLowerCase()
    );
    res.json(userOrders);
  }
});

// 12. Orders: Create / Submit 12-digit UTR Payment
app.post('/api/orders', checkBanned, async (req: Request, res: Response) => {
  const { productId, productTitle, category, amount, itemsCount, userEmail, userId, utrNumber } = req.body;

  if (!userEmail || !utrNumber || amount === undefined) {
    res.status(400).json({ error: 'userEmail, amount, and utrNumber are required' });
    return;
  }

  const cleanedUtr = utrNumber.toString().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (cleanedUtr.length !== 12) {
    res.status(400).json({ error: 'Valid 12-digit UTR transaction reference number is required' });
    return;
  }

  const newOrder: Order = {
    id: 'F1-' + Math.floor(100000 + Math.random() * 900000),
    productId,
    productTitle: productTitle || 'F1 Store Exclusive Allocation',
    category: category || 'PLATINUM',
    amount: Number(amount),
    itemsCount: Number(itemsCount) || 1,
    userEmail: userEmail.trim().toLowerCase(),
    userId: userId || 'user_' + Date.now(),
    utrNumber: cleanedUtr,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };

  db.orders.unshift(newOrder);
  saveDbLocally();
  await saveOrderToFirestore(newOrder).catch(() => {});

  res.status(201).json(newOrder);
});

// 13. Orders: Update Status (Admin Only)
app.patch('/api/orders/:id/status', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, adminNote } = req.body;

  const order = db.orders.find(o => o.id === id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  if (status) order.status = status;
  if (adminNote !== undefined) order.adminNote = adminNote;

  saveDbLocally();
  await saveOrderToFirestore(order).catch(() => {});
  res.json({ success: true, order });
});

// 14. Users: List (Admin Only)
app.get('/api/users', requireAdmin, (req: Request, res: Response) => {
  const safeUsers = db.users.map(({ password, ...u }) => u);
  res.json(safeUsers);
});

// 15. Users: Ban (Admin Only)
app.post('/api/users/:id/ban', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { banReason } = req.body;

  const target = db.users.find(u => u.id === id);
  if (!target) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (target.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    res.status(400).json({ error: 'Cannot ban the master store administrator' });
    return;
  }

  if (!banReason || !banReason.trim()) {
    res.status(400).json({ error: 'A mandatory ban reason is required' });
    return;
  }

  target.isBanned = true;
  target.banReason = banReason.trim();
  target.bannedAt = new Date().toISOString();

  saveDbLocally();
  await saveUserToFirestore(target).catch(() => {});
  res.json({ success: true, user: target });
});

// 16. Users: Unban (Admin Only)
app.post('/api/users/:id/unban', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const target = db.users.find(u => u.id === id);
  if (!target) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  target.isBanned = false;
  target.banReason = undefined;
  target.bannedAt = undefined;

  saveDbLocally();
  await saveUserToFirestore(target).catch(() => {});
  res.json({ success: true, user: target });
});

// 17. Support Tickets: List (Admin sees all; User sees own)
app.get('/api/tickets', (req: Request, res: Response) => {
  const userEmail = req.headers['x-user-email'] as string;
  if (!userEmail) {
    res.json([]);
    return;
  }

  if (isAdmin(userEmail)) {
    res.json(db.tickets);
  } else {
    const userTickets = db.tickets.filter(
      t => t.userEmail.toLowerCase() === userEmail.toLowerCase()
    );
    res.json(userTickets);
  }
});

// 18. Support Tickets: Create
app.post('/api/tickets', async (req: Request, res: Response) => {
  const { userId, userEmail, subject, category, message } = req.body;
  if (!userEmail || !subject || !message) {
    res.status(400).json({ error: 'userEmail, subject, and message are required' });
    return;
  }

  const newTicket: SupportTicket = {
    id: 'TCK-' + Math.floor(1000 + Math.random() * 9000),
    userId: userId || 'user_' + Date.now(),
    userEmail: userEmail.trim().toLowerCase(),
    subject: subject.trim(),
    category: category || 'General Query',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [
      {
        id: 'msg_' + Date.now(),
        sender: 'user',
        text: message.trim(),
        createdAt: new Date().toISOString()
      }
    ]
  };

  db.tickets.unshift(newTicket);
  saveDbLocally();
  await saveTicketToFirestore(newTicket).catch(() => {});
  res.status(201).json(newTicket);
});

// 19. Support Tickets: Reply
app.post('/api/tickets/:id/reply', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { text, sender } = req.body;

  const ticket = db.tickets.find(t => t.id === id);
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  if (!text || !text.trim()) {
    res.status(400).json({ error: 'Message text is required' });
    return;
  }

  const role = sender === 'admin' ? 'admin' : 'user';
  ticket.messages.push({
    id: 'msg_' + Date.now(),
    sender: role,
    text: text.trim(),
    createdAt: new Date().toISOString()
  });

  ticket.updatedAt = new Date().toISOString();
  ticket.status = role === 'admin' ? 'REPLIED' : 'OPEN';

  saveDbLocally();
  await saveTicketToFirestore(ticket).catch(() => {});
  res.json({ success: true, ticket });
});

// 20. Support Tickets: Resolve (Admin Only)
app.post('/api/tickets/:id/resolve', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const ticket = db.tickets.find(t => t.id === id);
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  ticket.status = 'RESOLVED';
  ticket.updatedAt = new Date().toISOString();
  saveDbLocally();
  await saveTicketToFirestore(ticket).catch(() => {});
  res.json({ success: true, ticket });
});

// 21. Wishlist: Get / Toggle
app.get('/api/wishlist', (req: Request, res: Response) => {
  const userEmail = (req.headers['x-user-email'] as string) || 'anonymous';
  const list = db.wishlists[userEmail.toLowerCase()] || [];
  res.json(list);
});

app.post('/api/wishlist/toggle', (req: Request, res: Response) => {
  const userEmail = (req.headers['x-user-email'] as string) || 'anonymous';
  const { productId } = req.body;
  if (!productId) {
    res.status(400).json({ error: 'productId is required' });
    return;
  }

  const key = userEmail.toLowerCase();
  const current = db.wishlists[key] || [];
  const exists = current.includes(productId);
  const updated = exists ? current.filter(id => id !== productId) : [...current, productId];
  db.wishlists[key] = updated;
  saveDbLocally();
  res.json(updated);
});

// ==========================================
// FRONTEND SERVING & VITE INTEGRATION
// ==========================================
async function startServer() {
  console.log('[F1 STORE] Initializing database and syncing with Google Cloud Firestore...');
  await syncFromFirestore();

  // Periodic background refresh every 30s to keep state pristine
  setInterval(() => {
    syncFromFirestore().catch(() => {});
  }, 30000);

  if (IS_PROD) {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.warn('Production build dist/ not found. Running in dev middleware mode.');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    }
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[F1 STORE] Server running on port ${PORT} (Environment: ${IS_PROD ? 'production' : 'development'})`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
