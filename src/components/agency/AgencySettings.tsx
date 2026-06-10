import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Copy, Check, RefreshCw, Mail, Send, Trash2, Clock,
  Link2, Users, Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface PendingInvite {
  id: string;
  invitee_email: string;
  token: string;
  created_at: string;
  expires_at: string;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-indigo-600" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

export default function AgencySettings() {
  const { user } = useAuth();
  const agencyId = user?.id;

  const [joinCode, setJoinCode] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadJoinCode = useCallback(async () => {
    if (!agencyId) return;
    const { data } = await supabase
      .from('agencies')
      .select('join_code')
      .eq('id', agencyId)
      .maybeSingle();
    if (data?.join_code) setJoinCode(data.join_code);
  }, [agencyId]);

  const loadPendingInvites = useCallback(async () => {
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

  useEffect(() => {
    loadJoinCode();
    loadPendingInvites();
  }, [loadJoinCode, loadPendingInvites]);

  const handleCopyCode = async () => {
    if (!joinCode) return;
    await navigator.clipboard.writeText(joinCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    toast.success('Invite code copied!');
  };

  const handleRegenerateCode = async () => {
    if (!agencyId) return;
    setIsRegenerating(true);
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { error } = await supabase
      .from('agencies')
      .update({ join_code: newCode })
      .eq('id', agencyId);
    if (error) {
      toast.error('Failed to regenerate code');
    } else {
      setJoinCode(newCode);
      toast.success('New invite code generated');
    }
    setIsRegenerating(false);
  };

  const handleSendInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!agencyId) return;
    setIsInviting(true);
    try {
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase.from('invites').insert({
        agency_id: agencyId,
        invitee_email: email,
        token,
        expires_at: expiresAt,
      });
      if (error) throw error;

      const inviteLink = `${window.location.origin}/signup?invite=${token}`;
      const agencyName = user?.agency_name || user?.name || 'our agency';
      const subject = encodeURIComponent(`You're invited to join ${agencyName} on PropPost`);
      const body = encodeURIComponent(
        `Hi,\n\nYou have been invited to join ${agencyName} on PropPost — South Africa's real estate marketing platform.\n\nClick the link below to create your agent account:\n\n${inviteLink}\n\nThis invite expires in 7 days.\n\nBest regards,\n${agencyName}`
      );
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;

      setInviteEmail('');
      toast.success(`Invite created for ${email}`);
      loadPendingInvites();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create invite');
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopyLink = async (token: string) => {
    const link = `${window.location.origin}/signup?invite=${token}`;
    await navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast.success('Invite link copied!');
  };

  const handleRevokeInvite = async (id: string) => {
    setRevokingId(id);
    const { error } = await supabase.from('invites').delete().eq('id', id);
    if (error) {
      toast.error('Failed to revoke invite');
    } else {
      toast.success('Invite revoked');
      setPendingInvites(prev => prev.filter(i => i.id !== id));
    }
    setRevokingId(null);
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  const formatExpiry = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff < 0) return 'Expired';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `Expires in ${days}d`;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return hours > 0 ? `Expires in ${hours}h` : 'Expires soon';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-2">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900 tracking-tight">Agent Invites</h1>
        <p className="text-sm text-gray-400 mt-1">Invite agents to join your agency on PropPost.</p>
      </div>

      {/* ── Invite code ── */}
      <Card>
        <SectionHeader
          icon={Shield}
          title="Invite Code"
          subtitle="Share this code with agents — they enter it during sign-up to join your agency instantly."
        />

        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 font-mono text-2xl font-black text-gray-900 tracking-[0.25em] text-center select-all">
            {joinCode || '——————'}
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleCopyCode}
              disabled={!joinCode}
              className="flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all disabled:opacity-40"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedCode ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={handleRegenerateCode}
              disabled={isRegenerating}
              className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all disabled:opacity-40"
            >
              <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              New code
            </button>
          </div>
        </div>

        <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
          Regenerating the code immediately invalidates the old one. Agents who haven't finished signing up will need the new code.
        </p>
      </Card>

      {/* ── Invite by email ── */}
      <Card>
        <SectionHeader
          icon={Mail}
          title="Invite by Email"
          subtitle="Generate a unique sign-up link for a specific agent. The link pre-fills your agency on their registration form."
        />

        <div className="flex gap-2">
          <div className="relative flex-1 group">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendInvite()}
              placeholder="agent@example.com"
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <button
            type="button"
            onClick={handleSendInvite}
            disabled={isInviting || !inviteEmail.trim()}
            className="flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all disabled:opacity-50 flex-shrink-0"
          >
            {isInviting
              ? <RefreshCw className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
            Send invite
          </button>
        </div>

        <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
          Opens your email client with a pre-written invite. The link is unique to this address and expires in 7 days.
        </p>
      </Card>

      {/* ── Pending invites ── */}
      <Card>
        <SectionHeader
          icon={Users}
          title="Pending Invites"
          subtitle="Email invites that haven't been accepted yet."
        />

        {loadingInvites ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pendingInvites.length === 0 ? (
          <p className="text-center py-8 text-sm text-gray-400">
            No pending invites. Send one above.
          </p>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {pendingInvites.map(invite => (
                <motion.div
                  key={invite.id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    isExpired(invite.expires_at)
                      ? 'bg-red-50 border-red-100'
                      : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{invite.invitee_email}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className={`w-3 h-3 ${isExpired(invite.expires_at) ? 'text-red-400' : 'text-gray-400'}`} />
                      <p className={`text-[11px] font-medium ${isExpired(invite.expires_at) ? 'text-red-500' : 'text-gray-400'}`}>
                        {formatExpiry(invite.expires_at)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyLink(invite.token)}
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
        )}
      </Card>
    </div>
  );
}
