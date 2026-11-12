import React from 'react';
import { Star, ShoppingCart, Zap, Sparkles, Heart } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  isWide?: boolean;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
  onBuyNow: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWide = false,
  isWishlisted = false,
  onToggleWishlist,
  onBuyNow,
  onAddToCart
}) => {
  const rating = product.rating || 5;

  return (
    <div
      className={`group relative rounded-2xl glass-card glass-card-hover overflow-hidden flex flex-col justify-between transition-all duration-300 ${
        isWide ? 'md:col-span-2 md:flex-row' : 'col-span-1'
      }`}
    >
      {/* Subtle emerald neon ambient glow corner */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#16c784]/10 rounded-full blur-2xl pointer-events-none group-hover:bg-[#16c784]/20 transition-all" />

      {/* Image container */}
      <div
        className={`relative overflow-hidden bg-[#020b08] flex items-center justify-center ${
          isWide ? 'md:w-1/2 min-h-[260px] sm:min-h-[320px]' : 'w-full h-56 sm:h-64'
        }`}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={(e) => {
              // Graceful SVG fallback container
              const target = e.currentTarget;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#041d14] to-[#020d09]">
                    <span class="text-3xl mb-2 text-[#e5c98b]">✦</span>
                    <span class="text-xs uppercase font-mono tracking-widest text-[#16c784] font-semibold">${product.category}</span>
                    <span class="text-sm font-semibold text-slate-200 mt-1">${product.title}</span>
                  </div>
                `;
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#041d14] to-[#020d09]">
            <span className="text-3xl mb-2 text-[#e5c98b]">✦</span>
            <span className="text-xs uppercase font-mono tracking-widest text-[#16c784] font-semibold">
              {product.category}
            </span>
            <span className="text-sm font-semibold text-slate-200 mt-1">{product.title}</span>
          </div>
        )}

        {/* Featured Wide Card badge or Category Tier */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#03140e]/85 backdrop-blur-md border border-[#e5c98b]/40 shadow-lg">
          <Sparkles className="w-3 h-3 text-[#e5c98b]" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-[#e5c98b] font-mono">
            {product.category}
          </span>
        </div>

        {/* Top Right: Wishlist Heart & Featured Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          {product.isFeaturedWide && (
            <div className="px-2 py-0.5 rounded-full bg-[#16c784]/20 border border-[#16c784]/60 text-[#16c784] text-[9px] font-bold tracking-wider uppercase backdrop-blur-md">
              FEATURED
            </div>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist?.(product.id);
            }}
            className={`p-2 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
              isWishlisted
                ? 'bg-rose-500/25 text-rose-400 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.4)] scale-105'
                : 'bg-[#03140e]/80 text-slate-400 border-[#16c784]/30 hover:text-rose-400 hover:border-rose-400/50 hover:scale-105'
            }`}
            title={isWishlisted ? 'Remove from Favorites' : 'Add to Favorites'}
            aria-label={isWishlisted ? 'Remove from Favorites' : 'Add to Favorites'}
          >
            <Heart className={`w-3.5 h-3.5 transition-transform ${isWishlisted ? 'fill-rose-400 text-rose-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content Details */}
      <div
        className={`p-5 sm:p-6 flex flex-col justify-between flex-1 ${
          isWide ? 'md:w-1/2' : ''
        }`}
      >
        <div>
          {/* Champagne Gold 5-star ratings */}
          <div className="flex items-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < rating
                    ? 'text-[#e5c98b] fill-[#e5c98b]'
                    : 'text-slate-600 fill-transparent'
                }`}
              />
            ))}
            <span className="text-[11px] font-mono text-slate-400 ml-1.5">
              5.0 VIP
            </span>
          </div>

          {/* Product Title */}
          <h3 className="text-base sm:text-lg font-bold text-slate-100 group-hover:text-[#e5c98b] transition-colors leading-snug line-clamp-2">
            {product.title}
          </h3>

          {/* Short Description */}
          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-3">
            {product.description || 'Exclusive authenticated F1 Store edition with immediate dynamic QR dispatch.'}
          </p>
        </div>

        {/* Price & Action Buttons */}
        <div className="mt-5 pt-4 border-t border-[#16c784]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400 block">
              Tier Price
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-extrabold text-[#16c784] font-mono tabular-nums">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Vibrant Neon-Emerald Rounded Pill Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAddToCart(product)}
              className="p-2.5 rounded-full bg-[#08291e] hover:bg-[#0c3e2e] text-[#16c784] border border-[#16c784]/40 hover:border-[#16c784] transition-all cursor-pointer shadow-md"
              title="Add to Cart"
              aria-label="Add to Cart"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>

            <button
              onClick={() => onBuyNow(product)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-[#16c784] hover:bg-[#1ae095] text-[#03140e] font-extrabold text-xs tracking-wider uppercase transition-all transform hover:scale-[1.03] active:scale-[0.98] cursor-pointer shadow-[0_0_18px_rgba(22,199,132,0.45)] whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5 fill-[#03140e]" />
              <span>BUY NOW</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
