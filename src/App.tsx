import React, { useState, useEffect } from 'react';
import {
  Header
} from './components/Header';
import {
  SidebarDrawer
} from './components/SidebarDrawer';
import {
  ProductGrid
} from './components/ProductGrid';
import {
  BuyNowModal
} from './components/BuyNowModal';
import {
  CartDrawer
} from './components/CartDrawer';
import {
  AuthModal
} from './components/AuthModal';
import {
  UserAccountModal
} from './components/UserAccountModal';
import {
  BannedNoticeModal
} from './components/BannedNoticeModal';
import {
  CustomerSupportModal
} from './components/CustomerSupportModal';
import {
  AdminPanel
} from './components/AdminPanel';
import {
  Footer,
  FeaturesTrustSection
} from './components/Footer';
import {
  AdSlot
} from './components/AdSlot';
import {
  Product,
  CategoryType,
  User,
  CartItem,
  Order,
  AdConfig
} from './types';
import {
  getProducts,
  getCurrentUser,
  logoutUser,
  isAdminUser,
  getWishlist,
  toggleWishlist,
  getAdConfig
} from './services/storage';
import { Headphones, Shield, Sparkles } from 'lucide-react';

export default function App() {
  // Main states
  const [products, setProducts] = useState<Product[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [adConfig, setAdConfig] = useState<AdConfig>(() => getAdConfig());

  // Modals & Drawers
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [activeBuyProduct, setActiveBuyProduct] = useState<Product | null>(null);
  const [isCheckingOutCart, setIsCheckingOutCart] = useState(false);

  // Sync data from storage
  const syncData = () => {
    setProducts(getProducts());
    setCurrentUser(getCurrentUser());
    setWishlistIds(getWishlist());
    setAdConfig(getAdConfig());
  };

  useEffect(() => {
    syncData();

    // Listen for storage events across components
    const handleProductsUpdate = () => setProducts(getProducts());
    const handleAuthUpdate = () => setCurrentUser(getCurrentUser());
    const handleUsersUpdate = () => setCurrentUser(getCurrentUser());
    const handleWishlistUpdate = () => setWishlistIds(getWishlist());
    const handleAdsUpdate = () => setAdConfig(getAdConfig());

    window.addEventListener('f1_products_updated', handleProductsUpdate);
    window.addEventListener('f1_auth_updated', handleAuthUpdate);
    window.addEventListener('f1_users_updated', handleUsersUpdate);
    window.addEventListener('f1_wishlist_updated', handleWishlistUpdate);
    window.addEventListener('f1_ads_updated', handleAdsUpdate);

    return () => {
      window.removeEventListener('f1_products_updated', handleProductsUpdate);
      window.removeEventListener('f1_auth_updated', handleAuthUpdate);
      window.removeEventListener('f1_users_updated', handleUsersUpdate);
      window.removeEventListener('f1_wishlist_updated', handleWishlistUpdate);
      window.removeEventListener('f1_ads_updated', handleAdsUpdate);
    };
  }, []);

  // Filter products by category and search query
  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === 'ALL' || p.category === activeCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Favorite products list for My Favorites section
  const favoriteProducts = products.filter((p) => wishlistIds.includes(p.id));

  // Wishlist operations
  const handleToggleWishlist = (productId: string) => {
    const updated = toggleWishlist(productId);
    setWishlistIds(updated);
  };

  // Cart operations
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // BUY NOW Flow:
  // Requires user to be logged in (if not logged in, open login modal first)
  const handleInitiateBuyNow = (product: Product) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }

    if (currentUser.isBanned) {
      return; // Banned modal locks access
    }

    setIsCheckingOutCart(false);
    setActiveBuyProduct(product);
  };

  const handleInitiateCartCheckout = () => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }

    if (currentUser.isBanned) {
      return;
    }

    if (cart.length === 0) return;

    setActiveBuyProduct(null);
    setIsCheckingOutCart(true);
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setIsAccountOpen(false);
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartSummaryText = `VIP Cart (${totalCartCount} items)`;

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-[#16c784]/30 selection:text-[#16c784] relative">
      
      {/* 1. Header Navigation */}
      <Header
        currentUser={currentUser}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={totalCartCount}
        wishlistCount={wishlistIds.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsSidebarOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenSupport={() => setIsSupportOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(true)}
      />

      {/* 1b. Slim Top Ad Slot (Below Category Tabs, Above Product Grid) */}
      {adConfig.adsEnabled && adConfig.topAdCode.trim() && (
        <div className="max-h-[90px] w-full flex justify-center items-center overflow-hidden my-2 px-2">
          <div className="scale-[0.48] sm:scale-[0.78] md:scale-100 origin-center flex justify-center items-center">
            <AdSlot htmlCode={adConfig.topAdCode} />
          </div>
        </div>
      )}

      {/* 2. Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Luxury Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden p-6 sm:p-12 mb-10 border border-[#16c784]/25 glass-card shadow-[0_0_50px_rgba(22,199,132,0.12)]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#16c784]/20 via-[#e5c98b]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#041d14] border border-[#e5c98b]/40 text-[#e5c98b] text-[11px] font-mono tracking-widest uppercase mb-4 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#e5c98b]" />
              <span>Official F1 Store Allocation</span>
            </div>

            <h1 className="font-brand text-3xl sm:text-4xl md:text-5xl font-black gold-gradient-text tracking-tight leading-tight">
              PRECISION ENGINEERING & VIP EDITIONS
            </h1>

            <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
              Curated collectible tiers with verified 12-digit UTR bank settlement and 5-minute dynamic QR payment dispatch.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setActiveCategory('ALL')}
                className="px-6 py-2.5 rounded-full bg-[#16c784] hover:bg-[#1ae095] text-[#03140e] font-extrabold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(22,199,132,0.4)] transition-all cursor-pointer"
              >
                Explore Vault
              </button>

              <button
                onClick={() => setIsSupportOpen(true)}
                className="px-5 py-2.5 rounded-full bg-[#08291e] hover:bg-[#0c3e2e] text-[#e5c98b] border border-[#e5c98b]/30 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Concierge Desk
              </button>
            </div>
          </div>
        </div>

        {/* 3. Asymmetric Studio Grid of Products (or Luxury Empty State) */}
        <ProductGrid
          products={filteredProducts}
          currentUser={currentUser}
          wishlistIds={wishlistIds}
          onToggleWishlist={handleToggleWishlist}
          onBuyNow={handleInitiateBuyNow}
          onAddToCart={handleAddToCart}
          onOpenAdmin={() => setIsAdminOpen(true)}
          activeCategory={activeCategory}
        />
      </main>

      {/* 4a. Features & Trust Strip */}
      <FeaturesTrustSection />

      {/* 4b. Compact Bottom Ad Slot (Right Above the Footer) */}
      {adConfig.adsEnabled && adConfig.bottomAdCode.trim() && (
        <div className="w-full max-h-[130px] overflow-hidden my-3 px-4 flex justify-center items-center">
          <AdSlot
            htmlCode={adConfig.bottomAdCode}
            className="max-w-7xl w-full flex justify-center items-center [&_img]:max-h-[95px] [&_img]:w-auto"
          />
        </div>
      )}

      {/* 4c. Footer */}
      <Footer onOpenSupport={() => setIsSupportOpen(true)} />

      {/* 5. Floating Customer Support Quick Button (accessible to all, including banned users) */}
      <button
        onClick={() => setIsSupportOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3.5 rounded-full bg-gradient-to-r from-[#08291e] to-[#041a12] border border-[#16c784] text-[#16c784] hover:text-white shadow-[0_0_25px_rgba(22,199,132,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group cursor-pointer"
        aria-label="Open Private Customer Support"
      >
        <Headphones className="w-5 h-5 text-[#16c784] group-hover:text-[#e5c98b] transition-colors" />
        <span className="hidden sm:inline text-xs font-bold font-mono tracking-wider text-slate-200">
          Support Desk
        </span>
      </button>

      {/* 6. Sidebar Drawer (with My Favorites section & Account link) */}
      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentUser={currentUser}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenSupport={() => setIsSupportOpen(true)}
        onLogout={handleLogout}
        favoriteProducts={favoriteProducts}
        onToggleWishlist={handleToggleWishlist}
        onBuyNow={handleInitiateBuyNow}
        onAddToCart={handleAddToCart}
      />

      {/* 7. Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={handleInitiateCartCheckout}
      />

      {/* 8. Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
        }}
      />

      {/* 9. User Account & Orders Modal */}
      <UserAccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenSupport={() => setIsSupportOpen(true)}
      />

      {/* 10. 5-Minute Dynamic QR Payment Modal */}
      <BuyNowModal
        isOpen={activeBuyProduct !== null || isCheckingOutCart}
        onClose={() => {
          setActiveBuyProduct(null);
          setIsCheckingOutCart(false);
        }}
        product={activeBuyProduct}
        cartItemsTotal={isCheckingOutCart ? totalCartAmount : undefined}
        cartItemsSummary={isCheckingOutCart ? cartSummaryText : undefined}
        currentUser={currentUser}
        onOrderSuccess={(order) => {
          if (isCheckingOutCart) {
            setCart([]);
          }
        }}
      />

      {/* 11. Complete Admin Dashboard (Strictly ONLY deshmaneadinath128@gmail.com) */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        currentUser={currentUser}
      />

      {/* 12. Private In-App Customer Support Modal */}
      <CustomerSupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        currentUser={currentUser}
      />

      {/* 13. Locked Storefront Notice if Current User is Banned */}
      {currentUser && currentUser.isBanned && (
        <BannedNoticeModal
          user={currentUser}
          onOpenSupport={() => setIsSupportOpen(true)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
