import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Package,
  QrCode,
  Users,
  ClipboardList,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Shield,
  ArrowRight,
  ExternalLink,
  Ban,
  UserCheck,
  Sparkles,
  TrendingUp,
  Loader2,
  Database,
  RefreshCw
} from 'lucide-react';
import { compressImage, getBase64ByteSize, formatBytes } from '../utils/imageCompressor';
import { SalesOverviewChart } from './SalesOverviewChart';
import {
  Product,
  CategoryType,
  CATEGORIES,
  User,
  Order,
  SupportTicket,
  QRPaymentConfig
} from '../types';
import {
  getProducts,
  saveProduct,
  deleteProduct,
  clearAllProducts,
  getQRConfig,
  updateQRConfig,
  getUsers,
  banUser,
  unbanUser,
  getOrders,
  updateOrderStatus,
  getTickets,
  replyToTicket,
  resolveTicket,
  isAdminUser,
  ADMIN_EMAIL,
  getFirebaseConfig,
  saveFirebaseConfig,
  getFirebaseProjectInfo,
  syncAllStoreDataToFirebase
} from '../services/storage';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'sales' | 'items' | 'qr' | 'users' | 'orders' | 'firebase'>('sales');

  // State data
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [qrConfig, setQrConfig] = useState<QRPaymentConfig>(getQRConfig());

  // Form states for Manage Items
  const [itemTitle, setItemTitle] = useState('');
  const [itemCategory, setItemCategory] = useState<CategoryType>('NEW ARRIVALS');
  const [itemPrice, setItemPrice] = useState<number | ''>('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [itemIsFeatured, setItemIsFeatured] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPublishingItem, setIsPublishingItem] = useState(false);
  const [isCompressingProductImage, setIsCompressingProductImage] = useState(false);
  const [productImageSizeInfo, setProductImageSizeInfo] = useState<{ size: number; formatted: string } | null>(null);
  const [itemPublishError, setItemPublishError] = useState('');
  const [itemPublishSuccess, setItemPublishSuccess] = useState(false);

  // Form states for Manage QR
  const [qrMerchant, setQrMerchant] = useState('');
  const [qrUpi, setQrUpi] = useState('');
  const [qrInstructions, setQrInstructions] = useState('');
  const [qrImagePreview, setQrImagePreview] = useState('');
  const qrFileInputRef = useRef<HTMLInputElement | null>(null);
  const [qrSaveSuccess, setQrSaveSuccess] = useState(false);
  const [isCompressingQR, setIsCompressingQR] = useState(false);
  const [isSavingQR, setIsSavingQR] = useState(false);
  const [qrErrorMessage, setQrErrorMessage] = useState('');
  const hasUnsavedQR = useRef(false);

  // Firebase RTDB Live Config & Health State
  const [customFirebaseUrl, setCustomFirebaseUrl] = useState('');
  const [firebaseStatus, setFirebaseStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'CHECKING'>('CHECKING');
  const [firebaseStatusError, setFirebaseStatusError] = useState<string | null>(null);
  const [isSavingFirebaseUrl, setIsSavingFirebaseUrl] = useState(false);
  const [firebaseSaveSuccess, setFirebaseSaveSuccess] = useState(false);

  // Cloud Firestore Force Sync State
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncAllSuccessMessage, setSyncAllSuccessMessage] = useState<string | null>(null);
  const [syncAllSummary, setSyncAllSummary] = useState<any>(null);

  const handleForceSyncAll = async () => {
    try {
      setIsSyncingAll(true);
      setSyncAllSuccessMessage(null);
      const res = await syncAllStoreDataToFirebase();
      setSyncAllSummary(res.summary);
      setSyncAllSuccessMessage('All Admin, Users, and Website data saved to Firebase successfully!');
      refreshAllData();
      setTimeout(() => setSyncAllSuccessMessage(null), 6000);
    } catch (err: any) {
      console.error('Error syncing all to Firebase:', err);
      setFirebaseStatusError(err?.message || 'Failed to save all data to Firebase');
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Ban Modal state
  const [banModalUser, setBanModalUser] = useState<User | null>(null);
  const [banReasonInput, setBanReasonInput] = useState('');

  // Ticket reply states
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');

  // Orders filter
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Check live Firebase RTDB connection status
  const checkFirebaseStatus = async () => {
    try {
      setFirebaseStatus('CHECKING');
      const cfg = await getFirebaseConfig();
      if (cfg) {
        setCustomFirebaseUrl(cfg.firebaseUrl);
        setFirebaseStatus(cfg.status);
        setFirebaseStatusError(cfg.error);
      }
    } catch (err: any) {
      setFirebaseStatus('DISCONNECTED');
      setFirebaseStatusError(err?.message || 'Could not verify Firebase connection');
    }
  };

  const handleSaveFirebaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFirebaseUrl.trim() || isSavingFirebaseUrl) return;

    try {
      setIsSavingFirebaseUrl(true);
      setFirebaseStatusError(null);
      setFirebaseSaveSuccess(false);

      const res = await saveFirebaseConfig(customFirebaseUrl.trim());
      setFirebaseStatus('CONNECTED');
      setFirebaseSaveSuccess(true);
      if (res.firebaseUrl) {
        setCustomFirebaseUrl(res.firebaseUrl);
      }
      setTimeout(() => setFirebaseSaveSuccess(false), 4000);
      refreshAllData();
    } catch (err: any) {
      console.error('Error saving Firebase config:', err);
      setFirebaseStatus('DISCONNECTED');
      setFirebaseStatusError(err?.message || 'Failed to connect to Firebase Realtime Database');
    } finally {
      setIsSavingFirebaseUrl(false);
    }
  };

  // General data refresh (products, users, orders, tickets) - never touches QR inputs
  const refreshGeneralData = () => {
    setProducts(getProducts());
    setUsers(getUsers());
    setOrders(getOrders());
    setTickets(getTickets());
  };

  // Sync QR configuration from storage ONLY if the admin has no unsaved changes
  const syncQRFromStorage = (force: boolean = false) => {
    const config = getQRConfig();
    setQrConfig(config);
    if (force || !hasUnsavedQR.current) {
      setQrMerchant(config.merchantName);
      setQrUpi(config.upiId || '');
      setQrInstructions(config.instructions);
      setQrImagePreview(config.qrImageUrl);
      hasUnsavedQR.current = false;
    }
  };

  const refreshAllData = () => {
    refreshGeneralData();
    syncQRFromStorage(false);
  };

  useEffect(() => {
    if (isOpen) {
      refreshGeneralData();
      checkFirebaseStatus();
      // On modal open, if no unsaved changes, initialize QR fields from current config
      if (!hasUnsavedQR.current) {
        syncQRFromStorage(true);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const generalHandler = () => refreshGeneralData();
    const qrHandler = () => {
      // Background sync or other tab updated QR
      const config = getQRConfig();
      setQrConfig(config);
      // CRITICAL: Do NOT overwrite active admin preview/inputs if unsaved changes exist!
      if (!hasUnsavedQR.current) {
        setQrMerchant(config.merchantName);
        setQrUpi(config.upiId || '');
        setQrInstructions(config.instructions);
        setQrImagePreview(config.qrImageUrl);
      }
    };

    window.addEventListener('f1_products_updated', generalHandler);
    window.addEventListener('f1_users_updated', generalHandler);
    window.addEventListener('f1_orders_updated', generalHandler);
    window.addEventListener('f1_tickets_updated', generalHandler);
    window.addEventListener('f1_qr_updated', qrHandler);

    return () => {
      window.removeEventListener('f1_products_updated', generalHandler);
      window.removeEventListener('f1_users_updated', generalHandler);
      window.removeEventListener('f1_orders_updated', generalHandler);
      window.removeEventListener('f1_tickets_updated', generalHandler);
      window.removeEventListener('f1_qr_updated', qrHandler);
    };
  }, []);

  if (!isOpen) return null;

  // STRICT ACCESS CONTROL
  if (!isAdminUser(currentUser)) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
        <div className="max-w-md w-full p-8 rounded-3xl glass-card border border-rose-500/40 text-center">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">ACCESS RESTRICTED</h2>
          <p className="text-xs text-slate-300 mb-6">
            Administrative access is strictly reserved for authorized store administrators.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-full bg-slate-800 text-white text-xs font-bold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // 1. Manage Items Handler (Strictly Awaits Firebase Cloud Save with Document Size Guard)
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim() || !itemPrice || isPublishingItem || isCompressingProductImage) return;

    try {
      setIsPublishingItem(true);
      setItemPublishError('');
      setItemPublishSuccess(false);

      let finalImageUrl = itemImageUrl.trim();

      // Size Guard: If user pasted a massive Data URL directly or file exceeds 900KB
      if (finalImageUrl.startsWith('data:image/')) {
        let byteSize = getBase64ByteSize(finalImageUrl);
        if (byteSize > 900000) {
          // Re-compress at 0.5 quality and 640px to safely fit under 1MB Firestore limit
          try {
            finalImageUrl = await compressImage(finalImageUrl, 640, 640, 0.5, 900000);
            byteSize = getBase64ByteSize(finalImageUrl);
          } catch (compErr: any) {
            setItemPublishError('Image is too large for Firestore (exceeds 900 KB). Please select a smaller photo.');
            setIsPublishingItem(false);
            return;
          }
        }
      }

      await saveProduct({
        title: itemTitle.trim(),
        category: itemCategory,
        price: Number(itemPrice),
        description: itemDescription.trim() || 'Exclusive high-performance edition from F1 Store.',
        imageUrl: finalImageUrl || 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
        isFeaturedWide: itemIsFeatured,
        rating: 5
      });

      setItemPublishSuccess(true);
      setTimeout(() => setItemPublishSuccess(false), 3500);

      // Reset form
      setItemTitle('');
      setItemPrice('');
      setItemDescription('');
      setItemImageUrl('');
      setProductImageSizeInfo(null);
      setItemIsFeatured(false);
      refreshAllData();
    } catch (err: any) {
      console.error('Error publishing item to Firebase:', err);
      setItemPublishError(err?.message || 'Failed to save product to Firebase Cloud Database.');
    } finally {
      setIsPublishingItem(false);
    }
  };

  // Automatic Product Image Compression on Upload (HTML5 Canvas 800px max, JPEG 0.72 quality)
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressingProductImage(true);
      setItemPublishError('');

      // Compress to max 800x800px, JPEG 0.72 quality with 900KB safety guard
      const compressedBase64 = await compressImage(file, 800, 800, 0.72, 900000);
      const byteSize = getBase64ByteSize(compressedBase64);

      setItemImageUrl(compressedBase64);
      setProductImageSizeInfo({
        size: byteSize,
        formatted: formatBytes(byteSize)
      });
    } catch (err: any) {
      console.error('Failed to compress product image:', err);
      setItemPublishError(err?.message || 'Failed to process product image. Please select a valid JPEG/PNG image.');
    } finally {
      setIsCompressingProductImage(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  // Automatic QR Image Compression on Upload (HTML5 Canvas 800px max, JPEG 0.72 quality)
  const handleQRFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressingQR(true);
      setQrErrorMessage('');
      // Client-side HTML5 Canvas compression (max 800x800px, quality 0.72, max 900KB)
      const compressedBase64 = await compressImage(file, 800, 800, 0.72, 900000);
      setQrImagePreview(compressedBase64);
      hasUnsavedQR.current = true;
    } catch (err: any) {
      console.error('Failed to compress QR image:', err);
      setQrErrorMessage(err?.message || 'Failed to process QR image');
    } finally {
      setIsCompressingQR(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleSaveQR = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (isSavingQR || isCompressingQR) return;

    try {
      setIsSavingQR(true);
      setQrErrorMessage('');

      let finalQrImage = qrImagePreview || qrConfig.qrImageUrl;

      // Size Guard: Ensure QR Image is under 900KB
      if (finalQrImage.startsWith('data:image/')) {
        const byteSize = getBase64ByteSize(finalQrImage);
        if (byteSize > 900000) {
          finalQrImage = await compressImage(finalQrImage, 640, 640, 0.5, 900000);
        }
      }

      const updated = await updateQRConfig({
        qrImageUrl: finalQrImage,
        merchantName: qrMerchant.trim() || 'F1 STORE OFFICIAL',
        upiId: qrUpi.trim(),
        instructions: qrInstructions.trim()
      });

      // Update state with confirmed saved result
      setQrConfig(updated);
      setQrImagePreview(updated.qrImageUrl);
      setQrMerchant(updated.merchantName);
      setQrUpi(updated.upiId || '');
      setQrInstructions(updated.instructions);
      hasUnsavedQR.current = false;

      // Show persistent success confirmation
      setQrSaveSuccess(true);
      setTimeout(() => setQrSaveSuccess(false), 3500);
    } catch (err: any) {
      console.error('Error updating payment QR config:', err);
      setQrErrorMessage('Failed to save QR configuration to server. Please try again.');
    } finally {
      setIsSavingQR(false);
    }
  };

  const handleConfirmBan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!banModalUser || !banReasonInput.trim()) return;

    banUser(banModalUser.id, banReasonInput.trim());
    setBanModalUser(null);
    setBanReasonInput('');
    refreshAllData();
  };

  const handleUnban = (userId: string) => {
    unbanUser(userId);
    refreshAllData();
  };

  const handleApproveOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'APPROVED', 'Verified by Admin via UTR reference.');
    refreshAllData();
  };

  const handleRejectOrder = (orderId: string) => {
    const note = prompt('Optional rejection note (e.g. Invalid UTR or amount mismatch):');
    updateOrderStatus(orderId, 'REJECTED', note || 'Payment could not be verified.');
    refreshAllData();
  };

  const handleAdminTicketReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !adminReplyText.trim()) return;

    replyToTicket(selectedTicketId, adminReplyText.trim(), 'admin');
    setAdminReplyText('');
    refreshAllData();
  };

  const handleResolveTicket = (ticketId: string) => {
    resolveTicket(ticketId);
    refreshAllData();
  };

  // Quick Seed Sample Items helper inside Admin Panel ONLY
  const handleQuickSeedVault = async () => {
    const sampleItems: Array<Omit<Product, 'id' | 'createdAt'>> = [
      {
        title: 'Formula Apex Monocoque Chassis Edition',
        category: 'NEW ARRIVALS',
        price: 49999,
        description: 'Titanium-inlaid carbon aerodynamic scale collectible certified by F1 Store engineering.',
        imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
        isFeaturedWide: true,
        rating: 5
      },
      {
        title: 'Silverstone High-Velocity Aero Wing',
        category: 'SILVER',
        price: 18500,
        description: 'Aerodynamic rear wing section mounted on dark emerald brushed anodized alloy.',
        imageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80',
        isFeaturedWide: false,
        rating: 5
      },
      {
        title: 'Monaco Gold Grandstand VIP Pass Edition',
        category: 'GOLD',
        price: 29999,
        description: 'Solid brass and gold engraved paddock pass replica with verified telemetry chip.',
        imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
        isFeaturedWide: false,
        rating: 5
      },
      {
        title: 'Platinum Turbocharged V6 Engine Model',
        category: 'PLATINUM',
        price: 64500,
        description: 'High-precision 1:4 scale exposed hybrid power unit with emerald LED ignition glow.',
        imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80',
        isFeaturedWide: false,
        rating: 5
      },
      {
        title: 'Diamond Champion Laurels Timepiece Case',
        category: 'DIAMOND',
        price: 89000,
        description: 'Handcrafted emerald velvet and billet aluminum display case for world champion relics.',
        imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
        isFeaturedWide: false,
        rating: 5
      }
    ];

    try {
      setIsPublishingItem(true);
      setItemPublishError('');
      for (const item of sampleItems) {
        await saveProduct(item);
      }
      refreshAllData();
    } catch (err: any) {
      console.error('Error seeding test editions:', err);
      setItemPublishError(err?.message || 'Failed to seed sample items to Firebase Cloud Database.');
    } finally {
      setIsPublishingItem(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (orderFilter === 'ALL') return true;
    return o.status === orderFilter;
  });

  const activeTicket = tickets.find(t => t.id === selectedTicketId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl overflow-hidden">
      <div className="relative w-full max-w-6xl h-[92vh] rounded-3xl glass-card border border-[#16c784]/40 flex flex-col justify-between shadow-[0_0_80px_rgba(22,199,132,0.3)] z-10 overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#16c784]/20 bg-[#020d09]/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-[#e5c98b] to-[#16c784] text-[#03140e] shadow-[0_0_15px_rgba(22,199,132,0.4)]">
              <Shield className="w-5 h-5 text-[#03140e]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-brand text-lg sm:text-xl font-black gold-gradient-text tracking-wider">
                  F1 STORE ADMIN DASHBOARD
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#16c784]/20 text-[#16c784] border border-[#16c784]/40 font-bold">
                  MASTER PRIVILEGES
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Store inventory, dynamic QR payment gateway, user bans & UTR approval desk
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-[#08291e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-[#03140e] border-b border-[#16c784]/15 overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('sales')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sales'
                ? 'bg-[#16c784] text-[#03140e] shadow-[0_0_15px_rgba(22,199,132,0.35)]'
                : 'text-slate-400 hover:text-white hover:bg-[#051c14]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Sales Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('items')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'items'
                ? 'bg-[#16c784] text-[#03140e] shadow-[0_0_15px_rgba(22,199,132,0.35)]'
                : 'text-slate-400 hover:text-white hover:bg-[#051c14]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>1. Manage Items ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'qr'
                ? 'bg-[#16c784] text-[#03140e] shadow-[0_0_15px_rgba(22,199,132,0.35)]'
                : 'text-slate-400 hover:text-white hover:bg-[#051c14]'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>2. Manage Payment QR</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-[#16c784] text-[#03140e] shadow-[0_0_15px_rgba(22,199,132,0.35)]'
                : 'text-slate-400 hover:text-white hover:bg-[#051c14]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>3. User Management ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-[#16c784] text-[#03140e] shadow-[0_0_15px_rgba(22,199,132,0.35)]'
                : 'text-slate-400 hover:text-white hover:bg-[#051c14]'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>4. Orders & Support ({orders.length} / {tickets.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('firebase');
              checkFirebaseStatus();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'firebase'
                ? 'bg-[#16c784] text-[#03140e] shadow-[0_0_15px_rgba(22,199,132,0.35)]'
                : 'text-slate-400 hover:text-white hover:bg-[#051c14]'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>5. Cloud Database (Firebase RTDB)</span>
            {firebaseStatus === 'CONNECTED' ? (
              <span className="w-2 h-2 rounded-full bg-[#16c784]" title="Connected"></span>
            ) : firebaseStatus === 'CHECKING' ? (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Not connected"></span>
            )}
          </button>
        </div>

        {/* Global Cloud Persistence Warning Banner */}
        {firebaseStatus === 'DISCONNECTED' && (
          <div className="bg-rose-950/80 border-b border-rose-500/40 px-6 py-2.5 flex items-center justify-between text-xs text-rose-300 shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>Cloud Persistence Alert:</strong> {firebaseStatusError || 'Firebase Realtime Database is not connected. Data will be lost on container restart.'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTab('firebase');
                checkFirebaseStatus();
              }}
              className="px-2.5 py-1 rounded-md bg-rose-500 text-white font-mono font-bold text-[10px] hover:bg-rose-600 cursor-pointer ml-3 shrink-0"
            >
              Fix Cloud DB URL &rarr;
            </button>
          </div>
        )}

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          
          {/* ========================================================= */}
          {/* TAB 0: SALES OVERVIEW */}
          {/* ========================================================= */}
          {activeTab === 'sales' && (
            <SalesOverviewChart orders={orders} products={products} />
          )}

          {/* ========================================================= */}
          {/* TAB 1: MANAGE ITEMS */}
          {/* ========================================================= */}
          {activeTab === 'items' && (
            <div className="space-y-8">
              {/* Form to Add New Item */}
              <div className="p-6 rounded-2xl bg-[#041a12] border border-[#16c784]/30 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#16c784]/20">
                  <div>
                    <h3 className="font-brand text-lg font-bold text-white gold-gradient-text">
                      Add New Vault Item
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Published items appear immediately in the storefront's asymmetric grid.
                    </p>
                  </div>

                  {products.length === 0 && (
                    <button
                      type="button"
                      onClick={handleQuickSeedVault}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#08291e] border border-[#e5c98b]/40 text-[#e5c98b] text-xs font-bold hover:bg-[#0b3829] transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Quick-Load 5 Test Editions</span>
                    </button>
                  )}
                </div>

                <form onSubmit={handleAddItem} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Item Title */}
                    <div className="sm:col-span-2">
                      <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block mb-1">
                        Item Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={itemTitle}
                        onChange={(e) => setItemTitle(e.target.value)}
                        placeholder="e.g. Monaco GP Carbon Fiber Telemetry Edition"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#03140e] border border-[#16c784]/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#16c784]"
                      />
                    </div>

                    {/* Category Dropdown (ONLY 5 CATEGORIES) */}
                    <div>
                      <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block mb-1">
                        Category Tier *
                      </label>
                      <select
                        value={itemCategory}
                        onChange={(e) => setItemCategory(e.target.value as CategoryType)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#03140e] border border-[#16c784]/30 text-[#e5c98b] font-bold text-xs focus:outline-none focus:border-[#16c784]"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c} className="bg-[#03140e] text-slate-200">
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Price */}
                    <div>
                      <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block mb-1">
                        Price (₹ INR) *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={itemPrice}
                        onChange={(e) => setItemPrice(e.target.value ? Number(e.target.value) : '')}
                        placeholder="e.g. 24999"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#03140e] border border-[#16c784]/30 text-[#16c784] font-mono font-bold text-xs focus:outline-none focus:border-[#16c784]"
                      />
                    </div>

                    {/* Image URL or File Upload */}
                    <div className="sm:col-span-2">
                      <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block mb-1">
                        Image Upload / URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={itemImageUrl}
                          onChange={(e) => {
                            setItemImageUrl(e.target.value);
                            if (e.target.value.startsWith('data:image/')) {
                              const s = getBase64ByteSize(e.target.value);
                              setProductImageSizeInfo({ size: s, formatted: formatBytes(s) });
                            } else {
                              setProductImageSizeInfo(null);
                            }
                          }}
                          placeholder="Paste image URL or upload photo..."
                          className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#03140e] border border-[#16c784]/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#16c784]"
                        />
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageFileUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          disabled={isCompressingProductImage}
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-2.5 rounded-xl bg-[#08291e] border border-[#16c784]/40 text-[#16c784] hover:bg-[#0b3829] disabled:opacity-50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                        >
                          {isCompressingProductImage ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#16c784]" />
                              <span>Compressing...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Compression preview & Firestore size safety indicator */}
                      {itemImageUrl && (
                        <div className="mt-2 flex items-center gap-3 p-2 rounded-xl bg-[#020d09] border border-[#16c784]/25">
                          <img
                            src={itemImageUrl}
                            alt="Preview"
                            className="w-10 h-10 object-cover rounded-lg border border-[#16c784]/30 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#16c784] shrink-0" />
                              <span className="text-[11px] font-mono text-[#16c784] font-bold truncate">
                                Canvas Compressed (Max 800px, JPEG 0.72)
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                              Size: <strong className="text-white">{productImageSizeInfo?.formatted || formatBytes(getBase64ByteSize(itemImageUrl))}</strong> (Safe for Cloud Firestore)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Short Description */}
                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block mb-1">
                      Short Description
                    </label>
                    <textarea
                      rows={2}
                      value={itemDescription}
                      onChange={(e) => setItemDescription(e.target.value)}
                      placeholder="High-performance materials, limited allocation certificate, race-proven specifications..."
                      className="w-full px-3.5 py-2 rounded-xl bg-[#03140e] border border-[#16c784]/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#16c784]"
                    />
                  </div>

                  {/* Featured Wide Card Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#03140e] border border-[#16c784]/20">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#e5c98b]" />
                      <div>
                        <span className="text-xs font-bold text-slate-200 block">
                          Featured Wide Card (Row 1 Asymmetric Anchor)
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Expands this item across 2 columns in the asymmetric studio grid.
                        </span>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={itemIsFeatured}
                        onChange={(e) => setItemIsFeatured(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#16c784]"></div>
                    </label>
                  </div>

                  {/* Item Publish Error Alert (Never Fail Silently!) */}
                  {itemPublishError && (
                    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-300 text-xs font-bold shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                      <XCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                      <div>
                        <span className="block font-black text-rose-200 uppercase tracking-wide text-[11px]">Firebase Cloud Persistence Error</span>
                        <p className="font-normal font-sans mt-0.5 leading-relaxed">{itemPublishError}</p>
                      </div>
                    </div>
                  )}

                  {/* Item Publish Success Toast */}
                  {itemPublishSuccess && (
                    <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-950/80 border border-[#16c784] text-[#16c784] text-xs font-bold shadow-[0_0_20px_rgba(22,199,132,0.35)]">
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-[#16c784]" />
                      <span>Vault item successfully published and permanently saved to Firebase Realtime Database!</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isPublishingItem}
                    className="w-full py-3 rounded-full bg-[#16c784] hover:bg-[#1ae095] disabled:opacity-50 text-[#03140e] font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(22,199,132,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isPublishingItem ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#03140e]" />
                        <span>Syncing to Firebase Cloud...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Publish Item to Storefront</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Items List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Currently Listed Inventory ({products.length})
                  </h4>
                  {products.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete all items and return storefront to zero items?')) {
                          clearAllProducts();
                          refreshAllData();
                        }
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 underline font-mono"
                    >
                      Clear All Items (Zero Storefront)
                    </button>
                  )}
                </div>

                {products.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-[#041a12] border border-[#16c784]/20 text-center">
                    <Package className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-mono">
                      Storefront is strictly empty. Use the form above to add items.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((p) => (
                      <div
                        key={p.id}
                        className="p-4 rounded-xl bg-[#041a12] border border-[#16c784]/25 flex flex-col justify-between"
                      >
                        <div>
                          <div className="h-36 rounded-lg bg-[#020b08] overflow-hidden mb-3 relative border border-[#16c784]/20">
                            <img
                              src={p.imageUrl}
                              alt={p.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#03140e]/90 text-[#e5c98b] text-[10px] font-mono font-bold border border-[#e5c98b]/30">
                              {p.category}
                            </div>
                            {p.isFeaturedWide && (
                              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#16c784] text-[#03140e] text-[9px] font-bold">
                                WIDE FEATURED
                              </div>
                            )}
                          </div>

                          <h5 className="text-sm font-bold text-white truncate">{p.title}</h5>
                          <p className="text-xs text-slate-400 line-clamp-2 mt-1">{p.description}</p>
                        </div>

                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#16c784]/20">
                          <span className="text-base font-extrabold text-[#16c784] font-mono">
                            ₹{p.price.toLocaleString('en-IN')}
                          </span>
                          <button
                            onClick={() => {
                              deleteProduct(p.id);
                              refreshAllData();
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: MANAGE PAYMENT QR */}
          {/* ========================================================= */}
          {activeTab === 'qr' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="p-6 rounded-2xl bg-[#041a12] border border-[#16c784]/30 shadow-lg">
                <div className="mb-6 pb-4 border-b border-[#16c784]/20">
                  <h3 className="font-brand text-lg font-bold text-white gold-gradient-text">
                    Configure Store Payment QR Gateway
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Any QR image or UPI details configured here immediately update the live 5-minute BUY NOW modal for customers.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveQR(e);
                  }}
                  className="space-y-4"
                >
                  {/* QR Image Preview & File Upload */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-[#03140e] border border-[#16c784]/20">
                    <div className="relative p-2 rounded-xl bg-[#020b08] border border-[#16c784]/40 shrink-0">
                      <img
                        src={qrImagePreview || qrConfig.qrImageUrl}
                        alt="Current QR Code"
                        className="w-36 h-36 object-contain rounded-lg transition-opacity duration-200"
                        style={{ opacity: isCompressingQR ? 0.4 : 1 }}
                      />
                      {isCompressingQR && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl">
                          <Loader2 className="w-6 h-6 animate-spin text-[#16c784] mb-1" />
                          <span className="text-[10px] font-mono text-[#16c784] font-bold">Compressing...</span>
                        </div>
                      )}
                      {hasUnsavedQR.current && !isCompressingQR && (
                        <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-[#e5c98b] text-[#03140e] font-mono text-[9px] font-black shadow-lg">
                          UNSAVED
                        </span>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <span className="text-xs font-bold text-white block">
                          Upload Custom Payment QR Image
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#16c784]/15 text-[#16c784] border border-[#16c784]/30">
                          Auto-Compressed
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        Upload your merchant UPI QR screenshot, static Bank QR, or high-res payment code. It is automatically compressed to 500x500px for instant checkout loading.
                      </p>
                      
                      <input
                        type="file"
                        ref={qrFileInputRef}
                        onChange={handleQRFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      
                      <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                        <button
                          type="button"
                          disabled={isCompressingQR || isSavingQR}
                          onClick={(e) => {
                            e.preventDefault();
                            qrFileInputRef.current?.click();
                          }}
                          className="px-4 py-2 rounded-full bg-[#16c784] hover:bg-[#1ae095] disabled:opacity-50 text-[#03140e] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                        >
                          {isCompressingQR ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#03140e]" />
                              <span>Compressing Image...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5" />
                              <span>Select New QR Image</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Merchant Name */}
                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block mb-1">
                      Merchant / Account Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={qrMerchant}
                      onChange={(e) => {
                        setQrMerchant(e.target.value);
                        hasUnsavedQR.current = true;
                      }}
                      placeholder="e.g. F1 STORE OFFICIAL"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#03140e] border border-[#16c784]/30 text-white text-xs focus:outline-none focus:border-[#16c784]"
                    />
                  </div>

                  {/* UPI ID */}
                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block mb-1">
                      UPI VPA / Bank ID
                    </label>
                    <input
                      type="text"
                      value={qrUpi}
                      onChange={(e) => {
                        setQrUpi(e.target.value);
                        hasUnsavedQR.current = true;
                      }}
                      placeholder="e.g. f1store@axisbank"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#03140e] border border-[#16c784]/30 text-emerald-400 font-mono text-xs focus:outline-none focus:border-[#16c784]"
                    />
                  </div>

                  {/* Instructions */}
                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block mb-1">
                      Payment Modal Instructions
                    </label>
                    <textarea
                      rows={2}
                      value={qrInstructions}
                      onChange={(e) => {
                        setQrInstructions(e.target.value);
                        hasUnsavedQR.current = true;
                      }}
                      placeholder="Scan with UPI / Banking app, then copy your 12-digit UTR reference."
                      className="w-full px-3.5 py-2 rounded-xl bg-[#03140e] border border-[#16c784]/30 text-white text-xs focus:outline-none focus:border-[#16c784]"
                    />
                  </div>

                  {/* Success Confirmation Toast */}
                  {qrSaveSuccess && (
                    <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-950/80 border border-[#16c784] text-[#16c784] text-xs font-bold shadow-[0_0_20px_rgba(22,199,132,0.35)] animate-fade-in">
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-[#16c784]" />
                      <div>
                        <span>Payment QR Updated Successfully!</span>
                        <p className="text-[11px] text-emerald-300/80 font-normal font-sans">
                          The updated QR code and merchant details are live in the customer BUY NOW modal.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Error Message Banner (Never Fail Silently!) */}
                  {qrErrorMessage && (
                    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-300 text-xs font-bold shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                      <XCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                      <div>
                        <span className="block font-black text-rose-200 uppercase tracking-wide text-[11px]">Payment QR Save Failed</span>
                        <p className="font-normal font-sans mt-0.5 leading-relaxed">{qrErrorMessage}</p>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSavingQR || isCompressingQR}
                    className="w-full py-3 rounded-full bg-[#16c784] hover:bg-[#1ae095] disabled:opacity-50 disabled:cursor-not-allowed text-[#03140e] font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(22,199,132,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSavingQR ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#03140e]" />
                        <span>Saving to Gateway...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Save & Activate Payment Gateway</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: USER MANAGEMENT (BAN / UNBAN) */}
          {/* ========================================================= */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-brand text-lg font-bold text-white gold-gradient-text">
                    Registered Users & Enforcement Desk
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Enforce user bans with mandatory reason recording. Banned users have their storefront locked.
                  </p>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto rounded-2xl border border-[#16c784]/25 bg-[#041a12]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#020d09] text-slate-400 uppercase font-mono border-b border-[#16c784]/20">
                    <tr>
                      <th className="px-4 py-3">User Email</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Ban Reason / Notes</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#16c784]/15">
                    {users.map((u) => {
                      const isTargetAdmin = u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
                      return (
                        <tr key={u.id} className="hover:bg-[#06241a]/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-white">
                            <div>
                              <span>{u.email}</span>
                              {u.name && <span className="block text-[10px] text-slate-400 font-mono">{u.name}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {isTargetAdmin ? (
                              <span className="px-2 py-0.5 rounded-full bg-[#e5c98b]/20 text-[#e5c98b] font-mono text-[10px] font-bold border border-[#e5c98b]/40">
                                MASTER ADMIN
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono text-[11px]">CUSTOMER</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {u.isBanned ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-mono font-bold">
                                <Ban className="w-3 h-3" />
                                BANNED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#16c784]/20 text-[#16c784] border border-[#16c784]/40 text-[10px] font-mono font-bold">
                                <UserCheck className="w-3 h-3" />
                                ACTIVE
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-300 max-w-xs truncate">
                            {u.isBanned ? (
                              <span className="text-rose-300 italic">"{u.banReason}"</span>
                            ) : (
                              <span className="text-slate-500">Good Standing</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isTargetAdmin ? (
                              <span className="text-[10px] text-slate-500 font-mono">Protected</span>
                            ) : u.isBanned ? (
                              <button
                                onClick={() => handleUnban(u.id)}
                                className="px-3 py-1 rounded-full bg-[#16c784]/20 text-[#16c784] hover:bg-[#16c784] hover:text-[#03140e] border border-[#16c784]/40 text-xs font-bold transition-all cursor-pointer"
                              >
                                Unban User
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setBanModalUser(u);
                                  setBanReasonInput('');
                                }}
                                className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/40 text-xs font-bold transition-all cursor-pointer"
                              >
                                Ban User
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: ORDERS & SUPPORT */}
          {/* ========================================================= */}
          {activeTab === 'orders' && (
            <div className="space-y-8">
              {/* ORDERS SUB-SECTION */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-brand text-lg font-bold text-white gold-gradient-text">
                      User-Submitted UTR Payment Confirmations
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Verify 12-digit bank UTR numbers against your account and approve/reject orders.
                    </p>
                  </div>

                  {/* Filter chips */}
                  <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#020d09] border border-[#16c784]/20 text-xs">
                    {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => setOrderFilter(status)}
                        className={`px-2.5 py-1 rounded-md font-mono text-[10px] font-bold transition-colors cursor-pointer ${
                          orderFilter === status
                            ? 'bg-[#16c784] text-[#03140e]'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-[#041a12] border border-[#16c784]/20 text-center">
                    <ClipboardList className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-mono">
                      No orders found matching the filter "{orderFilter}".
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-[#16c784]/25 bg-[#041a12]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#020d09] text-slate-400 uppercase font-mono border-b border-[#16c784]/20">
                        <tr>
                          <th className="px-4 py-3">Order ID</th>
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-4 py-3">Item / Tier</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3">12-Digit UTR</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#16c784]/15">
                        {filteredOrders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-[#06241a]/50 transition-colors">
                            <td className="px-4 py-3 font-mono font-bold text-slate-200">
                              {ord.id}
                            </td>
                            <td className="px-4 py-3 text-slate-300">
                              {ord.userEmail}
                            </td>
                            <td className="px-4 py-3 font-medium text-white truncate max-w-[160px]">
                              {ord.productTitle}
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-[#16c784]">
                              ₹{ord.amount.toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 rounded bg-[#020d09] border border-[#16c784]/30 font-mono font-bold text-[#e5c98b] tracking-wider">
                                {ord.utrNumber}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                                ord.status === 'APPROVED'
                                  ? 'bg-emerald-500/20 text-[#16c784] border border-[#16c784]/40'
                                  : ord.status === 'REJECTED'
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}>
                                {ord.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {ord.status === 'PENDING' ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleApproveOrder(ord.id)}
                                    className="p-1.5 rounded-lg bg-[#16c784]/20 hover:bg-[#16c784] text-[#16c784] hover:text-[#03140e] transition-colors"
                                    title="Approve Payment"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleRejectOrder(ord.id)}
                                    className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white transition-colors"
                                    title="Reject Payment"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-mono">Resolved</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SUPPORT TICKETS SUB-SECTION */}
              <div className="pt-6 border-t border-[#16c784]/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-brand text-lg font-bold text-white gold-gradient-text">
                      Customer Support & Ban Appeals Desk ({tickets.length})
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Private in-app correspondence with registered users.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Tickets List */}
                  <div className="space-y-2 max-h-[360px] overflow-y-auto">
                    {tickets.length === 0 ? (
                      <div className="p-6 rounded-xl bg-[#041a12] border border-[#16c784]/20 text-center">
                        <MessageSquare className="w-6 h-6 text-slate-600 mx-auto mb-1" />
                        <p className="text-xs text-slate-400 font-mono">No support inquiries filed yet.</p>
                      </div>
                    ) : (
                      tickets.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTicketId(t.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            selectedTicketId === t.id
                              ? 'bg-[#06241a] border-[#16c784]'
                              : 'bg-[#041a12] border-[#16c784]/20 hover:border-[#16c784]/40'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                            <span className="text-[#e5c98b] font-bold">{t.category}</span>
                            <span>{t.id}</span>
                          </div>
                          <h6 className="text-xs font-bold text-white truncate">{t.subject}</h6>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{t.userEmail}</p>
                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#16c784]/15">
                            <span className={`text-[9px] font-mono font-bold uppercase ${
                              t.status === 'REPLIED' ? 'text-[#16c784]' : t.status === 'RESOLVED' ? 'text-slate-500' : 'text-amber-400'
                            }`}>
                              {t.status}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono">
                              {new Date(t.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Active Ticket Conversation Thread */}
                  <div className="lg:col-span-2 p-4 rounded-xl bg-[#041a12] border border-[#16c784]/30 flex flex-col justify-between h-[360px]">
                    {activeTicket ? (
                      <>
                        <div className="flex items-center justify-between pb-2 border-b border-[#16c784]/20">
                          <div>
                            <span className="text-[10px] font-mono uppercase text-[#e5c98b] font-bold">
                              {activeTicket.category} · From {activeTicket.userEmail}
                            </span>
                            <h5 className="text-sm font-bold text-white mt-0.5">{activeTicket.subject}</h5>
                          </div>
                          {activeTicket.status !== 'RESOLVED' && (
                            <button
                              onClick={() => handleResolveTicket(activeTicket.id)}
                              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold"
                            >
                              Mark Resolved
                            </button>
                          )}
                        </div>

                        {/* Messages Stream */}
                        <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1">
                          {activeTicket.messages.map((m) => (
                            <div
                              key={m.id}
                              className={`flex flex-col ${m.sender === 'admin' ? 'items-end' : 'items-start'}`}
                            >
                              <span className="text-[9px] font-mono text-slate-400 mb-0.5">
                                {m.sender === 'admin' ? 'You (Store Administrator)' : activeTicket.userEmail}
                              </span>
                              <div
                                className={`p-2.5 rounded-xl text-xs max-w-[85%] ${
                                  m.sender === 'admin'
                                    ? 'bg-[#0f382a] text-[#16c784] border border-[#16c784]/40 rounded-tr-none'
                                    : 'bg-[#020d09] text-slate-200 border border-[#16c784]/20 rounded-tl-none'
                                }`}
                              >
                                {m.text}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Admin Reply Box */}
                        <form onSubmit={handleAdminTicketReply} className="pt-2 border-t border-[#16c784]/20 flex gap-2">
                          <input
                            type="text"
                            required
                            value={adminReplyText}
                            onChange={(e) => setAdminReplyText(e.target.value)}
                            placeholder="Type admin reply to user..."
                            className="flex-1 px-3 py-2 rounded-xl bg-[#03140e] border border-[#16c784]/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#16c784]"
                          />
                          <button
                            type="submit"
                            className="px-4 py-2 rounded-xl bg-[#16c784] text-[#03140e] font-bold text-xs hover:bg-[#1ae095] cursor-pointer"
                          >
                            Reply
                          </button>
                        </form>
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center text-center text-slate-500 text-xs font-mono">
                        Select a support ticket from the left to view conversation thread and reply.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: CLOUD DATABASE (FIREBASE FIRESTORE & RTDB) */}
          {/* ========================================================= */}
          {activeTab === 'firebase' && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Official Provisioned Firestore Card */}
              <div className="p-6 rounded-2xl bg-[#041a12] border border-[#16c784]/40 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#16c784]/10 rounded-full blur-2xl pointer-events-none" />

                <div className="mb-6 pb-4 border-b border-[#16c784]/20 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#16c784]/20 text-[#16c784] font-mono text-[10px] font-bold tracking-wider uppercase border border-[#16c784]/30">
                        OFFICIAL FIREBASE PROJECT CONNECTED
                      </span>
                    </div>
                    <h3 className="font-brand text-xl font-bold text-white gold-gradient-text flex items-center gap-2">
                      <Database className="w-5 h-5 text-[#16c784]" />
                      <span>Google Cloud Firestore Database</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-1">
                      Live persistent cloud database provisioned for your project <strong className="text-white">f1-store-d228f</strong>.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16c784] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#16c784]"></span>
                    </span>
                    <span className="text-xs font-mono font-bold text-[#16c784] uppercase">Live Sync</span>
                  </div>
                </div>

                {/* Firestore Provisioning Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="p-3.5 rounded-xl bg-[#020e0a] border border-[#16c784]/25">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Firebase Project ID</span>
                    <span className="text-sm font-bold font-mono text-white mt-0.5 block">f1-store-d228f</span>
                    <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">Project Number: 239559459699</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#020e0a] border border-[#16c784]/25">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Firestore Database ID</span>
                    <span className="text-xs font-bold font-mono text-[#16c784] mt-0.5 block break-all">ai-studio-f1store-290f9b0c-9caf-4e37-a29c-ce8760fe9520</span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Edition: Cloud Firestore Enterprise</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#020e0a] border border-[#16c784]/25">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Active Firestore Collections</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {['products', 'settings', 'users', 'orders', 'tickets', 'wishlists'].map(col => (
                        <span key={col} className="px-2 py-0.5 rounded-md bg-[#041d14] border border-[#16c784]/30 text-[10px] font-mono text-emerald-300">
                          /{col}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#020e0a] border border-[#16c784]/25">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Security Rules</span>
                    <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-[#16c784]">
                      <Shield className="w-4 h-4 text-[#16c784]" />
                      <span>Hardened & Deployed to Cloud</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Realtime Snapshot Subscriptions Active</span>
                  </div>
                </div>

                {/* Save All Data to Firebase Action Card */}
                <div className="p-4 rounded-xl bg-[#020e0a] border border-[#16c784]/35 mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#e5c98b]" />
                        <span>Save All Admin, User & Storefront Data to Firebase</span>
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Directly writes and commits all admin accounts, registered users, payment QR, catalog products, orders, and tickets to Firestore.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleForceSyncAll}
                      disabled={isSyncingAll}
                      className="px-4 py-2.5 rounded-xl bg-[#16c784] hover:bg-[#1ae095] disabled:opacity-50 text-[#03140e] font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(22,199,132,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
                    >
                      {isSyncingAll ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#03140e]" />
                          <span>Saving to Firebase...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                          <span>Push All Data to Firebase</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Document Counts in Firestore */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-[#16c784]/20">
                    <div className="p-2 rounded-lg bg-[#041a12] text-center border border-[#16c784]/15">
                      <span className="text-[10px] font-mono text-slate-400 block">Admin & Users</span>
                      <span className="text-xs font-bold font-mono text-[#16c784]">{users.length} in /users</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#041a12] text-center border border-[#16c784]/15">
                      <span className="text-[10px] font-mono text-slate-400 block">Store Products</span>
                      <span className="text-xs font-bold font-mono text-[#16c784]">{products.length} in /products</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#041a12] text-center border border-[#16c784]/15">
                      <span className="text-[10px] font-mono text-slate-400 block">Payment QR & Info</span>
                      <span className="text-xs font-bold font-mono text-[#16c784]">Synced in /settings</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#041a12] text-center border border-[#16c784]/15">
                      <span className="text-[10px] font-mono text-slate-400 block">Orders & Support</span>
                      <span className="text-xs font-bold font-mono text-[#16c784]">{orders.length} orders · {tickets.length} tickets</span>
                    </div>
                  </div>

                  {syncAllSuccessMessage && (
                    <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-emerald-950/90 border border-[#16c784] text-[#16c784] text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16c784]" />
                      <span>{syncAllSuccessMessage}</span>
                    </div>
                  )}
                </div>

                {/* Firestore Cloud Verification Banner */}
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-[#16c784]/40 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-[#16c784] mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold text-xs uppercase tracking-wider font-mono text-emerald-300 block">
                      Cloud Persistence Status: Fully Connected & Bulletproof
                    </span>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      All product additions, payment QR uploads, user accounts, orders, and customer support tickets persist permanently in your Google Cloud Firestore database. Even if the Cloud Run web container reboots, your store catalog and customer transactions will never be lost.
                    </p>
                  </div>
                </div>
              </div>

              {/* Secondary Realtime Database Sync Configuration */}
              <div className="p-6 rounded-2xl bg-[#041a12] border border-[#16c784]/30 shadow-lg">
                <div className="mb-4 pb-3 border-b border-[#16c784]/20 flex items-center justify-between">
                  <div>
                    <h4 className="font-brand text-base font-bold text-white gold-gradient-text flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-[#16c784]" />
                      <span>Optional Secondary Realtime Database Endpoint</span>
                    </h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Optional secondary REST backup sync to a Firebase Realtime Database URL.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={checkFirebaseStatus}
                    className="p-2 rounded-xl bg-[#03140e] border border-[#16c784]/30 text-[#16c784] hover:bg-[#08291e] transition-colors cursor-pointer"
                    title="Refresh connection status"
                  >
                    <RefreshCw className={`w-4 h-4 ${firebaseStatus === 'CHECKING' ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <form onSubmit={handleSaveFirebaseConfig} className="space-y-4">
                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block mb-1">
                      Secondary Firebase RTDB URL (Optional)
                    </label>
                    <input
                      type="text"
                      value={customFirebaseUrl}
                      onChange={(e) => setCustomFirebaseUrl(e.target.value)}
                      placeholder="e.g. https://f1-store-d228f-default-rtdb.asia-southeast1.firebasedatabase.app"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#03140e] border border-[#16c784]/30 text-[#16c784] font-mono text-xs focus:outline-none focus:border-[#16c784]"
                    />
                  </div>

                  {firebaseSaveSuccess && (
                    <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-950/80 border border-[#16c784] text-[#16c784] text-xs font-bold shadow-[0_0_20px_rgba(22,199,132,0.35)]">
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-[#16c784]" />
                      <span>Firebase Realtime Database Connected & Synced Successfully!</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSavingFirebaseUrl}
                    className="w-full py-2.5 rounded-xl bg-[#08291e] border border-[#16c784]/40 hover:bg-[#0b382a] text-[#16c784] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSavingFirebaseUrl ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#16c784]" />
                        <span>Updating Secondary Sync...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Update Secondary Database URL</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BAN USER MODAL */}
      {banModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl glass-card border border-rose-500/50 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-rose-400 mb-2 flex items-center gap-2">
              <Ban className="w-4 h-4" />
              <span>Restrict User: {banModalUser.email}</span>
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              Enter the exact reason for banning this user. This reason will be displayed on their locked storefront screen.
            </p>

            <form onSubmit={handleConfirmBan} className="space-y-4">
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                  Ban Reason (Required) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={banReasonInput}
                  onChange={(e) => setBanReasonInput(e.target.value)}
                  placeholder="e.g. Repeated fraudulent UTR submissions or suspicious chargeback attempt."
                  className="w-full px-3 py-2 rounded-xl bg-[#03140e] border border-rose-500/40 text-white text-xs focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBanModalUser(null)}
                  className="px-4 py-2 rounded-full bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg"
                >
                  Confirm Ban
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
