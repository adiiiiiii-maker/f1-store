import React from 'react';
import { ShieldCheck, Zap, Headphones, Award, Sparkles } from 'lucide-react';

interface FooterProps {
  onOpenSupport: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenSupport }) => {
  return (
    <footer className="w-full bg-[#020b08] border-t border-[#16c784]/20 pt-12 pb-8 mt-20 relative overflow-hidden">
      {/* Background ambient radial glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-[#16c784]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* 1. Value Propositions Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-12 border-b border-[#16c784]/15">
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#03140e]/60 border border-[#16c784]/15">
            <div className="p-2.5 rounded-xl bg-[#041d14] text-[#16c784] border border-[#16c784]/30 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#e5c98b] font-mono">
                Encrypted Gateway
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Dynamic 5-minute QR generation with automated banking session expiry.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#03140e]/60 border border-[#16c784]/15">
            <div className="p-2.5 rounded-xl bg-[#041d14] text-[#16c784] border border-[#16c784]/30 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#e5c98b] font-mono">
                Instant UTR Dispatch
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Direct 12-digit transaction ledger settlement with real-time verification.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#03140e]/60 border border-[#16c784]/15">
            <div className="p-2.5 rounded-xl bg-[#041d14] text-[#16c784] border border-[#16c784]/30 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#e5c98b] font-mono">
                Tier Authenticity
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Individually curated Silver, Gold, Platinum, and Diamond grade allocations.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#03140e]/60 border border-[#16c784]/15">
            <div className="p-2.5 rounded-xl bg-[#041d14] text-[#16c784] border border-[#16c784]/30 shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#e5c98b] font-mono">
                Private Concierge
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                End-to-end encrypted ticket support accessible 24/7 inside the app.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Middle Row: Brand & Socials */}
        <div className="py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <span className="font-brand text-2xl font-black gold-gradient-text tracking-[0.2em]">
              F1 STORE
            </span>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Ultra-luxury dark-forest digital boutique specializing in tier-grade high-performance acquisitions.
            </p>
          </div>

          {/* Social Media Icons */}
          <div className="flex items-center gap-3">
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="w-10 h-10 rounded-full bg-[#041a12] border border-[#16c784]/20 hover:border-[#16c784] hover:text-[#16c784] text-slate-400 flex items-center justify-center transition-all"
              aria-label="X / Twitter"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>

            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="w-10 h-10 rounded-full bg-[#041a12] border border-[#16c784]/20 hover:border-[#16c784] hover:text-[#16c784] text-slate-400 flex items-center justify-center transition-all"
              aria-label="Instagram"
            >
              <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>

            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="w-10 h-10 rounded-full bg-[#041a12] border border-[#16c784]/20 hover:border-[#16c784] hover:text-[#16c784] text-slate-400 flex items-center justify-center transition-all"
              aria-label="Telegram"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
            </a>

            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="w-10 h-10 rounded-full bg-[#041a12] border border-[#16c784]/20 hover:border-[#16c784] hover:text-[#16c784] text-slate-400 flex items-center justify-center transition-all"
              aria-label="Discord"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* 3. Bottom Copyright & Support Link */}
        <div className="pt-6 border-t border-[#16c784]/15 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-mono gap-3">
          <p>© {new Date().getFullYear()} F1 STORE VAULT. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <button
              onClick={onOpenSupport}
              className="text-slate-400 hover:text-[#16c784] transition-colors"
            >
              Concierge Ticket Desk
            </button>
            <span>·</span>
            <span className="text-slate-500">Encrypted UTR Protocol</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
