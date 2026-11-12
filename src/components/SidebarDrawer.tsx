import React from 'react';
import {
  X,
  Shield,
  Headphones,
  ShoppingBag,
  LogOut,
  ChevronRight,
  Sparkles,
  Heart,
  User as UserIcon,
  Trash2,
  Zap,
  ShoppingCart
} from 'lucide-react';
import { CategoryType, CATEGORIES, User, Product } from '../types';
import { isAdminUser } from '../services/storage';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  activeCategory: CategoryType | 'ALL';
  onSelectCategory: (cat: CategoryType | 'ALL') => void;
  onOpenAdmin: () => void;
  onOpenAuth: () => void;
  onOpenAccount: () => void;
  onOpenSupport: () => void;
  onLogout: () => void;
  favoriteProducts: Product[];
  onToggleWishlist: (productId: string) => void;
  onBuyNow: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeCategory,
  onSelectCategory,
  onOpenAdmin,
  onOpenAuth,
  onOpenAccount,
  onOpenSupport,
  onLogout,
  favoriteProducts,
  onToggleWishlist,
  onBuyNow,
  onAddToCart
}) => {
  if (!isOpen) return null;

  const isAdmin = isAdminUser(currentUser);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-sm bg-[#03140e] border-r border-[#16c784]/30 h-full p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-[#16c784]/20">
            <div>
              <span className="font-brand text-xl font-black gold-gradient-text tracking-widest">
                F1 STORE
              </span>
              <p className="text-[10px] text-emerald-400/80 font-mono tracking-wider">
                LUXURY VAULT
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#08291e] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Status Card */}
          <div className="my-5 p-4 rounded-xl bg-[#051c14] border border-[#16c784]/20">
            {currentUser ? (
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">
                    Member Status
                  </span>
                  {isAdmin ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e5c98b]/20 text-[#e5c98b] border border-[#e5c98b]/40">
                      ADMINISTRATOR
                    </span>
                  ) : currentUser.isBanned ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40">
                      RESTRICTED
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#16c784]/20 text-[#16c784] border border-[#16c784]/40">
                      VIP ACTIVE
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-100 truncate">
                  {isAdmin ? 'System Administrator' : currentUser.name || currentUser.email.split('@')[0]}
                </p>

                {/* Account Settings & Orders link */}
                <button
                  onClick={() => {
                    onClose();
                    onOpenAccount();
                  }}
                  className="mt-3 w-full py-2 px-3 rounded-lg bg-[#08291e] hover:bg-[#0c3e2e] border border-[#16c784]/30 text-xs font-semibold text-[#16c784] hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>My Account & Orders</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#16c784]" />
                </button>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-xs text-slate-300 mb-3">Sign in to unlock VIP ordering & instant QR payments</p>
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="w-full py-2 px-4 rounded-full bg-[#16c784] text-[#03140e] font-bold text-xs hover:brightness-110 transition-all shadow-[0_0_15px_rgba(22,199,132,0.4)]"
                >
                  Log In / Sign Up
                </button>
              </div>
            )}
          </div>

          {/* STRICT ADMIN ACCESS: Admin Panel only visible to deshmaneadinath128@gmail.com */}
          {isAdmin && (
            <div className="mb-5">
              <button
                onClick={() => {
                  onClose();
                  onOpenAdmin();
                }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-[#08291e] to-[#041a12] border border-[#16c784] text-[#16c784] font-semibold text-xs tracking-wider shadow-[0_0_15px_rgba(22,199,132,0.2)] hover:bg-[#0b3829] transition-all"
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#e5c98b]" />
                  <span>ADMIN DASHBOARD</span>
                </span>
                <ChevronRight className="w-4 h-4 text-[#16c784]" />
              </button>
            </div>
          )}

          {/* DEDICATED "MY FAVORITES" (WISHLIST) SECTION */}
          <div className="mb-6 p-3.5 rounded-2xl bg-[#041a12] border border-[#16c784]/25">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                <span className="text-xs font-mono uppercase tracking-wider text-white font-bold">
                  My Favorites
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold">
                {favoriteProducts.length}
              </span>
            </div>

            {favoriteProducts.length === 0 ? (
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans py-1">
                No items saved to favorites yet. Tap the heart on any edition to pin it here.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {favoriteProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-2.5 rounded-xl bg-[#020d09] border border-[#16c784]/20 flex items-center gap-2.5 group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-[#041a12] overflow-hidden shrink-0 border border-[#16c784]/30">
                      <img
                        src={prod.imageUrl}
                        alt={prod.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-mono text-[#e5c98b] font-bold block uppercase">
                        {prod.category}
                      </span>
                      <h5 className="text-xs font-semibold text-slate-200 truncate">
                        {prod.title}
                      </h5>
                      <span className="text-xs font-extrabold text-[#16c784] font-mono block">
                        ₹{prod.price.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          onClose();
                          onAddToCart(prod);
                        }}
                        className="p-1.5 rounded-lg bg-[#08291e] hover:bg-[#0c3e2e] text-[#16c784]"
                        title="Add to Cart"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          onClose();
                          onBuyNow(prod);
                        }}
                        className="p-1.5 rounded-lg bg-[#16c784] hover:bg-[#1ae095] text-[#03140e]"
                        title="Buy Now"
                      >
                        <Zap className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onToggleWishlist(prod.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                        title="Remove from favorites"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Categories */}
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-2">
              Collections
            </p>
            <button
              onClick={() => {
                onSelectCategory('ALL');
                onClose();
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wider flex items-center justify-between transition-colors ${
                activeCategory === 'ALL'
                  ? 'bg-[#16c784]/20 text-[#16c784] border border-[#16c784]/40'
                  : 'text-slate-300 hover:text-white hover:bg-[#08291e]'
              }`}
            >
              <span>ALL EDITIONS</span>
              <Sparkles className="w-3.5 h-3.5 text-[#e5c98b]" />
            </button>

            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  onSelectCategory(cat);
                  onClose();
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wider flex items-center justify-between transition-colors ${
                  activeCategory === cat
                    ? 'bg-[#16c784]/20 text-[#16c784] border border-[#16c784]/40'
                    : 'text-slate-300 hover:text-white hover:bg-[#08291e]'
                }`}
              >
                <span>{cat}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-50" />
              </button>
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="pt-5 border-t border-[#16c784]/20 space-y-2">
          {/* Customer Support Button (accessible even to banned users) */}
          <button
            onClick={() => {
              onClose();
              onOpenSupport();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium text-slate-300 hover:text-[#e5c98b] hover:bg-[#08291e] transition-colors border border-slate-800"
          >
            <Headphones className="w-4 h-4 text-[#16c784]" />
            <span>Private Concierge Support</span>
          </button>

          {currentUser && (
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
