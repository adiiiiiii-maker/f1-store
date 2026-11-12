import React from 'react';
import { ShieldAlert, Headphones, LogOut } from 'lucide-react';
import { User } from '../types';

interface BannedNoticeModalProps {
  user: User;
  onOpenSupport: () => void;
  onLogout: () => void;
}

export const BannedNoticeModal: React.FC<BannedNoticeModalProps> = ({
  user,
  onOpenSupport,
  onLogout
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
      <div className="relative w-full max-w-lg rounded-3xl glass-card border border-rose-500/50 p-6 sm:p-8 text-center shadow-[0_0_80px_rgba(244,63,94,0.3)]">
        
        {/* Top Warning Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1.5 bg-rose-500 shadow-[0_0_30px_#f43f5e]" />

        <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500 text-rose-400 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(244,63,94,0.4)]">
          <ShieldAlert className="w-9 h-9 text-rose-400" />
        </div>

        <div className="inline-block px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-mono font-bold tracking-widest uppercase mb-2">
          ACCOUNT ACCESS RESTRICTED
        </div>

        <h2 className="font-brand text-2xl font-black text-white mb-2">
          STOREFRONT ACCESS LOCKED
        </h2>

        <p className="text-xs text-slate-300 max-w-md mx-auto mb-6">
          Your account has been restricted by the store administrator. You cannot place new orders, view payment QR codes, or submit transactions.
        </p>

        {/* Exact Ban Reason Box */}
        <div className="rounded-2xl bg-[#140608] border border-rose-500/30 p-5 text-left mb-6">
          <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 block mb-1 font-bold">
            Official Reason for Restriction:
          </span>
          <p className="text-sm font-semibold text-rose-100 bg-black/40 p-3 rounded-xl border border-rose-500/20">
            "{user.banReason || 'Administrative restriction applied due to policy or verification anomaly.'}"
          </p>
          {user.bannedAt && (
            <span className="text-[10px] font-mono text-slate-400 mt-2 block">
              Applied on: {new Date(user.bannedAt).toLocaleString()}
            </span>
          )}
        </div>

        {/* Action Buttons: Customer Support appeal and Sign Out */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onOpenSupport}
            className="w-full sm:flex-1 py-3 px-4 rounded-full bg-[#16c784] hover:bg-[#1ae095] text-[#03140e] font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(22,199,132,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Headphones className="w-4 h-4" />
            <span>Appeal to Support</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full sm:w-auto py-3 px-5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        <p className="text-[10px] text-slate-400 font-mono mt-4">
          All appeal inquiries are privately handled through our in-app encrypted ticketing channel.
        </p>
      </div>
    </div>
  );
};
