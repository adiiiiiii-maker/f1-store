import React, { useState, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  ShoppingBag,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit2,
  Check,
  LogOut,
  Headphones,
  Sparkles,
  Calendar,
  Hash,
  Copy
} from 'lucide-react';
import { User, Order } from '../types';
import { getUserOrders, updateUserDisplayName, isAdminUser } from '../services/storage';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onLogout: () => void;
  onOpenSupport: () => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogout,
  onOpenSupport
}) => {
  const [displayName, setDisplayName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  const loadData = () => {
    if (currentUser) {
      setDisplayName(currentUser.name || currentUser.email.split('@')[0]);
      setUserOrders(getUserOrders(currentUser.email, currentUser.id));
    }
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      loadData();
      setIsEditingName(false);
      setSaveSuccess(false);
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    const handleOrders = () => {
      if (currentUser) {
        setUserOrders(getUserOrders(currentUser.email, currentUser.id));
      }
    };
    window.addEventListener('f1_orders_updated', handleOrders);
    return () => window.removeEventListener('f1_orders_updated', handleOrders);
  }, [currentUser]);

  if (!isOpen || !currentUser) return null;

  const isAdmin = isAdminUser(currentUser);

  const handleSaveDisplayName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    updateUserDisplayName(currentUser.id, displayName.trim());
    setIsEditingName(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleCopyUTR = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedOrderId(utr);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  const filteredOrders = userOrders.filter(o => {
    if (orderFilter === 'ALL') return true;
    return o.status === orderFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-3xl rounded-3xl glass-card border border-[#16c784]/40 p-6 sm:p-8 shadow-[0_0_70px_rgba(22,199,132,0.25)] z-10 overflow-hidden my-auto max-h-[92vh] flex flex-col justify-between">
        
        {/* Top ambient highlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1.5 bg-gradient-to-r from-[#e5c98b] via-[#16c784] to-[#e5c98b] shadow-[0_0_25px_#16c784]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-[#08291e] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. Header Profile Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#16c784]/20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#041d14] border border-[#16c784]/50 flex items-center justify-center text-[#16c784] shadow-[0_0_20px_rgba(22,199,132,0.25)] shrink-0">
              <UserIcon className="w-8 h-8 text-[#16c784]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-brand text-xl sm:text-2xl font-black text-white gold-gradient-text">
                  {currentUser.name || currentUser.email.split('@')[0]}
                </h3>
                {isAdmin ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#e5c98b]/20 text-[#e5c98b] text-[10px] font-mono font-bold border border-[#e5c98b]/40">
                    MASTER ADMIN
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-[#16c784]/20 text-[#16c784] text-[10px] font-mono font-bold border border-[#16c784]/40">
                    VIP MEMBER
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {currentUser.email}
              </p>

              <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Member since {new Date(currentUser.createdAt).toLocaleDateString()}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenSupport();
              }}
              className="px-3.5 py-1.5 rounded-full bg-[#08291e] border border-[#16c784]/30 hover:border-[#16c784] text-xs font-semibold text-[#16c784] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Concierge</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="px-3.5 py-1.5 rounded-full bg-rose-950/40 border border-rose-500/30 hover:border-rose-500 text-xs font-semibold text-rose-400 hover:text-rose-200 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-1">
          
          {/* 2. Display Name Update Section */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#041a12] border border-[#16c784]/25">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#e5c98b] font-bold">
                Storefront Profile Settings
              </span>
              {saveSuccess && (
                <span className="inline-flex items-center gap-1 text-[11px] text-[#16c784] font-mono">
                  <Check className="w-3.5 h-3.5" />
                  <span>Display name saved</span>
                </span>
              )}
            </div>

            <form onSubmit={handleSaveDisplayName} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1">
                <label htmlFor="displayNameInput" className="sr-only">Display Name</label>
                <input
                  id="displayNameInput"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your VIP display name..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#03140e] border border-[#16c784]/40 text-white text-xs font-medium placeholder:text-slate-500 focus:outline-none focus:border-[#16c784] transition-all"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#16c784] hover:bg-[#1ae095] text-[#03140e] font-extrabold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(22,199,132,0.3)] cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Update Name</span>
              </button>
            </form>
          </div>

          {/* 3. Purchase History & Order Status Section */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h4 className="font-brand text-base sm:text-lg font-bold text-white gold-gradient-text">
                  Purchase History & UTR Settlements
                </h4>
                <p className="text-xs text-slate-400 font-mono">
                  Track your 5-minute dynamic QR orders and verified bank UTR status.
                </p>
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-[#020d09] border border-[#16c784]/20 text-xs">
                {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderFilter(st)}
                    className={`px-2.5 py-1 rounded-md font-mono text-[10px] font-bold transition-all cursor-pointer ${
                      orderFilter === st
                        ? 'bg-[#16c784] text-[#03140e]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#041a12] border border-[#16c784]/20 text-center">
                <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-300 font-semibold">No Orders Found</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-1">
                  {orderFilter === 'ALL'
                    ? 'You have not submitted any purchases yet. Explore the vault collections to place an order.'
                    : `No orders currently matching the status "${orderFilter}".`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl bg-[#041a12] border border-[#16c784]/25 hover:border-[#16c784]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[#e5c98b] font-bold uppercase">
                          {ord.category}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-xs font-mono font-bold text-white">
                          {ord.id}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h5 className="text-sm font-bold text-slate-100 truncate">
                        {ord.productTitle}
                      </h5>

                      <div className="flex items-center gap-2 pt-1 text-xs font-mono">
                        <span className="text-slate-400">12-Digit UTR:</span>
                        <span className="px-2 py-0.5 rounded bg-[#020d09] border border-[#16c784]/30 font-bold text-[#e5c98b] tracking-wider">
                          {ord.utrNumber}
                        </span>
                        <button
                          onClick={() => handleCopyUTR(ord.utrNumber)}
                          className="text-slate-500 hover:text-white p-0.5"
                          title="Copy UTR"
                        >
                          {copiedOrderId === ord.utrNumber ? (
                            <Check className="w-3.5 h-3.5 text-[#16c784]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {ord.adminNote && (
                        <p className="text-[11px] text-slate-400 italic pt-1">
                          Admin Note: "{ord.adminNote}"
                        </p>
                      )}
                    </div>

                    <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-[#16c784]/15">
                      <span className="text-lg font-black text-[#16c784] font-mono">
                        ₹{ord.amount.toLocaleString('en-IN')}
                      </span>

                      {/* Status Badges */}
                      <div className="mt-1">
                        {ord.status === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-[#16c784] border border-[#16c784]/40 font-mono text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>APPROVED</span>
                          </span>
                        ) : ord.status === 'REJECTED' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 font-mono text-[11px] font-bold">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>REJECTED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-[11px] font-bold">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            <span>PENDING VERIFICATION</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#16c784]/20 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-mono gap-2">
          <span>✦ F1 Store Verified Member Dashboard</span>
          <button
            onClick={onClose}
            className="text-[#16c784] hover:underline"
          >
            Return to Storefront
          </button>
        </div>
      </div>
    </div>
  );
};
