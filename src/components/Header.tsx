import React, { useState } from 'react';
import { ShoppingBag, Search, User as UserIcon, Shield, Menu, X, Check, Sparkles, Heart } from 'lucide-react';
import { CategoryType, CATEGORIES, User } from '../types';
import { isAdminUser } from '../services/storage';

interface HeaderProps {
  currentUser: User | null;
  activeCategory: CategoryType | 'ALL';
  onSelectCategory: (cat: CategoryType | 'ALL') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  cartCount: number;
  wishlistCount?: number;
  onOpenCart: () => void;
  onOpenWishlist?: () => void;
  onOpenAuth: () => void;
  onOpenAccount: () => void;
  onOpenAdmin: () => void;
  onOpenSupport: () => void;
  onOpenUserMenu?: () => void;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  cartCount,
  wishlistCount = 0,
  onOpenCart,
  onOpenWishlist,
  onOpenAuth,
  onOpenAccount,
  onOpenAdmin,
  onOpenSupport,
  onToggleSidebar
}) => {
  const [showSearchInput, setShowSearchInput] = useState(false);
  const isAdmin = isAdminUser(currentUser);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#03140e]/90 border-b border-[#16c784]/20 shadow-2xl">
      {/* 1. Top Announcement Bar */}
      <div className="w-full bg-gradient-to-r from-[#03140e] via-[#092e21] to-[#03140e] border-b border-[#e5c98b]/20 py-1.5 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-[11px] sm:text-xs font-medium tracking-widest text-[#e5c98b]">
          <span className="text-[#16c784]">✦</span>
          <span className="uppercase">Exclusive VIP Access & High-Performance Vault — Instant UTR Verification</span>
          <span className="text-[#16c784]">✦</span>
        </div>
      </div>

      {/* 2. Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Left: Hamburger menu */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="p-2.5 rounded-lg text-slate-300 hover:text-[#16c784] hover:bg-[#08291e]/80 transition-all border border-[#16c784]/15 focus:outline-none focus:ring-1 focus:ring-[#16c784]"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick Support Link */}
            <button
              onClick={onOpenSupport}
              className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-[#e5c98b] transition-colors px-3 py-1.5 rounded-md hover:bg-[#08291e]/50 border border-slate-800"
            >
              <span className="w-2 h-2 rounded-full bg-[#16c784] animate-pulse"></span>
              <span>Concierge Support</span>
            </button>
          </div>

          {/* Center: Brand Title in Warm Champagne Gold */}
          <div className="flex flex-col items-center justify-center text-center">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onSelectCategory('ALL');
              }}
              className="group flex items-center gap-2"
            >
              <span className="font-brand text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-[0.25em] gold-gradient-text drop-shadow-[0_2px_12px_rgba(229,201,139,0.3)] transition-transform group-hover:scale-[1.01]">
                F1 STORE
              </span>
            </a>
            <span className="text-[9px] sm:text-[10px] tracking-[0.3em] uppercase text-emerald-400/80 font-mono -mt-1 font-semibold">
              High-Performance Editions
            </span>
          </div>

          {/* Right: Search, Admin Button (Strictly Admin only), User Auth, Cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Input toggle */}
            <div className="relative">
              {showSearchInput ? (
                <div className="flex items-center bg-[#051c14] border border-[#16c784]/40 rounded-full px-3 py-1.5 shadow-lg w-44 sm:w-64 transition-all">
                  <Search className="w-4 h-4 text-[#16c784] shrink-0 mr-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search collection..."
                    className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setShowSearchInput(false);
                      onSearchChange('');
                    }}
                    className="text-slate-400 hover:text-white ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSearchInput(true)}
                  className="p-2.5 rounded-lg text-slate-300 hover:text-[#16c784] hover:bg-[#08291e]/80 transition-all border border-[#16c784]/15"
                  title="Search Vault"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* STRICT ADMIN ACCESS: Admin Panel Button ONLY for deshmaneadinath128@gmail.com */}
            {isAdmin && (
              <button
                onClick={onOpenAdmin}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-[#03140e] bg-gradient-to-r from-[#e5c98b] to-[#16c784] shadow-[0_0_15px_rgba(22,199,132,0.4)] hover:brightness-110 transition-all cursor-pointer font-sans"
              >
                <Shield className="w-3.5 h-3.5 text-[#03140e]" />
                <span>Admin Panel</span>
              </button>
            )}

            {/* User Account / Login */}
            <button
              onClick={() => {
                if (currentUser) {
                  onOpenAccount();
                } else {
                  onOpenAuth();
                }
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                currentUser
                  ? 'border-[#16c784]/40 bg-[#06241a] text-slate-100 hover:border-[#16c784] shadow-sm'
                  : 'border-slate-800 bg-[#041a12] text-slate-300 hover:text-[#16c784] hover:border-[#16c784]/30'
              }`}
              title={currentUser ? `My Account (${currentUser.role})` : 'Log In / Sign Up'}
            >
              <UserIcon className="w-4 h-4 text-[#16c784]" />
              <span className="hidden sm:inline max-w-[110px] truncate">
                {currentUser ? (isAdmin ? 'Admin' : currentUser.name || 'VIP Member') : 'Sign In'}
              </span>
            </button>

            {/* Wishlist / Favorites Icon */}
            <button
              onClick={onOpenWishlist}
              className="relative p-2.5 rounded-lg text-slate-300 hover:text-rose-400 hover:bg-[#08291e]/80 transition-all border border-[#16c784]/15 cursor-pointer"
              aria-label="View My Favorites"
              title="My Favorites"
            >
              <Heart className={`w-5 h-5 ${wishlistCount > 0 ? 'text-rose-400 fill-rose-400/30' : ''}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Icon */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 rounded-lg text-slate-300 hover:text-[#16c784] hover:bg-[#08291e]/80 transition-all border border-[#16c784]/15 cursor-pointer"
              aria-label="View Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#16c784] text-[#03140e] text-[10px] font-bold flex items-center justify-center shadow-[0_0_10px_#16c784]">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Category Navigation Bar directly below the header */}
      {/* Category Navigation Bar directly below the header with ONLY these 5 categories: NEW ARRIVALS | SILVER | GOLD | PLATINUM | DIAMOND */}
      <div className="w-full bg-[#020d09]/80 border-t border-[#16c784]/15 py-2.5 px-4 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 sm:gap-4 md:gap-8 min-w-max">
          <button
            onClick={() => onSelectCategory('ALL')}
            className={`px-3 py-1 text-xs font-semibold tracking-wider transition-all cursor-pointer rounded-full ${
              activeCategory === 'ALL'
                ? 'bg-[#16c784]/20 text-[#16c784] border border-[#16c784]/60 shadow-[0_0_12px_rgba(22,199,132,0.25)]'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            ALL EDITIONS
          </button>
          
          <span className="text-slate-700">|</span>

          {CATEGORIES.map((cat, idx) => {
            const isActive = activeCategory === cat;
            return (
              <React.Fragment key={cat}>
                <button
                  onClick={() => onSelectCategory(cat)}
                  className={`px-3.5 py-1 text-xs font-bold tracking-widest uppercase transition-all cursor-pointer rounded-full ${
                    isActive
                      ? 'bg-gradient-to-r from-[#16c784]/25 to-[#e5c98b]/20 text-white border border-[#16c784] shadow-[0_0_15px_rgba(22,199,132,0.3)]'
                      : 'text-slate-300 hover:text-[#16c784] border border-transparent hover:border-[#16c784]/30'
                  }`}
                >
                  {cat}
                </button>
                {idx < CATEGORIES.length - 1 && (
                  <span className="text-slate-700 hidden sm:inline">|</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </header>
  );
};
