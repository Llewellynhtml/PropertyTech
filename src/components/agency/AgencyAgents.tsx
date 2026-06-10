import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Users, UserPlus, Copy, Check, RefreshCw, Mail, Send,
  Link2, Trash2, Clock, X, Shield, ChevronRight,
  Phone, Briefcase, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface Agent {
  id: string;
  full_name: string;
  email: string;
  cellphone?: string;
  job_title?: string;
  status: string;
  created_at: string;
}

interface PendingInvite {
  id: string;
  invitee_email: string;
  token: string;
  created_at: string;
  expires_at: string;
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = [
    'from-indigo-500 to-purple-600',
    'from-teal-500 to-cyan-600',
    'from-orange-400 to-rose-500',
    'from-green-500 to-emerald-600',
    'from-blue-500 to-indigo-600',
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  const cls = size === 'sm' ? 'w-9 h-9 text-sm' : 'w-11 h-11 text-base';
  return (
    <div className={`${cls} rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-black flex-shrink-0`}>
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active:  { label: 'Active',   cls: 'bg-green-50 text-green-700 border-green-100' },
    pending: { label: 'Pending',  cls: 'bg-amber-50 text-amber-700 border-amber-100' },
    inactive:{ label: 'Inactive', cls: 'bg-gray-100 text-gray-500 border-gray-200'  },
  };
  const { label, cls } = map[status] ?? map['inactive'];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>
      {label}
    </span>
  );
}

// ── Compose URLs for email clients ───────────────────────────────────────────

function buildEmailUrls(to: string, subject: string, body: string) {
  const s = encodeURIComponent(subject);
  const b = encodeURIComponent(body);
  return {
    gmail:   `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${s}&body=${b}`,
    outlook: `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(to)}&subject=${s}&body=${b}`,
    yahoo:   `https://compose.mail.yahoo.com/?to=${encodeURIComponent(to)}&subject=${s}&body=${b}`,
    mailto:  `mailto:${to}?subject=${s}&body=${b}`,
  };
}

// ── Invite modal ──────────────────────────────────────────────────────────────

