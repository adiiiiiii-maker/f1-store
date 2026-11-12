import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, CheckCircle2, ShieldCheck, AlertCircle, Copy, Check, QrCode, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, User, Order, QRPaymentConfig } from '../types';
import { getQRConfig, createOrder } from '../services/storage';

interface BuyNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  // If checking out entire cart
  cartItemsTotal?: number;
  cartItemsSummary?: string;
  currentUser: User | null;
  onOrderSuccess: (order: Order) => void;
}

export const BuyNowModal: React.FC<BuyNowModalProps> = ({
  isOpen,
  onClose,
  product,
  cartItemsTotal,
  cartItemsSummary,
  currentUser,
  onOrderSuccess
}) => {
  // 5 minutes in seconds = 300 seconds
  const INITIAL_SECONDS = 300;
  const [timeLeft, setTimeLeft] = useState<number>(INITIAL_SECONDS);
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [qrConfig, setQrConfig] = useState<QRPaymentConfig>(() => getQRConfig());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQrConfig(getQRConfig());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleQR = () => setQrConfig(getQRConfig());
    window.addEventListener('f1_qr_updated', handleQR);
    return () => window.removeEventListener('f1_qr_updated', handleQR);
  }, []);

  // Determine amount and title
  const amount = cartItemsTotal !== undefined ? cartItemsTotal : (product?.price || 0);
  const title = cartItemsSummary || product?.title || 'F1 Store Exclusive';
  const category = product?.category || 'PLATINUM';

  // Timer Effect
  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(INITIAL_SECONDS);
      setUtrNumber('');
      setErrorMsg('');
      setCompletedOrder(null);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Reset timer when opened
    setTimeLeft(INITIAL_SECONDS);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          // AUTO-REFRESH RULE: The exact moment the 5-minute countdown timer reaches 00:00,
          // automatically refresh/reload the entire page (window.location.reload())
          window.location.reload();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Format MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Time percentage for circular / bar indicator
  const timeProgress = (timeLeft / INITIAL_SECONDS) * 100;
  const isTimeCritical = timeLeft < 60;

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(amount.toString());
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  const handleCopyUpi = () => {
    if (qrConfig.upiId) {
      navigator.clipboard.writeText(qrConfig.upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  const handleUtrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clean to alphanumeric uppercase / digits, max 12 chars
    const cleaned = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 12);
    setUtrNumber(cleaned);
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setErrorMsg('You must be signed in to submit payment.');
      return;
    }

    if (utrNumber.trim().length !== 12) {
      setErrorMsg('Please enter a valid 12-digit / 12-character UTR transaction reference number.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    // Stop timer
    if (timerRef.current) clearInterval(timerRef.current);

    setTimeout(() => {
      const newOrder = createOrder({
        productId: product?.id,
        productTitle: title,
        category: category,
        amount: amount,
        itemsCount: 1,
        userEmail: currentUser.email,
        userId: currentUser.id,
        utrNumber: utrNumber.trim()
      });

      setCompletedOrder(newOrder);
      setIsSubmitting(false);
      onOrderSuccess(newOrder);

      // Trigger luxury celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#16c784', '#e5c98b', '#10b981', '#f59e0b']
        });
      } catch (err) {
        // no-op if confetti fails in sandbox
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-3xl glass-card border border-[#16c784]/40 p-6 sm:p-8 shadow-[0_0_60px_rgba(22,199,132,0.25)] my-8 z-10 overflow-hidden">
        
        {/* Subtle top ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-2 bg-[#16c784] shadow-[0_0_30px_#16c784]" />

        {/* Header Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-[#08291e] transition-colors"
          disabled={isSubmitting}
        >
          <X className="w-5 h-5" />
        </button>

        {completedOrder ? (
          /* SUCCESS CONFIRMATION STATE */
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-[#16c784]/20 border border-[#16c784] text-[#16c784] flex items-center justify-center mx-auto mb-4 shadow-[0_0_25px_rgba(22,199,132,0.4)]">
              <CheckCircle2 className="w-10 h-10 text-[#16c784]" />
            </div>

            <div className="inline-block px-3 py-1 rounded-full bg-[#e5c98b]/20 text-[#e5c98b] border border-[#e5c98b]/40 text-xs font-mono font-bold tracking-widest uppercase mb-2">
              UTR CONFIRMATION SUBMITTED
            </div>

            <h3 className="font-brand text-2xl font-black text-slate-100 gold-gradient-text mb-2">
              ORDER RECEIVED
            </h3>

            <p className="text-xs text-slate-300 max-w-sm mx-auto mb-6">
              Your 12-digit UTR reference has been transmitted to the store administrator for instant verification.
            </p>

            {/* Receipt Summary Box */}
            <div className="rounded-2xl bg-[#03140e] border border-[#16c784]/30 p-4 text-left space-y-2 mb-6">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono">Order ID:</span>
                <span className="text-[#16c784] font-mono font-bold">{completedOrder.id}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono">Item:</span>
                <span className="text-slate-200 font-medium truncate max-w-[200px]">{completedOrder.productTitle}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono">Amount Paid:</span>
                <span className="text-[#e5c98b] font-mono font-bold">₹{completedOrder.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono">12-Digit UTR:</span>
                <span className="text-white font-mono tracking-wider font-bold bg-[#052217] px-2 py-0.5 rounded">
                  {completedOrder.utrNumber}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1 border-t border-[#16c784]/20">
                <span className="text-slate-400 font-mono">Verification Status:</span>
                <span className="inline-flex items-center gap-1.5 text-amber-400 font-mono font-semibold text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  Pending Admin Approval
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 px-6 rounded-full bg-[#16c784] hover:bg-[#1ae095] text-[#03140e] font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(22,199,132,0.4)] transition-all cursor-pointer"
            >
              Done & Return to Vault
            </button>
          </div>
        ) : (
          /* PAYMENT ACTIVE MODAL */
          <div>
            {/* 1. Item Details */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#e5c98b] font-bold">
                  {category} TIER
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-[10px] text-slate-400 font-mono">Instant Dispatch</span>
              </div>
              <h3 className="font-brand text-lg sm:text-xl font-bold text-slate-100 leading-snug truncate">
                {title}
              </h3>
            </div>

            {/* 2. Amount & 5-Minute Live Countdown Timer */}
            <div className="p-3.5 rounded-2xl bg-[#041a12] border border-[#16c784]/30 flex items-center justify-between gap-4 mb-5">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Amount Payable
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-extrabold text-[#16c784] font-mono tabular-nums">
                    ₹{amount.toLocaleString('en-IN')}
                  </span>
                  <button
                    onClick={handleCopyAmount}
                    className="p-1 rounded text-slate-400 hover:text-[#e5c98b] transition-colors"
                    title="Copy Amount"
                  >
                    {copiedAmount ? <Check className="w-3.5 h-3.5 text-[#16c784]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* 5-Minute Countdown Timer Widget */}
              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5 mb-1">
                  <Clock className={`w-3.5 h-3.5 ${isTimeCritical ? 'text-rose-400 animate-pulse' : 'text-[#e5c98b]'}`} />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300">
                    Session Expires In
                  </span>
                </div>
                <div className={`font-mono text-2xl font-black tabular-nums tracking-widest ${
                  isTimeCritical ? 'text-rose-400 animate-pulse' : 'text-[#e5c98b]'
                }`}>
                  {formattedTime}
                </div>
              </div>
            </div>

            {/* Timer visual progress line */}
            <div className="w-full bg-[#020d09] h-1.5 rounded-full overflow-hidden mb-5">
              <div
                className={`h-full transition-all duration-1000 ${
                  isTimeCritical ? 'bg-rose-500' : 'bg-gradient-to-r from-[#16c784] to-[#e5c98b]'
                }`}
                style={{ width: `${timeProgress}%` }}
              />
            </div>

            {/* 3. The Payment QR Code */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#020b08] border border-[#16c784]/25 mb-5 relative group">
              <div className="relative p-2 rounded-xl bg-[#03140e] border border-[#16c784]/40 shadow-[0_0_25px_rgba(22,199,132,0.15)]">
                <img
                  src={qrConfig.qrImageUrl}
                  alt="Payment QR Code"
                  referrerPolicy="no-referrer"
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg"
                />
              </div>

              {/* QR Metadata */}
              <div className="mt-3 text-center">
                <p className="text-xs font-semibold text-slate-200">
                  {qrConfig.merchantName}
                </p>
                {qrConfig.upiId && (
                  <div className="flex items-center justify-center gap-1.5 mt-0.5">
                    <span className="text-[11px] font-mono text-emerald-400">{qrConfig.upiId}</span>
                    <button
                      onClick={handleCopyUpi}
                      className="p-1 rounded text-slate-400 hover:text-white"
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? <Check className="w-3 h-3 text-[#16c784]" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-normal">
                  {qrConfig.instructions}
                </p>
              </div>
            </div>

            {/* 4. Input Field for 12-Digit UTR / Transaction ID */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="utrInput" className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                    Enter 12-Digit UTR / Transaction ID
                  </label>
                  <span className="text-[10px] font-mono text-[#16c784]">
                    {utrNumber.length}/12 Digits
                  </span>
                </div>

                <div className="relative">
                  <input
                    id="utrInput"
                    type="text"
                    required
                    maxLength={12}
                    value={utrNumber}
                    onChange={handleUtrChange}
                    placeholder="e.g. 432109876543"
                    className="w-full px-4 py-3 rounded-xl bg-[#041d14] border border-[#16c784]/50 focus:border-[#16c784] focus:ring-2 focus:ring-[#16c784]/30 text-white font-mono text-base tracking-widest uppercase placeholder:text-slate-600 focus:outline-none transition-all"
                  />
                  {utrNumber.length === 12 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#16c784]">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}
                </div>

                {errorMsg && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-400">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || utrNumber.length !== 12}
                className="w-full py-3.5 px-6 rounded-full bg-[#16c784] hover:bg-[#1ae095] disabled:bg-slate-800 disabled:text-slate-500 disabled:border-transparent text-[#03140e] font-black text-xs uppercase tracking-widest shadow-[0_0_25px_rgba(22,199,132,0.4)] disabled:shadow-none transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-[#03140e] border-t-transparent rounded-full animate-spin" />
                    <span>Verifying UTR...</span>
                  </span>
                ) : (
                  <>
                    <span>Confirm & Submit Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Auto-Refresh Disclaimer */}
              <p className="text-[10px] text-center text-slate-400 font-mono">
                ✦ Security Protocol: Page auto-refreshes when timer hits 00:00 to refresh dynamic rates.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
