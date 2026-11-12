import { Product, User, Order, SupportTicket, QRPaymentConfig } from '../types';
import { DEFAULT_PAYMENT_QR } from './defaultQR';
import {
  COLLECTIONS,
  firestoreSaveProduct,
  firestoreDeleteProduct,
  firestoreGetQRConfig,
  firestoreSaveQRConfig,
  firestoreSaveUser,
  firestoreSaveOrder,
  firestoreSaveTicket,
  subscribeToProducts,
  subscribeToQRConfig,
  subscribeToOrders,
  subscribeToUsers,
  subscribeToTickets,
  firestoreSyncAllToCloud,
  firestoreGetProducts,
  firestoreGetOrders,
  firestoreGetUsers,
  firestoreGetTickets
} from './firebase';

export const ADMIN_EMAIL = 'deshmaneadinath128@gmail.com';

const STORAGE_KEYS = {
  PRODUCTS: 'f1_store_products',
  USERS: 'f1_store_users',
  CURRENT_USER: 'f1_store_current_user',
  ORDERS: 'f1_store_orders',
  TICKETS: 'f1_store_support_tickets',
  QR_CONFIG: 'f1_store_qr_config',
  CART: 'f1_store_cart',
  WISHLIST: 'f1_store_wishlist'
};

// Safe localStorage wrapper
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to localStorage:`, err);
  }
}

// API Helper for Backend Server Sync
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const currentUser = getCurrentUser();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(currentUser?.email ? { 'x-user-email': currentUser.email } : {})
    };

    const res = await fetch(endpoint, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers as Record<string, string>)
      }
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn(`API ${endpoint} error:`, errData.error || res.statusText);
      return null;
    }

    return await res.json();
  } catch (err) {
    // Graceful offline / fallback to local cache
    return null;
  }
}

// Strict API Helper for mutating operations
export async function apiRequestStrict<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const currentUser = getCurrentUser();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(currentUser?.email ? { 'x-user-email': currentUser.email } : {})
  };

  const res = await fetch(endpoint, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string>)
    }
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const message = errData.error || `Request failed with HTTP status ${res.status}: ${res.statusText}`;
    throw new Error(message);
  }

  return await res.json();
}

// Background sync function called periodically and on init
export async function syncWithBackend(): Promise<void> {
  const currentUser = getCurrentUser();
  const headers: Record<string, string> = currentUser?.email ? { 'x-user-email': currentUser.email } : {};

  // Sync from server API as secondary backup
  try {
    const serverProducts = await apiRequest<Product[]>('/api/products');
    if (serverProducts !== null && serverProducts.length > 0) {
      setItem(STORAGE_KEYS.PRODUCTS, serverProducts);
      window.dispatchEvent(new Event('f1_products_updated'));
    }

    const serverQR = await apiRequest<QRPaymentConfig>('/api/qr-config');
    if (serverQR !== null && serverQR.qrImageUrl) {
      setItem(STORAGE_KEYS.QR_CONFIG, serverQR);
      window.dispatchEvent(new Event('f1_qr_updated'));
    }

    if (currentUser) {
      const serverOrders = await apiRequest<Order[]>('/api/orders', { headers });
      if (serverOrders !== null) {
        setItem(STORAGE_KEYS.ORDERS, serverOrders);
        window.dispatchEvent(new Event('f1_orders_updated'));
      }

      const serverTickets = await apiRequest<SupportTicket[]>('/api/tickets', { headers });
      if (serverTickets !== null) {
        setItem(STORAGE_KEYS.TICKETS, serverTickets);
        window.dispatchEvent(new Event('f1_tickets_updated'));
      }

      if (isAdminUser(currentUser)) {
        const serverUsers = await apiRequest<User[]>('/api/users', { headers });
        if (serverUsers !== null) {
          setItem(STORAGE_KEYS.USERS, serverUsers);
          window.dispatchEvent(new Event('f1_users_updated'));
        }
      }
    }
  } catch (e) {
    // Silent failover
  }
}

// Set up live Firestore real-time listeners on client mount
if (typeof window !== 'undefined') {
  try {
    // 1. Live Products listener
    subscribeToProducts((cloudProducts) => {
      setItem(STORAGE_KEYS.PRODUCTS, cloudProducts);
      window.dispatchEvent(new Event('f1_products_updated'));
    });

    // 2. Live Payment QR listener
    subscribeToQRConfig((cloudQR) => {
      if (cloudQR && cloudQR.qrImageUrl) {
        setItem(STORAGE_KEYS.QR_CONFIG, cloudQR);
        window.dispatchEvent(new Event('f1_qr_updated'));
      }
    });

    // 3. Live Orders listener
    subscribeToOrders((cloudOrders) => {
      if (cloudOrders && cloudOrders.length > 0) {
        setItem(STORAGE_KEYS.ORDERS, cloudOrders);
        window.dispatchEvent(new Event('f1_orders_updated'));
      }
    });

    // 4. Live Users listener
    subscribeToUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        setItem(STORAGE_KEYS.USERS, cloudUsers);
        window.dispatchEvent(new Event('f1_users_updated'));
      }
    });

    // 5. Live Tickets listener
    subscribeToTickets((cloudTickets) => {
      if (cloudTickets && cloudTickets.length > 0) {
        setItem(STORAGE_KEYS.TICKETS, cloudTickets);
        window.dispatchEvent(new Event('f1_tickets_updated'));
      }
    });

    // Initial check: if QR config not yet in Firestore, seed the default luxury payment QR
    firestoreGetQRConfig().then((cloudQR) => {
      if (!cloudQR) {
        firestoreSaveQRConfig(DEFAULT_CONFIG).catch(() => {});
      } else {
        setItem(STORAGE_KEYS.QR_CONFIG, cloudQR);
        window.dispatchEvent(new Event('f1_qr_updated'));
      }
    }).catch(() => {});

    // Ensure master admin user is always seeded in Firestore
    const adminUser = getUsers().find(u => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    if (adminUser) {
      firestoreSaveUser(adminUser).catch(() => {});
    }
  } catch (err) {
    console.warn('[F1 STORE Firebase] Listener init warning:', err);
  }

  // Also run secondary server sync
  setTimeout(() => syncWithBackend(), 500);
  setInterval(() => syncWithBackend(), 15000);
}

// Master Cloud Push: Forces all admin, user, and website data into Cloud Firestore
export async function syncAllStoreDataToFirebase(): Promise<{
  success: boolean;
  message: string;
  summary: { products: number; users: number; orders: number; tickets: number };
}> {
  const currentProducts = getProducts();
  const currentUsers = getUsers();
  const currentOrders = getOrders();
  const currentTickets = getTickets();
  const currentQR = getQRConfig();

  // 1. Client Direct Push to Firestore
  const summary = await firestoreSyncAllToCloud({
    products: currentProducts,
    users: currentUsers,
    orders: currentOrders,
    tickets: currentTickets,
    qrConfig: currentQR
  });

  // 2. Server API Push to Firestore
  await apiRequest('/api/admin/sync-all', { method: 'POST' }).catch(() => {});

  return {
    success: true,
    message: 'All Admin, Users, and Website data saved to Firebase successfully!',
    summary
  };
}

// 1. Initial Products Setup (Strictly Empty per Critical Rule: Zero Pre-Added or Fashion Products)
export function getProducts(): Product[] {
  return getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
}

export async function saveProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
  const newProduct: Product = {
    id: 'f1_prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    title: product.title.trim(),
    category: product.category,
    price: Number(product.price),
    description: product.description,
    imageUrl: product.imageUrl,
    isFeaturedWide: Boolean(product.isFeaturedWide),
    rating: product.rating || 5,
    createdAt: new Date().toISOString()
  };

  // 1. Save directly to Firebase Firestore
  try {
    await firestoreSaveProduct(newProduct);
  } catch (err: any) {
    console.error('Failed to save to Firestore:', err);
    throw new Error(err.message || 'Failed to save product to Firebase');
  }

  // 2. Update local state
  const products = getProducts();
  const updated = [newProduct, ...products.filter(p => p.id !== newProduct.id)];
  setItem(STORAGE_KEYS.PRODUCTS, updated);
  window.dispatchEvent(new Event('f1_products_updated'));

  // 3. Sync to backend server
  apiRequest('/api/products', {
    method: 'POST',
    body: JSON.stringify(newProduct)
  }).catch(() => {});

  return newProduct;
}

export async function deleteProduct(productId: string): Promise<void> {
  // 1. Delete from Firebase Firestore
  try {
    await firestoreDeleteProduct(productId);
  } catch (err: any) {
    console.error('Failed to delete from Firestore:', err);
    throw new Error(err.message || 'Failed to delete product from Firebase');
  }

  // 2. Update local state
  const products = getProducts().filter(p => p.id !== productId);
  setItem(STORAGE_KEYS.PRODUCTS, products);
  window.dispatchEvent(new Event('f1_products_updated'));

  // 3. Sync to backend
  apiRequest(`/api/products/${productId}`, { method: 'DELETE' }).catch(() => {});
}

export async function clearAllProducts(): Promise<void> {
  const products = getProducts();
  for (const p of products) {
    await firestoreDeleteProduct(p.id).catch(() => {});
  }
  setItem(STORAGE_KEYS.PRODUCTS, []);
  window.dispatchEvent(new Event('f1_products_updated'));
  apiRequest('/api/products/reset', { method: 'POST' }).catch(() => {});
}

// 2. Payment QR Configuration
const DEFAULT_CONFIG: QRPaymentConfig = {
  qrImageUrl: DEFAULT_PAYMENT_QR,
  merchantName: 'F1 STORE OFFICIAL',
  upiId: 'f1store@vipaxis',
  instructions: 'Scan with any UPI / Banking App (GPay, PhonePe, Paytm, CRED). Transfer the exact order amount and note your 12-digit UTR.'
};

export function getQRConfig(): QRPaymentConfig {
  return getItem<QRPaymentConfig>(STORAGE_KEYS.QR_CONFIG, DEFAULT_CONFIG);
}

export async function updateQRConfig(newConfig: Partial<QRPaymentConfig>): Promise<QRPaymentConfig> {
  const current = getQRConfig();
  const updated: QRPaymentConfig = { ...current, ...newConfig };

  // 1. Save directly to Firebase Firestore
  try {
    await firestoreSaveQRConfig(updated);
  } catch (err: any) {
    console.error('Failed to save QR Config to Firestore:', err);
    throw new Error(err.message || 'Failed to save Payment QR to Firebase');
  }

  // 2. Update local state
  setItem(STORAGE_KEYS.QR_CONFIG, updated);
  window.dispatchEvent(new Event('f1_qr_updated'));

  // 3. Sync to backend
  apiRequest('/api/qr-config', {
    method: 'POST',
    body: JSON.stringify(updated)
  }).catch(() => {});

  return updated;
}

// Firebase Cloud Database Info
export interface FirebaseInfoResponse {
  projectId: string;
  projectNumber: string;
  databaseId: string;
  status: 'CONNECTED' | 'DISCONNECTED';
  type: string;
}

export function getFirebaseProjectInfo(): FirebaseInfoResponse {
  return {
    projectId: 'f1-store-d228f',
    projectNumber: '239559459699',
    databaseId: 'ai-studio-f1store-290f9b0c-9caf-4e37-a29c-ce8760fe9520',
    status: 'CONNECTED',
    type: 'Cloud Firestore Database (Native)'
  };
}

export interface FirebaseConfigResponse {
  firebaseUrl: string;
  status: 'CONNECTED' | 'DISCONNECTED';
  error: string | null;
}

export async function getFirebaseConfig(): Promise<FirebaseConfigResponse | null> {
  return await apiRequest<FirebaseConfigResponse>('/api/admin/firebase-config');
}

export async function saveFirebaseConfig(firebaseUrl: string): Promise<{ success: boolean; message?: string; firebaseUrl?: string }> {
  return await apiRequestStrict<{ success: boolean; message?: string; firebaseUrl?: string }>('/api/admin/firebase-config', {
    method: 'POST',
    body: JSON.stringify({ firebaseUrl })
  });
}

// 3. User Management & Authentication
function seedInitialUsers(): User[] {
  const defaultAdmin: User = {
    id: 'user_admin_01',
    email: ADMIN_EMAIL,
    password: 'password123',
    name: 'F1 Store Administrator',
    role: 'admin',
    isBanned: false,
    createdAt: new Date().toISOString()
  };
  return [defaultAdmin];
}

export function getUsers(): User[] {
  const users = getItem<User[]>(STORAGE_KEYS.USERS, []);
  if (users.length === 0) {
    const seeded = seedInitialUsers();
    setItem(STORAGE_KEYS.USERS, seeded);
    return seeded;
  }
  const hasAdmin = users.some(u => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
  if (!hasAdmin) {
    const defaultAdmin: User = {
      id: 'user_admin_01',
      email: ADMIN_EMAIL,
      password: 'password123',
      name: 'F1 Store Administrator',
      role: 'admin',
      isBanned: false,
      createdAt: new Date().toISOString()
    };
    users.push(defaultAdmin);
    setItem(STORAGE_KEYS.USERS, users);
  }
  return users;
}

export function getCurrentUser(): User | null {
  const user = getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  if (!user) return null;
  const allUsers = getUsers();
  const fresh = allUsers.find(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
  return fresh || user;
}

export function setCurrentUser(user: User | null): void {
  setItem(STORAGE_KEYS.CURRENT_USER, user);
  window.dispatchEvent(new Event('f1_auth_updated'));
}

export function loginUser(email: string, password?: string): { success: boolean; user?: User; error?: string } {
  const users = getUsers();
  const trimmed = email.trim().toLowerCase();
  let user = users.find(u => u.email.toLowerCase() === trimmed);

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
      users.push(user);
      setItem(STORAGE_KEYS.USERS, users);
      firestoreSaveUser(user).catch(() => {});
    } else {
      return { success: false, error: 'User not found. Please Sign Up to create your account.' };
    }
  }

  if (password && user.password && user.password !== password) {
    return { success: false, error: 'Invalid password. Please check your credentials.' };
  }

  setCurrentUser(user);

  // Sync to Firestore
  firestoreSaveUser(user).catch(() => {});

  // Sync to backend
  apiRequest<{ success: boolean; user: User }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: trimmed, password })
  }).then(res => {
    if (res?.user) {
      setCurrentUser(res.user);
    }
  });

  return { success: true, user };
}

export function signUpUser(email: string, password?: string, name?: string): { success: boolean; user?: User; error?: string } {
  const trimmed = email.trim().toLowerCase();
  const users = getUsers();

  if (users.some(u => u.email.toLowerCase() === trimmed)) {
    return { success: false, error: 'An account with this email already exists. Please log in.' };
  }

  const isAdmin = trimmed === ADMIN_EMAIL.toLowerCase();
  const newUser: User = {
    id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    email: trimmed,
    password: password || 'secret123',
    name: name || (isAdmin ? 'F1 Store Administrator' : trimmed.split('@')[0]),
    role: isAdmin ? 'admin' : 'customer',
    isBanned: false,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  setItem(STORAGE_KEYS.USERS, users);
  setCurrentUser(newUser);

  // Sync to Firestore
  firestoreSaveUser(newUser).catch(() => {});

  // Sync to backend
  apiRequest<{ success: boolean; user: User }>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email: trimmed, password, name })
  }).then(res => {
    if (res?.user) {
      setCurrentUser(res.user);
    }
  });

  return { success: true, user: newUser };
}

export function logoutUser(): void {
  setCurrentUser(null);
}

export function banUser(userId: string, reason: string): boolean {
  const users = getUsers();
  const target = users.find(u => u.id === userId);
  if (!target) return false;
  if (target.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return false;
  }
  target.isBanned = true;
  target.banReason = reason.trim() || 'Terms of service violation detected.';
  target.bannedAt = new Date().toISOString();
  setItem(STORAGE_KEYS.USERS, users);

  const current = getCurrentUser();
  if (current && current.id === userId) {
    setCurrentUser(target);
  }
  window.dispatchEvent(new Event('f1_users_updated'));

  // Sync to Firestore & backend
  firestoreSaveUser(target).catch(() => {});
  apiRequest(`/api/users/${userId}/ban`, {
    method: 'POST',
    body: JSON.stringify({ banReason: reason })
  }).catch(() => {});

  return true;
}

export function unbanUser(userId: string): boolean {
  const users = getUsers();
  const target = users.find(u => u.id === userId);
  if (!target) return false;
  target.isBanned = false;
  target.banReason = undefined;
  target.bannedAt = undefined;
  setItem(STORAGE_KEYS.USERS, users);

  const current = getCurrentUser();
  if (current && current.id === userId) {
    setCurrentUser(target);
  }
  window.dispatchEvent(new Event('f1_users_updated'));

  // Sync to Firestore & backend
  firestoreSaveUser(target).catch(() => {});
  apiRequest(`/api/users/${userId}/unban`, { method: 'POST' }).catch(() => {});

  return true;
}

// 4. Orders & Payment Confirmations
export function getOrders(): Order[] {
  return getItem<Order[]>(STORAGE_KEYS.ORDERS, []);
}

export function createOrder(data: {
  productId?: string;
  productTitle: string;
  category: string;
  amount: number;
  itemsCount: number;
  userEmail: string;
  userId: string;
  utrNumber: string;
}): Order {
  const orders = getOrders();
  const newOrder: Order = {
    id: 'F1-' + Math.floor(100000 + Math.random() * 900000),
    ...data,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };
  const updated = [newOrder, ...orders];
  setItem(STORAGE_KEYS.ORDERS, updated);
  window.dispatchEvent(new Event('f1_orders_updated'));

  // Sync to Firestore
  firestoreSaveOrder(newOrder).catch(() => {});

  // Sync to backend
  apiRequest<Order>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(data)
  }).catch(() => {});

  return newOrder;
}

export function updateOrderStatus(orderId: string, status: 'APPROVED' | 'REJECTED', adminNote?: string): boolean {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return false;
  order.status = status;
  if (adminNote) order.adminNote = adminNote;
  setItem(STORAGE_KEYS.ORDERS, orders);
  window.dispatchEvent(new Event('f1_orders_updated'));

  // Sync to Firestore
  firestoreSaveOrder(order).catch(() => {});

  // Sync to backend
  apiRequest(`/api/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, adminNote })
  }).catch(() => {});

  return true;
}