function InviteModal({
  onClose,
  joinCode,
  agencyId,
  agencyName,
  onCodeRegenerated,
  onInviteSent,
}: {
  onClose: () => void;
  joinCode: string;
  agencyId: string;
  agencyName: string;
  onCodeRegenerated: (code: string) => void;
  onInviteSent: () => void;
}) {
  const [tab, setTab]                 = useState<'code' | 'email'>('email');
  const [copiedCode, setCopiedCode]   = useState(false);
  const [isRegen, setIsRegen]         = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSending, setIsSending]     = useState(false);
  const [copiedLink, setCopiedLink]   = useState(false);

  // After the invite is saved to DB, show the share panel instead of mailto
  const [shareReady, setShareReady] = useState<{
    email: string;
    link: string;
    urls: ReturnType<typeof buildEmailUrls>;
  } | null>(null);

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(joinCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    toast.success('Code copied!');
  };

  const handleRegenCode = async () => {
    setIsRegen(true);
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { error } = await supabase.from('agencies').update({ join_code: newCode }).eq('id', agencyId);
    if (error) { toast.error('Failed to regenerate'); }
    else { onCodeRegenerated(newCode); toast.success('New code generated'); }
    setIsRegen(false);
  };

  const handleGenerateInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Enter a valid email address');
      return;
    }
    setIsSending(true);
    try {
      const token     = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase.from('invites').insert({
        agency_id: agencyId, invitee_email: email, token, expires_at: expiresAt,
      });
      if (error) throw error;

      const link    = `${window.location.origin}/signup?invite=${token}`;
      const subject = `You're invited to join ${agencyName} on PropPost`;
      const body    = `Hi,\n\nYou've been invited to join ${agencyName} on PropPost — South Africa's real estate marketing platform.\n\nClick the link below to create your agent account:\n\n${link}\n\nThis link expires in 7 days.\n\nBest,\n${agencyName}`;

      // Auto-copy the link so the agent can paste it anywhere
      await navigator.clipboard.writeText(link).catch(() => {});

      setShareReady({ email, link, urls: buildEmailUrls(email, subject, body) });
      onInviteSent();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create invite');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareReady) return;
    await navigator.clipboard.writeText(shareReady.link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast.success('Link copied!');
  };

  const handleInviteAnother = () => {
    setShareReady(null);
    setInviteEmail('');
    setCopiedLink(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        exit={{   opacity: 0, y: 24, scale: 0.97 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                {shareReady ? 'Invite ready!' : 'Invite an agent'}
              </h2>
              <p className="text-[11px] text-gray-400">
                {shareReady ? `Send the link to ${shareReady.email}` : "Choose how you'd like to invite them"}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* ── Share panel (shown after invite is created) ── */}
        {shareReady ? (
          <div className="px-6 py-5 space-y-4">

            {/* Success badge */}
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-green-800">Invite link created</p>
                <p className="text-[11px] text-green-600 truncate mt-0.5">{shareReady.email} · expires in 7 days</p>
              </div>
            </div>

            {/* Link preview + copy */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <p className="flex-1 text-[11px] text-gray-500 font-mono truncate">{shareReady.link}</p>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all flex-shrink-0"
              >
                {copiedLink ? <><Check className="w-3.5 h-3.5 text-green-500" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </button>
            </div>

            {/* Email client buttons */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Send via</p>

              {/* Gmail */}
              <a
                href={shareReady.urls.gmail}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                <img
                  src="https://www.google.com/gmail/about/static/images/logo-gmail.png?cache=1adba63"
                  alt="Gmail"
                  className="w-5 h-5 object-contain"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <span className="text-sm font-bold text-gray-800">Open in Gmail</span>
                <span className="ml-auto text-[10px] font-bold text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">Recommended</span>
              </a>

              {/* Outlook */}
              <a
                href={shareReady.urls.outlook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center flex-shrink-0">
                  <Mail className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-bold text-gray-800">Open in Outlook</span>
              </a>

              {/* Yahoo */}
              <a
                href={shareReady.urls.yahoo}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                <div className="w-5 h-5 bg-purple-600 rounded flex items-center justify-center flex-shrink-0">
                  <Mail className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm font-bold text-gray-800">Open in Yahoo Mail</span>
              </a>

              {/* Fallback */}
              <a
                href={shareReady.urls.mailto}
                className="flex items-center gap-3 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                <div className="w-5 h-5 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                  <Mail className="w-3 h-3 text-gray-500" />
                </div>
                <span className="text-sm font-bold text-gray-500">Other mail app</span>
              </a>
            </div>

            <button
              type="button"
              onClick={handleInviteAnother}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all"
            >
              Invite another agent
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex mx-6 mt-4 bg-gray-100 rounded-xl p-1 gap-1">
              {(['email', 'code'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t === 'email' ? 'Email invite' : 'Invite code'}
                </button>
              ))}
            </div>

            <div className="px-6 py-5">
              {/* ── Email tab ── */}
              {tab === 'email' && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Enter the agent's email. We'll generate a unique 7-day sign-up link — then you choose which email app to send it from.
                  </p>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleGenerateInvite()}
                      placeholder="agent@gmail.com"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateInvite}
                    disabled={isSending || !inviteEmail.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {isSending ? 'Generating link…' : 'Generate invite link'}
                  </button>
                </div>
              )}

              {/* ── Code tab ── */}
              {tab === 'code' && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Share this code with any agent. They enter it on the sign-up page under "I have an invite code" to join your agency instantly.
                  </p>

                  <div className="bg-gray-50 border border-gray-200 rounded-2xl py-5 px-6 text-center">
                    <p className="font-mono text-3xl font-black text-gray-900 tracking-[0.3em] select-all">
                      {joinCode || '———'}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      disabled={!joinCode}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all disabled:opacity-40"
                    >
                      {copiedCode ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy code</>}
                    </button>
                    <button
                      type="button"
                      onClick={handleRegenCode}
                      disabled={isRegen}
                      className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all disabled:opacity-40"
                    >
                      <RefreshCw className={`w-4 h-4 ${isRegen ? 'animate-spin' : ''}`} />
                      New
                    </button>
                  </div>

                  <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                    Regenerating immediately invalidates the old code.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AgencyAgents() {
  const { user } = useAuth();
  const agencyId = user?.id;

  const [agents, setAgents]               = useState<Agent[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [joinCode, setJoinCode]           = useState('');
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedToken, setCopiedToken]     = useState<string | null>(null);
  const [revokingId, setRevokingId]       = useState<string | null>(null);

  const loadAgents = useCallback(async () => {
    if (!agencyId) return;
    setLoadingAgents(true);
    const { data } = await supabase
      .from('agents')
      .select('id, full_name, email, cellphone, job_title, status, created_at')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false });
    setAgents(data || []);
    setLoadingAgents(false);
  }, [agencyId]);

  const loadInvites = useCallback(async () => {
    if (!agencyId) return;
    setLoadingInvites(true);
    const { data } = await supabase
      .from('invites')
      .select('id, invitee_email, token, created_at, expires_at')
      .eq('agency_id', agencyId)
      .is('used_at', null)
      .order('created_at', { ascending: false });
    setPendingInvites(data || []);
    setLoadingInvites(false);
  }, [agencyId]);

  const loadJoinCode = useCallback(async () => {
    if (!agencyId) return;
    const { data } = await supabase
      .from('agencies')
      .select('join_code')
      .eq('id', agencyId)
      .maybeSingle();
    if (data?.join_code) setJoinCode(data.join_code);
  }, [agencyId]);

  useEffect(() => {
    loadAgents();
    loadInvites();
    loadJoinCode();
  }, [loadAgents, loadInvites, loadJoinCode]);

  const handleCopyInviteLink = async (token: string) => {
    const link = `${window.location.origin}/signup?invite=${token}`;
    await navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast.success('Invite link copied!');
  };

  const handleRevokeInvite = async (id: string) => {
    setRevokingId(id);
    const { error } = await supabase.from('invites').delete().eq('id', id);
    if (error) { toast.error('Failed to revoke'); }
    else { toast.success('Invite revoked'); setPendingInvites(prev => prev.filter(i => i.id !== id)); }
    setRevokingId(null);
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();
  const formatExpiry = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff < 0) return 'Expired';
    const days = Math.floor(diff / 86_400_000);
    if (days > 0) return `${days}d left`;
    const hrs = Math.floor(diff / 3_600_000);
    return hrs > 0 ? `${hrs}h left` : 'Expires soon';
  };

  const activeAgents  = agents.filter(a => a.status === 'active');
  const pendingAgents = agents.filter(a => a.status === 'pending');

  return (
    <>
      <div className="space-y-6 max-w-4xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900 tracking-tight">Agents</h1>
            <p className="text-sm text-gray-400 mt-1">
              {loadingAgents ? 'Loading…' : `${activeAgents.length} active · ${pendingAgents.length} pending`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            Invite agent
          </button>
        </div>

        {/* ── Invite-code quick glance banner ── */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl p-5 flex items-center gap-5">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-indigo-100 uppercase tracking-widest mb-1">Your invite code</p>
            <p className="font-mono text-2xl font-black text-white tracking-[0.2em]">
              {joinCode || '———'}
            </p>
            <p className="text-xs text-indigo-200 mt-1">Share this with any agent to let them join instantly.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all flex-shrink-0"
          >
            Invite <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Active agents ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-bold text-gray-900">Team members</h2>
            </div>
            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{activeAgents.length}</span>
          </div>

          {loadingAgents ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeAgents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center px-6">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm font-bold text-gray-500">No agents yet</p>
              <p className="text-xs text-gray-400 mt-1">Invite your first agent using the button above.</p>
              <button
                type="button"
                onClick={() => setShowInviteModal(true)}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" /> Invite an agent
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {activeAgents.map(agent => (
                <div key={agent.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors">
                  <Avatar name={agent.full_name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{agent.full_name}</p>
                    <p className="text-xs text-gray-400 truncate">{agent.email}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-xs text-gray-400">
                    {agent.job_title && (
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5" />
                        {agent.job_title}
                      </span>
                    )}
                    {agent.cellphone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        {agent.cellphone}
                      </span>
                    )}
                  </div>
                  <StatusBadge status={agent.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Pending approval ── */}
        {pendingAgents.length > 0 && (
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold text-gray-900">Pending approval</h2>
              </div>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">{pendingAgents.length}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {pendingAgents.map(agent => (
                <div key={agent.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors">
                  <Avatar name={agent.full_name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{agent.full_name}</p>
                    <p className="text-xs text-gray-400 truncate">{agent.email}</p>
                  </div>
                  <StatusBadge status="pending" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Pending email invites ── */}
        {!loadingInvites && pendingInvites.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-bold text-gray-900">Pending invites</h2>
              </div>
              <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{pendingInvites.length}</span>
            </div>
            <div className="divide-y divide-gray-50">
              <AnimatePresence initial={false}>
                {pendingInvites.map(invite => (
                  <motion.div
                    key={invite.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-4 px-6 py-4"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isExpired(invite.expires_at) ? 'bg-red-50' : 'bg-indigo-50'
                    }`}>
                      <Mail className={`w-4 h-4 ${isExpired(invite.expires_at) ? 'text-red-400' : 'text-indigo-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{invite.invitee_email}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className={`w-3 h-3 ${isExpired(invite.expires_at) ? 'text-red-400' : 'text-gray-400'}`} />
                        <p className={`text-[11px] ${isExpired(invite.expires_at) ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                          {formatExpiry(invite.expires_at)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyInviteLink(invite.token)}
                      disabled={isExpired(invite.expires_at)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-40"
                    >
                      {copiedToken === invite.token
                        ? <><Check className="w-3.5 h-3.5" /> Copied</>
                        : <><Link2 className="w-3.5 h-3.5" /> Copy link</>
                      }
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRevokeInvite(invite.id)}
                      disabled={revokingId === invite.id}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      aria-label="Revoke invite"
                    >
                      {revokingId === invite.id
                        ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />
                      }
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* ── Invite modal ── */}
      <AnimatePresence>
        {showInviteModal && (
          <InviteModal
            onClose={() => setShowInviteModal(false)}
            joinCode={joinCode}
            agencyId={agencyId!}
            agencyName={user?.agency_name || user?.name || 'Your agency'}
            onCodeRegenerated={setJoinCode}
            onInviteSent={() => { loadInvites(); setShowInviteModal(false); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
