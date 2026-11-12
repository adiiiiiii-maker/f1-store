import React, { useState, useEffect } from 'react';
import { X, Headphones, Send, Clock, CheckCircle2, MessageSquare, Plus, ArrowLeft, Shield } from 'lucide-react';
import { User, SupportTicket } from '../types';
import { getTickets, createTicket, replyToTicket } from '../services/storage';

interface CustomerSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

export const CustomerSupportModal: React.FC<CustomerSupportModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showNewTicketForm, setShowNewTicketForm] = useState<boolean>(false);

  // Form states
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<SupportTicket['category']>(
    currentUser?.isBanned ? 'Ban Appeal' : 'Payment / UTR'
  );
  const [message, setMessage] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [replyText, setReplyText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadTickets = () => {
    const all = getTickets();
    if (currentUser) {
      // Filter for current user's tickets
      const userTickets = all.filter(
        t => t.userId === currentUser.id || t.userEmail.toLowerCase() === currentUser.email.toLowerCase()
      );
      setTickets(userTickets);
    } else if (guestEmail) {
      const guestTickets = all.filter(t => t.userEmail.toLowerCase() === guestEmail.toLowerCase());
      setTickets(guestTickets);
    } else {
      setTickets([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTickets();
      if (currentUser?.isBanned) {
        setCategory('Ban Appeal');
      }
    }
  }, [isOpen, currentUser, guestEmail]);

  useEffect(() => {
    const handler = () => loadTickets();
    window.addEventListener('f1_tickets_updated', handler);
    return () => window.removeEventListener('f1_tickets_updated', handler);
  }, [currentUser, guestEmail]);

  if (!isOpen) return null;

  const activeTicket = tickets.find(t => t.id === selectedTicketId);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveEmail = currentUser ? currentUser.email : guestEmail.trim();
    const effectiveId = currentUser ? currentUser.id : 'guest_' + Date.now();

    if (!effectiveEmail) {
      setErrorMsg('Please specify an email address for your ticket.');
      return;
    }

    if (!subject.trim() || !message.trim()) {
      setErrorMsg('Please fill in both a subject and message.');
      return;
    }

    const newTicket = createTicket({
      userId: effectiveId,
      userEmail: effectiveEmail,
      subject: subject.trim(),
      category: category,
      message: message.trim()
    });

    setSubject('');
    setMessage('');
    setShowNewTicketForm(false);
    setSelectedTicketId(newTicket.id);
    loadTickets();
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !replyText.trim()) return;

    replyToTicket(selectedTicketId, replyText.trim(), 'user');
    setReplyText('');
    loadTickets();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl h-[620px] max-h-[90vh] rounded-3xl glass-card border border-[#16c784]/40 p-6 flex flex-col justify-between shadow-[0_0_60px_rgba(22,199,132,0.25)] z-10 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#16c784]/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#041d14] border border-[#16c784]/30 text-[#16c784]">
              <Headphones className="w-5 h-5 text-[#16c784]" />
            </div>
            <div>
              <h3 className="font-brand text-lg sm:text-xl font-bold text-slate-100 gold-gradient-text">
                VIP CONCIERGE & SUPPORT
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Direct in-app private communication desk
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-[#08291e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto py-4">
          {selectedTicketId && activeTicket ? (
            /* CONVERSATION THREAD VIEW */
            <div className="flex flex-col h-full justify-between">
              <div>
                {/* Back button & ticket header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#16c784]/15 mb-4">
                  <button
                    onClick={() => setSelectedTicketId(null)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#16c784] hover:text-[#e5c98b] font-medium"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Tickets</span>
                  </button>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    activeTicket.status === 'REPLIED'
                      ? 'bg-emerald-500/20 text-[#16c784] border border-[#16c784]/40'
                      : activeTicket.status === 'RESOLVED'
                      ? 'bg-slate-700/40 text-slate-300'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {activeTicket.status}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#e5c98b]">
                    {activeTicket.category} · {activeTicket.id}
                  </div>
                  <h4 className="text-base font-bold text-slate-100 mt-0.5">
                    {activeTicket.subject}
                  </h4>
                </div>

                {/* Messages stream */}
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {activeTicket.messages.map((msg) => {
                    const isAdminMsg = msg.sender === 'admin';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAdminMsg ? 'items-start' : 'items-end'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          {isAdminMsg && <Shield className="w-3 h-3 text-[#e5c98b]" />}
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                            {isAdminMsg ? 'Store Administrator Desk' : 'You'}
                          </span>
                          <span className="text-[10px] text-slate-600 font-mono">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[85%] ${
                            isAdminMsg
                              ? 'bg-[#05261b] text-slate-100 border border-[#16c784]/40 rounded-tl-none shadow-md'
                              : 'bg-[#0f382a] text-emerald-100 border border-[#16c784]/30 rounded-tr-none'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reply Input Form */}
              <form onSubmit={handleSendReply} className="pt-3 border-t border-[#16c784]/20 flex gap-2">
                <input
                  type="text"
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your message to Concierge Support..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#041d14] border border-[#16c784]/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#16c784]"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#16c784] hover:bg-[#1ae095] text-[#03140e] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          ) : showNewTicketForm ? (
            /* NEW TICKET FORM */
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#16c784]/15">
                <button
                  type="button"
                  onClick={() => setShowNewTicketForm(false)}
                  className="inline-flex items-center gap-1.5 text-xs text-[#16c784] hover:text-[#e5c98b]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
                <span className="text-xs font-mono text-slate-400">Open Priority Ticket</span>
              </div>

              {!currentUser && (
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300 block mb-1">
                    Your Contact Email
                  </label>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#041d14] border border-[#16c784]/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#16c784]"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300 block mb-1">
                    Inquiry Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#041d14] border border-[#16c784]/30 text-white text-xs focus:outline-none focus:border-[#16c784]"
                  >
                    <option value="Payment / UTR">Payment / UTR Verification</option>
                    <option value="Ban Appeal">Account Ban Appeal</option>
                    <option value="Account Issue">Account Security / Access</option>
                    <option value="General Query">General Boutique Inquiries</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300 block mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. UTR status check for F1-ORD-89421"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#041d14] border border-[#16c784]/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#16c784]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-slate-300 block mb-1">
                  Message Details
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Provide any relevant transaction UTR, appeal explanation, or order inquiries..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#041d14] border border-[#16c784]/30 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#16c784]"
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-400 font-mono">{errorMsg}</p>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-[#16c784] hover:bg-[#1ae095] text-[#03140e] font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(22,199,132,0.4)] transition-all cursor-pointer"
              >
                Submit In-App Ticket
              </button>
            </form>
          ) : (
            /* TICKETS LIST VIEW */
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                  Your Support Tickets ({tickets.length})
                </span>
                <button
                  onClick={() => setShowNewTicketForm(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#16c784] text-[#03140e] text-xs font-bold shadow-md hover:bg-[#1ae095] transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>New Inquiry</span>
                </button>
              </div>

              {tickets.length === 0 ? (
                <div className="text-center py-12 rounded-2xl bg-[#041a12] border border-[#16c784]/20 p-6">
                  <MessageSquare className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-200">No Open Tickets</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 mb-5">
                    Have questions about your 12-digit UTR payment or need account assistance?
                  </p>
                  <button
                    onClick={() => setShowNewTicketForm(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#08291e] border border-[#16c784]/40 text-[#16c784] text-xs font-bold hover:bg-[#0b3829] transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Your First Ticket</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {tickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className="p-4 rounded-xl bg-[#041a12] border border-[#16c784]/25 hover:border-[#16c784] transition-all cursor-pointer flex items-center justify-between gap-4 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono text-[#e5c98b] font-bold">
                            {t.category}
                          </span>
                          <span className="text-slate-600">·</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {t.id}
                          </span>
                        </div>
                        <h5 className="text-sm font-bold text-slate-100 group-hover:text-[#16c784] transition-colors truncate">
                          {t.subject}
                        </h5>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {t.messages[t.messages.length - 1]?.text}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                          t.status === 'REPLIED'
                            ? 'bg-emerald-500/20 text-[#16c784] border border-[#16c784]/40'
                            : t.status === 'RESOLVED'
                            ? 'bg-slate-700/40 text-slate-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {t.status}
                        </span>
                        <span className="block text-[10px] text-slate-500 font-mono mt-1">
                          {new Date(t.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Confidentiality Footer */}
        <div className="pt-3 border-t border-[#16c784]/15 text-center">
          <p className="text-[10px] text-slate-400 font-mono">
            ✦ All communications are end-to-end private within the F1 Store platform.
          </p>
        </div>
      </div>
    </div>
  );
};
