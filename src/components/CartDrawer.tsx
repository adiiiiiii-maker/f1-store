import React from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Sparkles } from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}) => {
  if (!isOpen) return null;

  const totalAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-[#03140e] border-l border-[#16c784]/30 h-full p-6 flex flex-col justify-between shadow-2xl z-10 overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-5 border-b border-[#16c784]/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#041d14] border border-[#16c784]/30 text-[#16c784]">
              <ShoppingBag className="w-5 h-5 text-[#16c784]" />
            </div>
            <div>
              <h3 className="font-brand text-lg font-black text-white gold-gradient-text">
                VIP VAULT BAG
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {totalCount} {totalCount === 1 ? 'Item' : 'Items'} Selected
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#08291e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto py-5 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-300">Your bag is empty</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-6">
                Explore our high-performance editions and add items to your cart.
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-full bg-[#08291e] border border-[#16c784]/40 text-[#16c784] text-xs font-bold hover:bg-[#0b3829] transition-all cursor-pointer"
              >
                Browse Collection
              </button>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="p-3.5 rounded-2xl bg-[#041a12] border border-[#16c784]/20 flex gap-3.5 items-center group"
              >
                <div className="w-16 h-16 rounded-xl bg-[#020b08] overflow-hidden shrink-0 border border-[#16c784]/20">
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-[#e5c98b] font-bold">
                    {product.category}
                  </span>
                  <h4 className="text-xs font-bold text-slate-100 truncate">
                    {product.title}
                  </h4>
                  <p className="text-xs font-extrabold text-[#16c784] font-mono mt-0.5">
                    ₹{product.price.toLocaleString('en-IN')}
                  </p>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center bg-[#020d09] border border-[#16c784]/30 rounded-lg px-2 py-0.5">
                      <button
                        onClick={() => onUpdateQuantity(product.id, -1)}
                        className="text-slate-400 hover:text-white p-0.5"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-mono font-bold text-white px-2">
                        {quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(product.id, 1)}
                        className="text-slate-400 hover:text-white p-0.5"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(product.id)}
                      className="p-1 rounded-md text-slate-500 hover:text-rose-400 transition-colors ml-auto"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout */}
        {items.length > 0 && (
          <div className="pt-4 border-t border-[#16c784]/20 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono uppercase">VIP Subtotal</span>
              <span className="text-xl font-black text-[#16c784] font-mono tabular-nums">
                ₹{totalAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <p className="text-[10px] text-slate-400 font-mono">
              ✦ Includes immediate dynamic 5-minute QR generation and verified UTR dispatch.
            </p>

            <button
              onClick={() => {
                onClose();
                onCheckout();
              }}
              className="w-full py-3.5 px-6 rounded-full bg-[#16c784] hover:bg-[#1ae095] text-[#03140e] font-black text-xs uppercase tracking-widest shadow-[0_0_25px_rgba(22,199,132,0.45)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>PROCEED TO VIP CHECKOUT</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