// 5. In-App Private Customer Support Tickets
export function getTickets(): SupportTicket[] {
  return getItem<SupportTicket[]>(STORAGE_KEYS.TICKETS, []);
}

export function createTicket(data: {
  userId: string;
  userEmail: string;
  subject: string;
  category: string;
  message: string;
}): SupportTicket {
  const tickets = getTickets();
  const newTicket: SupportTicket = {
    id: 'TCK-' + Math.floor(1000 + Math.random() * 9000),
    userId: data.userId,
    userEmail: data.userEmail,
    subject: data.subject,
    category: data.category as any,
    status: 'OPEN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [
      {
        id: 'msg_' + Date.now(),
        sender: 'user',
        text: data.message,
        createdAt: new Date().toISOString()
      }
    ]
  };
  const updated = [newTicket, ...tickets];
  setItem(STORAGE_KEYS.TICKETS, updated);
  window.dispatchEvent(new Event('f1_tickets_updated'));

  // Sync to Firestore
  firestoreSaveTicket(newTicket).catch(() => {});

  // Sync to backend
  apiRequest<SupportTicket>('/api/tickets', {
    method: 'POST',
    body: JSON.stringify(data)
  }).catch(() => {});

  return newTicket;
}

export function replyToTicket(ticketId: string, text: string, sender: 'admin' | 'user'): boolean {
  const tickets = getTickets();
  const ticket = tickets.find(t => t.id === ticketId);
  if (!ticket) return false;

  ticket.messages.push({
    id: 'msg_' + Date.now(),
    sender,
    text,
    createdAt: new Date().toISOString()
  });

  ticket.updatedAt = new Date().toISOString();
  if (sender === 'admin') {
    ticket.status = 'REPLIED';
  } else {
    ticket.status = 'OPEN';
  }

  setItem(STORAGE_KEYS.TICKETS, tickets);
  window.dispatchEvent(new Event('f1_tickets_updated'));

  // Sync to Firestore
  firestoreSaveTicket(ticket).catch(() => {});

  // Sync to backend
  apiRequest(`/api/tickets/${ticketId}/reply`, {
    method: 'POST',
    body: JSON.stringify({ text, sender })
  }).catch(() => {});

  return true;
}

