import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product, User, Order, SupportTicket, QRPaymentConfig, AdConfig } from '../types';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// CRITICAL: Always pass firestoreDatabaseId to connect to the provisioned database
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Operation types for error reporting
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ----------------------------------------------------
// Firestore Collections & Document Operations
// ----------------------------------------------------

export const COLLECTIONS = {
  PRODUCTS: 'products',
  SETTINGS: 'settings',
  USERS: 'users',
  ORDERS: 'orders',
  TICKETS: 'tickets',
  WISHLISTS: 'wishlists'
};

export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean as T;
}

// 1. Products
export async function firestoreGetProducts(): Promise<Product[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
    return snap.docs.map(d => d.data() as Product);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, COLLECTIONS.PRODUCTS);
  }
}

export async function firestoreSaveProduct(product: Product): Promise<void> {
  const path = `${COLLECTIONS.PRODUCTS}/${product.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.PRODUCTS, product.id), sanitizeForFirestore(product));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function firestoreDeleteProduct(productId: string): Promise<void> {
  const path = `${COLLECTIONS.PRODUCTS}/${productId}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// 2. Settings (Payment QR Gateway)
export async function firestoreGetQRConfig(): Promise<QRPaymentConfig | null> {
  const path = `${COLLECTIONS.SETTINGS}/qrConfig`;
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.SETTINGS, 'qrConfig'));
    if (snap.exists()) {
      return snap.data() as QRPaymentConfig;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function firestoreSaveQRConfig(config: QRPaymentConfig): Promise<void> {
  const path = `${COLLECTIONS.SETTINGS}/qrConfig`;
  try {
    await setDoc(doc(db, COLLECTIONS.SETTINGS, 'qrConfig'), sanitizeForFirestore(config));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// 2b. Settings (Ad Manager Config at /settings/adConfig)
export async function firestoreGetAdConfig(): Promise<AdConfig | null> {
  const path = `${COLLECTIONS.SETTINGS}/adConfig`;
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.SETTINGS, 'adConfig'));
    if (snap.exists()) {
      return snap.data() as AdConfig;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function firestoreSaveAdConfig(config: AdConfig): Promise<void> {
  const path = `${COLLECTIONS.SETTINGS}/adConfig`;
  try {
    await setDoc(doc(db, COLLECTIONS.SETTINGS, 'adConfig'), sanitizeForFirestore(config));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function testFirestoreConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, COLLECTIONS.SETTINGS, 'adConfig'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

// 3. Users
export async function firestoreGetUsers(): Promise<User[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.USERS));
    return snap.docs.map(d => d.data() as User);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, COLLECTIONS.USERS);
  }
}

export async function firestoreSaveUser(user: User): Promise<void> {
  const path = `${COLLECTIONS.USERS}/${user.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.USERS, user.id), sanitizeForFirestore(user));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// 4. Orders
export async function firestoreGetOrders(): Promise<Order[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.ORDERS));
    return snap.docs.map(d => d.data() as Order);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, COLLECTIONS.ORDERS);
  }
}

export async function firestoreSaveOrder(order: Order): Promise<void> {
  const path = `${COLLECTIONS.ORDERS}/${order.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.ORDERS, order.id), sanitizeForFirestore(order));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// 5. Support Tickets
export async function firestoreGetTickets(): Promise<SupportTicket[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.TICKETS));
    return snap.docs.map(d => d.data() as SupportTicket);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, COLLECTIONS.TICKETS);
  }
}

export async function firestoreSaveTicket(ticket: SupportTicket): Promise<void> {
  const path = `${COLLECTIONS.TICKETS}/${ticket.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.TICKETS, ticket.id), sanitizeForFirestore(ticket));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// 6. Realtime Listeners
export function subscribeToProducts(onData: (products: Product[]) => void): () => void {
  const unsub = onSnapshot(
    collection(db, COLLECTIONS.PRODUCTS),
    (snap) => {
      const items = snap.docs.map(d => d.data() as Product);
      onData(items);
    },
    (err) => {
      console.warn('Products subscription warning:', err);
    }
  );
  return unsub;
}

export function subscribeToQRConfig(onData: (config: QRPaymentConfig) => void): () => void {
  const unsub = onSnapshot(
    doc(db, COLLECTIONS.SETTINGS, 'qrConfig'),
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as QRPaymentConfig);
      }
    },
    (err) => {
      console.warn('QR Config subscription warning:', err);
    }
  );
  return unsub;
}

export function subscribeToAdConfig(onData: (config: AdConfig) => void): () => void {
  const unsub = onSnapshot(
    doc(db, COLLECTIONS.SETTINGS, 'adConfig'),
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as AdConfig);
      }
    },
    (err) => {
      console.warn('Ad Config subscription warning:', err);
    }
  );
  return unsub;
}

export function subscribeToOrders(onData: (orders: Order[]) => void): () => void {
  const unsub = onSnapshot(
    collection(db, COLLECTIONS.ORDERS),
    (snap) => {
      const items = snap.docs.map(d => d.data() as Order);
      onData(items);
    },
    (err) => {
      console.warn('Orders subscription warning:', err);
    }
  );
  return unsub;
}

export function subscribeToUsers(onData: (users: User[]) => void): () => void {
  const unsub = onSnapshot(
    collection(db, COLLECTIONS.USERS),
    (snap) => {
      const items = snap.docs.map(d => d.data() as User);
      onData(items);
    },
    (err) => {
      console.warn('Users subscription warning:', err);
    }
  );
  return unsub;
}

export function subscribeToTickets(onData: (tickets: SupportTicket[]) => void): () => void {
  const unsub = onSnapshot(
    collection(db, COLLECTIONS.TICKETS),
    (snap) => {
      const items = snap.docs.map(d => d.data() as SupportTicket);
      onData(items);
    },
    (err) => {
      console.warn('Tickets subscription warning:', err);
    }
  );
  return unsub;
}

export async function firestoreSyncAllToCloud(data: {
  products: Product[];
  users: User[];
  orders: Order[];
  tickets: SupportTicket[];
  qrConfig: QRPaymentConfig;
  adConfig?: AdConfig;
}): Promise<{ products: number; users: number; orders: number; tickets: number }> {
  // 1. Sync Users
  for (const u of data.users) {
    await firestoreSaveUser(u);
  }

  // 2. Sync QR
  await firestoreSaveQRConfig(data.qrConfig);

  // 2b. Sync Ad Config if provided
  if (data.adConfig) {
    await firestoreSaveAdConfig(data.adConfig);
  }

  // 3. Sync Store Info
  await setDoc(doc(db, COLLECTIONS.SETTINGS, 'storeInfo'), {
    storeName: 'F1 STORE',
    adminEmail: 'deshmaneadinath128@gmail.com',
    categories: ['NEW ARRIVALS', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'],
    updatedAt: new Date().toISOString(),
    status: 'ACTIVE'
  });

  // 4. Sync Products
  for (const p of data.products) {
    await firestoreSaveProduct(p);
  }

  // 5. Sync Orders
  for (const o of data.orders) {
    await firestoreSaveOrder(o);
  }

  // 6. Sync Tickets
  for (const t of data.tickets) {
    await firestoreSaveTicket(t);
  }

  return {
    products: data.products.length,
    users: data.users.length,
    orders: data.orders.length,
    tickets: data.tickets.length
  };
}
