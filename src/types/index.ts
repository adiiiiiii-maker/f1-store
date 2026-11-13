export type CategoryType = 'NEW ARRIVALS' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';

export const CATEGORIES: CategoryType[] = [
  'NEW ARRIVALS',
  'SILVER',
  'GOLD',
  'PLATINUM',
  'DIAMOND'
];

export interface Product {
  id: string;
  title: string;
  category: CategoryType;
  price: number;
  description: string;
  imageUrl: string;
  isFeaturedWide?: boolean;
  rating?: number;
  createdAt: string;
}

export interface User {
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

export interface Order {
  id: string;
  productId?: string;
  productTitle: string;
  category: string;
  amount: number;
  itemsCount: number;
  userEmail: string;
  userId: string;
  utrNumber: string; // 12-digit UTR
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote?: string;
  createdAt: string;
}

export interface SupportMessage {
  id: string;
  sender: 'user' | 'admin';
  text: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  subject: string;
  category: 'Payment / UTR' | 'Account Issue' | 'Ban Appeal' | 'General Query';
  status: 'OPEN' | 'REPLIED' | 'RESOLVED';
  messages: SupportMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface QRPaymentConfig {
  qrImageUrl: string;
  merchantName: string;
  upiId?: string;
  instructions: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AdConfig {
  adsEnabled: boolean;
  topAdCode: string;
  bottomAdCode: string;
  updatedAt?: string;
}