export function resolveTicket(ticketId: string): boolean {
  const tickets = getTickets();
  const ticket = tickets.find(t => t.id === ticketId);
  if (!ticket) return false;
  ticket.status = 'RESOLVED';
  ticket.updatedAt = new Date().toISOString();
  setItem(STORAGE_KEYS.TICKETS, tickets);
  window.dispatchEvent(new Event('f1_tickets_updated'));

  // Sync to Firestore
  firestoreSaveTicket(ticket).catch(() => {});

  // Sync to backend
  apiRequest(`/api/tickets/${ticketId}/resolve`, {
    method: 'POST'
  }).catch(() => {});

  return true;
}

// Admin Check Utility
export function isAdminUser(user: User | null): boolean {
  if (!user) return false;
  return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

// User Profile Update (Display Name)
export function updateUserDisplayName(userId: string, newName: string): User | null {
  const users = getUsers();
  const target = users.find(u => u.id === userId);
  if (!target) return null;

  target.name = newName.trim();
  setItem(STORAGE_KEYS.USERS, users);

  const current = getCurrentUser();
  if (current && (current.id === userId || current.email.toLowerCase() === target.email.toLowerCase())) {
    current.name = target.name;
    setCurrentUser(current);
  }

  window.dispatchEvent(new Event('f1_users_updated'));

  // Sync to Firestore & backend
  firestoreSaveUser(target).catch(() => {});
  if (current?.email) {
    apiRequest('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify({ email: current.email, name: target.name })
    }).catch(() => {});
  }

  return target;
}

// User-Specific Orders Query
export function getUserOrders(userEmail: string, userId?: string): Order[] {
  const allOrders = getOrders();
  const lowerEmail = userEmail.toLowerCase();
  return allOrders.filter(
    o => o.userEmail.toLowerCase() === lowerEmail || (userId && o.userId === userId)
  );
}

// Wishlist Persistence
export function getWishlist(): string[] {
  return getItem<string[]>(STORAGE_KEYS.WISHLIST, []);
}

export function toggleWishlist(productId: string): string[] {
  const current = getWishlist();
  const exists = current.includes(productId);
  const updated = exists ? current.filter(id => id !== productId) : [...current, productId];
  setItem(STORAGE_KEYS.WISHLIST, updated);
  window.dispatchEvent(new Event('f1_wishlist_updated'));

  // Sync to Backend
  const currentUser = getCurrentUser();
  apiRequest('/api/wishlist/toggle', {
    method: 'POST',
    body: JSON.stringify({ productId }),
    headers: { 'x-user-email': currentUser?.email || 'anonymous' }
  }).catch(() => {});

  return updated;
}

export function isItemInWishlist(productId: string): boolean {
  const current = getWishlist();
  return current.includes(productId);
}
