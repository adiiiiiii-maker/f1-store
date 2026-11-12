import React from 'react';
import { PackageOpen, Plus, Shield, Sparkles } from 'lucide-react';
import { Product, User } from '../types';
import { ProductCard } from './ProductCard';
import { isAdminUser } from '../services/storage';

interface ProductGridProps {
  products: Product[];
  currentUser: User | null;
  wishlistIds?: string[];
  onToggleWishlist?: (productId: string) => void;
  onBuyNow: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onOpenAdmin: () => void;
  activeCategory: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  currentUser,
  wishlistIds = [],
  onToggleWishlist,
  onBuyNow,
  onAddToCart,
  onOpenAdmin,
  activeCategory
}) => {
  const isAdmin = isAdminUser(currentUser);

  // 1. Luxury Empty State (Zero Pre-Added or Fashion Products rule)
  if (products.length === 0) {
    return (
      <div className="w-full py-16 sm:py-24 px-4">
        <div className="max-w-2xl mx-auto rounded-3xl glass-card p-8 sm:p-12 text-center relative overflow-hidden border border-[#16c784]/30 shadow-[0_0_50px_rgba(22,199,132,0.1)]">
          {/* Ambient background glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#16c784]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#041e14] border border-[#16c784]/40 text-[#16c784] mb-6 shadow-[0_0_20px_rgba(22,199,132,0.25)]">
            <PackageOpen className="w-8 h-8 sm:w-10 sm:h-10 text-[#16c784]" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#e5c98b]" />
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-[#e5c98b] font-bold">
              {activeCategory === 'ALL' ? 'F1 Store Vault' : activeCategory}
            </span>
            <Sparkles className="w-4 h-4 text-[#e5c98b]" />
          </div>

          <h2 className="font-brand text-2xl sm:text-3xl font-extrabold gold-gradient-text tracking-wide mb-3">
            NO ITEMS CURRENTLY LISTED
          </h2>

          <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed mb-8">
            The collection is currently awaiting fresh inventory.
            Items will appear here immediately once published by the store administrator.
          </p>

          {isAdmin ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#16c784] text-[#03140e] font-extrabold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(22,199,132,0.5)] hover:bg-[#1ae095] transition-all transform hover:scale-105 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add First Item in Admin Panel</span>
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#051c14] border border-[#16c784]/20 text-xs text-slate-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#16c784] animate-ping" />
              <span>Real-time inventory synchronization active</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Asymmetric Studio Grid Layout
  // Row 1: Large 2-column wide featured card on the left + two 1-column cards on the right
  // Row 2: Four equal 1-column cards
  // Subsequent rows: 3 or 4-column balanced grid

  // Find designated featured card or pick the first item
  const featuredIndex = products.findIndex((p) => p.isFeaturedWide);
  const featuredItem = featuredIndex !== -1 ? products[featuredIndex] : products[0];
  const remaining = products.filter((p) => p.id !== featuredItem.id);

  // Split for Row 1 (featured + 2 cards) and Row 2 (4 cards)
  const row1RightCards = remaining.slice(0, 2);
  const row2Cards = remaining.slice(2, 6);
  const extraCards = remaining.slice(6);

  return (
    <div className="w-full space-y-8">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#16c784]/20">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#16c784] uppercase tracking-widest font-semibold mb-1">
            <span>Exclusive Collection</span>
            <span>·</span>
            <span>{products.length} {products.length === 1 ? 'Item' : 'Items'} Available</span>
          </div>
          <h2 className="font-brand text-2xl sm:text-3xl font-extrabold gold-gradient-text tracking-wide">
            {activeCategory === 'ALL' ? 'VAULT ARCHIVES' : activeCategory}
          </h2>
        </div>
      </div>

      {/* ROW 1: Asymmetric Studio Grid - 2-column wide featured on left + two 1-column cards on right */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Large 2-column wide featured card */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2">
          <ProductCard
            product={featuredItem}
            isWide={true}
            isWishlisted={wishlistIds.includes(featuredItem.id)}
            onToggleWishlist={onToggleWishlist}
            onBuyNow={onBuyNow}
            onAddToCart={onAddToCart}
          />
        </div>

        {/* Two 1-column cards on the right */}
        {row1RightCards.map((product) => (
          <div key={product.id} className="col-span-1">
            <ProductCard
              product={product}
              isWide={false}
              isWishlisted={wishlistIds.includes(product.id)}
              onToggleWishlist={onToggleWishlist}
              onBuyNow={onBuyNow}
              onAddToCart={onAddToCart}
            />
          </div>
        ))}
      </div>

      {/* ROW 2: Four equal 1-column cards */}
      {row2Cards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
          {row2Cards.map((product) => (
            <div key={product.id} className="col-span-1">
              <ProductCard
                product={product}
                isWide={false}
                isWishlisted={wishlistIds.includes(product.id)}
                onToggleWishlist={onToggleWishlist}
                onBuyNow={onBuyNow}
                onAddToCart={onAddToCart}
              />
            </div>
          ))}
        </div>
      )}

      {/* EXTRA ROWS: If more than 7 items are added */}
      {extraCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-[#16c784]/15">
          {extraCards.map((product) => (
            <div key={product.id} className="col-span-1">
              <ProductCard
                product={product}
                isWide={false}
                isWishlisted={wishlistIds.includes(product.id)}
                onToggleWishlist={onToggleWishlist}
                onBuyNow={onBuyNow}
                onAddToCart={onAddToCart}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
