import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { loginUser, signUpUser } from '../services/storage';
import { User as UserType } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserType) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const res = loginUser(email, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to authenticate.');
          setIsSubmitting(false);
          return;
        }
        if (res.user) {
          onSuccess(res.user);
          onClose();
        }
      } else {
        const res = signUpUser(email, password, name);
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to create account.');
          setIsSubmitting(false);
          return;
        }
        if (res.user) {
          onSuccess(res.user);
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      {/* Card */}
      <div className="relative w-full max-w-md rounded-3xl glass-card border border-[#16c784]/40 p-6 sm:p-8 shadow-[0_0_50px_rgba(22,199,132,0.2)] z-10 overflow-hidden">
        
        {/* Top ambient highlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1.5 bg-[#16c784] shadow-[0_0_20px_#16c784]" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-[#08291e] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#e5c98b] font-mono tracking-widest uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>F1 Store Vault Access</span>
          </div>
          <h2 className="font-brand text-2xl font-black gold-gradient-text tracking-wider">
            {mode === 'login' ? 'VIP MEMBER SIGN IN' : 'CREATE VIP ACCOUNT'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {mode === 'login'
              ? 'Enter your credentials to manage orders & instant QR payments'
              : 'Join the exclusive high-performance editions boutique'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-[#041d14] border border-[#16c784]/20 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-[#16c784] text-[#03140e] shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg('');
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-[#16c784] text-[#03140e] shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="text-[11px] uppercase tracking-wider font-mono text-slate-300 block mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sebastian Vettel"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#041d14] border border-[#16c784]/40 focus:border-[#16c784] text-white text-xs placeholder:text-slate-500 focus:outline-none"
                />
                <User className="w-4 h-4 text-[#16c784] absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] uppercase tracking-wider font-mono text-slate-300 block mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#041d14] border border-[#16c784]/40 focus:border-[#16c784] text-white text-xs placeholder:text-slate-500 focus:outline-none"
              />
              <Mail className="w-4 h-4 text-[#16c784] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider font-mono text-slate-300 block mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#041d14] border border-[#16c784]/40 focus:border-[#16c784] text-white text-xs placeholder:text-slate-500 focus:outline-none"
              />
              <Lock className="w-4 h-4 text-[#16c784] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-6 rounded-full bg-[#16c784] hover:bg-[#1ae095] text-[#03140e] font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(22,199,132,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-[#03140e] border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </span>
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In to F1 Store' : 'Complete VIP Registration'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-[10px] text-center text-slate-400 font-mono mt-4">
          Encrypted authentication with real-time access permission check.
        </p>
      </div>
    </div>
  );
};
