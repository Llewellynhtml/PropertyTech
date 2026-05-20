import React, { useState, useEffect, useRef } from 'react';
import {
  Mail, Lock, User, Phone, Briefcase, Loader2, ArrowRight, ArrowLeft,
  CheckCircle2, Eye, EyeOff, Search, MapPin, Instagram, X, AlertCircle, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

interface AgentSignUpProps {
  onToggle: () => void;
}

// ─── An agent MUST be connected to an agency to sign up. ───────────────────────
// Three paths — all require the agency to be confirmed BEFORE the form proceeds:
//   1. invite_code  → validated live; only "valid" passes
//   2. email_invite → token in URL pre-resolves the agency; no token = blocked
//   3. request      → agent picks an agency and submits; account created as "pending"
//                      but agency_id is always set (not null)
// ──────────────────────────────────────────────────────────────────────────────

type JoinMethod = 'code' | 'email_invite' | 'request' | 'independent';

const SPECIALISATIONS = [
  'Residential Sales', 'Rentals', 'Commercial',
  'Industrial', 'Agricultural', 'New Developments',
];

const SA_AREAS = [
  'Sandton', 'Rosebank', 'Midrand', 'Fourways', 'Bryanston', 'Randburg',
  'Cape Town CBD', 'Atlantic Seaboard', 'Southern Suburbs', 'Durban North',
  'Umhlanga', 'Pretoria East', 'Centurion', 'Soweto', 'East Rand',
];

// ─── Shared sub-components ───────────────────────────────────────────────────

function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <React.Fragment key={i}>
          <div className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all',
            i + 1 < step   && 'bg-brand-teal text-white',
            i + 1 === step && 'bg-brand-teal text-white ring-4 ring-brand-teal/20',
            i + 1 > step   && 'bg-brand-border text-brand-muted',
          )}>{i + 1}</div>
          {i < total - 1 && (
            <div className={cn('flex-1 h-px', i + 1 < step ? 'bg-brand-teal' : 'bg-brand-border')} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function Field({
  label, required, optional, hint, children,
}: {
  label: string; required?: boolean; optional?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-bold text-brand-muted uppercase tracking-[0.15em]">
        {label}
        {required && <span className="text-red-400 normal-case tracking-normal font-medium">*</span>}
        {optional && <span className="normal-case tracking-normal font-normal text-brand-muted/60">(optional)</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-brand-muted leading-relaxed">{hint}</p>}
    </div>
  );
}

function TextInput({
  type = 'text', value, onChange, placeholder, icon: Icon, required, autoFocus,
}: {
  type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; icon?: React.ElementType; required?: boolean; autoFocus?: boolean;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="relative group">
      {Icon && (
        <Icon size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted group-focus-within:text-brand-teal transition-colors" />
      )}
      <input
        type={isPassword ? (show ? 'text' : 'password') : type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        className={cn(
          'w-full py-3 pr-4 bg-brand-surface border border-brand-border rounded-xl text-brand-charcoal text-sm',
          'focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none transition-all',
          Icon ? 'pl-10' : 'pl-4',
          isPassword && 'pr-10',
        )}
      />
      {isPassword && (
        <button type="button" onClick={() => setShow(s => !s)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-teal transition-colors">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const bar  = ['bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-brand-green'];
  const lbl  = ['Too short', 'Weak', 'Fair', 'Strong'];
  if (!password) return null;
  return (
    <div className="space-y-1.5 mt-1">
      <div className="flex gap-1">
        {[0,1,2,3].map(i => (
          <div key={i} className={cn('flex-1 h-1 rounded-full transition-all', i < score ? bar[score-1] : 'bg-brand-border')} />
        ))}
      </div>
      <p className={cn('text-[11px]', score < 3 ? 'text-orange-500' : 'text-brand-green')}>{lbl[score-1] || ''}</p>
    </div>
  );
}

// ─── Agency confirmation badge (reused across join paths) ────────────────────
function AgencyBadge({ name, city, method }: { name: string; city?: string; method: JoinMethod }) {
  const methodLabel = method === 'code' ? 'Joining via invite code'
    : method === 'email_invite' ? 'Joining via email invite'
    : 'Request pending approval';
  return (
    <div className="flex items-center gap-3 p-3 bg-brand-teal-light border border-brand-teal/30 rounded-xl">
      <div className="w-8 h-8 rounded-lg bg-brand-teal flex items-center justify-center flex-shrink-0">
        <CheckCircle2 size={16} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-brand-charcoal truncate">{name}</p>
        <p className="text-[11px] text-brand-teal-dark">
          {city && `${city} · `}{methodLabel}
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AgentSignUp({ onToggle }: AgentSignUpProps) {
  const [step, setStep]               = useState(0);
  const [joinMethod, setJoinMethod]   = useState<JoinMethod>('code');
  const [isLoading, setIsLoading]     = useState(false);
  const [isSuccess, setIsSuccess]     = useState(false);

  // Agency state — ALL paths must resolve to a confirmed agency before step 1
  const [codeStatus, setCodeStatus]   = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [confirmedAgency, setConfirmedAgency] = useState<{
    id: string; name: string; city?: string;
  } | null>(null);
  const [agencySearch, setAgencySearch]   = useState('');
  const [agencyResults, setAgencyResults] = useState<any[]>([]);
  const codeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const { signUp } = useAuth();

  const [form, setForm] = useState({
    inviteCode: '',
    firstName: '', lastName: '',
    email: '', cellphone: '',
    jobTitle: '', ppraNumber: '', bio: '',
    specialisation: '', whatsappNumber: '',
    instagramUrl: '',
    password: '', confirmPassword: '',
    termsAccepted: false, confirmsAgent: false,
  });

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }));

  // ── Live invite code check ──────────────────────────────────────────────────
  useEffect(() => {
    if (joinMethod !== 'code') return;
    const raw = form.inviteCode.trim().toUpperCase();
    if (!raw) { setCodeStatus('idle'); setConfirmedAgency(null); return; }
    if (codeTimer.current) clearTimeout(codeTimer.current);
    setCodeStatus('checking');
    codeTimer.current = setTimeout(async () => {
      const { data } = await supabase
        .from('agencies')
        .select('id, agency_name, city')
        .eq('join_code', raw)
        .maybeSingle();
      if (data) {
        setCodeStatus('valid');
        setConfirmedAgency({ id: data.id, name: data.agency_name, city: data.city });
      } else {
        setCodeStatus('invalid');
        setConfirmedAgency(null);
      }
    }, 600);
    return () => { if (codeTimer.current) clearTimeout(codeTimer.current); };
  }, [form.inviteCode, joinMethod]);

  // ── Agency search (for request path) ───────────────────────────────────────
  useEffect(() => {
    if (joinMethod !== 'request' || agencySearch.length < 2 || confirmedAgency) {
      setAgencyResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('agencies')
        .select('id, agency_name, city, province')
        .ilike('agency_name', `%${agencySearch}%`)
        .limit(6);
      setAgencyResults(data || []);
    }, 400);
    return () => clearTimeout(t);
  }, [agencySearch, joinMethod, confirmedAgency]);

  const toggleArea = (area: string) =>
    setSelectedAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );

  // ── Agency is optional — validate only when a path requires it ──────────────
  const canLeaveStep0 = (): boolean => {
    if (joinMethod === 'independent')  return true;
    if (joinMethod === 'email_invite') return false; // must use email link
    if (joinMethod === 'code')         return codeStatus === 'valid' && !!confirmedAgency;
    if (joinMethod === 'request')      return !!confirmedAgency;
    return false;
  };

  const validateStep = (): boolean => {
    if (step === 0) {
      if (joinMethod === 'email_invite') {
        toast.error('Please use the link in your invitation email to sign up.');
        return false;
      }
      if (!canLeaveStep0()) {
        if (joinMethod === 'code')    toast.error('Enter a valid invite code before continuing.');
        if (joinMethod === 'request') toast.error('Select an agency to join before continuing.');
        return false;
      }
    }
    if (step === 1) {
      if (!form.firstName.trim()) { toast.error('First name is required'); return false; }
      if (!form.lastName.trim())  { toast.error('Last name is required');  return false; }
      if (!form.email.trim())     { toast.error('Email is required');      return false; }
      if (!form.cellphone.trim()) { toast.error('Mobile number is required'); return false; }
    }
    if (step === 3) {
      if (form.password.length < 8)               { toast.error('Password must be at least 8 characters'); return false; }
      if (form.password !== form.confirmPassword)  { toast.error('Passwords do not match');                 return false; }
      if (!form.termsAccepted)                     { toast.error('Please accept the Terms of Service');     return false; }
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep(s => s + 1); };
  const back = () => setStep(s => Math.max(0, s - 1));

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsLoading(true);
    try {
      await signUp(form.email, 'agent', {
        password: form.password,
        name: `${form.firstName} ${form.lastName}`,
        cellphone: form.cellphone,
        whatsapp_number: form.whatsappNumber || form.cellphone,
        agency_id: confirmedAgency?.id ?? null,
        agency_code: form.inviteCode || undefined,
        join_method: joinMethod,
        job_title: form.jobTitle,
        ppra_number: form.ppraNumber,
        bio: form.bio,
        specialisation: form.specialisation,
        areas: selectedAreas,
        instagram_url: form.instagramUrl,
        status: joinMethod === 'request' ? 'pending' : 'active',
      });
      setIsSuccess(true);
      toast.success(
        joinMethod === 'request'
          ? 'Request sent! Your agency admin will review and approve you.'
          : 'Account created! Check your email to verify.'
      );
    } catch (err: any) {
      console.error('Agent signup error:', err);
      const msg = err?.message || err?.error_description || err?.error || JSON.stringify(err);
      toast.error('Signup failed: ' + (msg || 'Unknown error'), { duration: 10000 });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8 space-y-5">
        <div className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center mx-auto',
          joinMethod === 'request' ? 'bg-amber-50' : 'bg-brand-green-light',
        )}>
          {joinMethod === 'request'
            ? <Clock className="w-8 h-8 text-amber-500" />
            : <CheckCircle2 className="w-8 h-8 text-brand-green" />
          }
        </div>
        <div>
          <h3 className="text-xl font-display font-bold text-brand-charcoal">
            {joinMethod === 'request' ? 'Request sent!' : `Welcome, ${form.firstName}!`}
          </h3>
          <p className="text-brand-slate text-sm mt-2 leading-relaxed">
            {joinMethod === 'request'
              ? `Your request to join ${confirmedAgency?.name} is pending approval. You'll receive an email at ${form.email} once your admin approves you.`
              : joinMethod === 'independent'
              ? `Check ${form.email} to verify your account. You can connect to an agency anytime from your dashboard.`
              : `Check ${form.email} to verify your account. Once confirmed, you can start publishing under ${confirmedAgency?.name}.`
            }
          </p>
        </div>
        {joinMethod === 'request' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-700 leading-relaxed text-left">
            <strong>What happens next:</strong> Your agency admin will receive a notification and can approve or reject your request from their dashboard. You can sign in once approved.
          </div>
        )}
        <button onClick={onToggle}
          className="w-full py-3 bg-brand-charcoal text-white rounded-xl font-bold text-sm hover:bg-black transition-all">
          Back to Sign In
        </button>
      </motion.div>
    );
  }

  // ── Step indicator (shown from step 1 onward) ───────────────────────────────
  const STEPS = 3;

  return (
    <div>
      {step > 0 && <StepDots step={step} total={STEPS} />}

      <AnimatePresence mode="wait">

        {/* ── STEP 0: Choose join method + confirm agency ── */}
        {step === 0 && (
          <motion.div key="step0"
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
            className="space-y-4">

            <div>
              <h3 className="text-base font-display font-bold text-brand-charcoal">Join as an agent</h3>
              <p className="text-xs text-brand-muted mt-0.5">
                How would you like to get started? You can connect to an agency now or later.
              </p>
            </div>

            {/* Join method options */}
            {([
              {
                id: 'code' as JoinMethod,
                title: 'I have an invite code',
                desc: 'Your agency admin shared a code with you.',
              },
              {
                id: 'email_invite' as JoinMethod,
                title: 'I was invited by email',
                desc: 'Use the link in your invitation email — it pre-fills everything.',
              },
              {
                id: 'request' as JoinMethod,
                title: 'Search for my agency',
                desc: 'Find your agency and send a join request for admin approval.',
              },
              {
                id: 'independent' as JoinMethod,
                title: "I don't have an agency yet",
                desc: 'Sign up independently and connect to an agency from your dashboard later.',
              },
            ] as const).map(opt => (
              <button key={opt.id} type="button"
                onClick={() => { setJoinMethod(opt.id); setConfirmedAgency(null); setCodeStatus('idle'); setForm(p => ({ ...p, inviteCode: '' })); setAgencySearch(''); }}
                className={cn(
                  'w-full text-left p-4 rounded-xl border flex gap-3 items-start transition-all',
                  joinMethod === opt.id
                    ? 'border-brand-teal bg-brand-teal-light'
                    : 'border-brand-border bg-white hover:border-brand-teal/40',
                )}>
                <div className={cn(
                  'w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 flex items-center justify-center transition-all',
                  joinMethod === opt.id ? 'border-brand-teal bg-brand-teal' : 'border-brand-border',
                )}>
                  {joinMethod === opt.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-charcoal">{opt.title}</p>
                  <p className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">{opt.desc}</p>
                </div>
              </button>
            ))}

            {/* ── Code entry ── */}
            {joinMethod === 'code' && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-brand-muted uppercase tracking-[0.15em]">
                  Invite code <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    value={form.inviteCode}
                    onChange={e => set('inviteCode', e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                    placeholder="ACME-X7F2"
                    maxLength={12}
                    className={cn(
                      'w-full py-3.5 px-4 rounded-xl border font-mono text-lg font-bold tracking-widest text-center outline-none transition-all',
                      codeStatus === 'valid'   && 'border-brand-green bg-green-50 text-brand-green',
                      codeStatus === 'invalid' && 'border-red-400 bg-red-50 text-red-600',
                      (codeStatus === 'idle' || codeStatus === 'checking') && 'border-brand-border bg-brand-surface text-brand-charcoal focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal',
                    )}
                  />
                  {codeStatus === 'checking' && (
                    <Loader2 size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-brand-muted" />
                  )}
                </div>
                {codeStatus === 'valid' && confirmedAgency && (
                  <AgencyBadge name={confirmedAgency.name} city={confirmedAgency.city} method="code" />
                )}
                {codeStatus === 'invalid' && (
                  <div className="flex gap-2 items-center text-[11px] text-red-500">
                    <AlertCircle size={12} />
                    Code not found. Double-check with your agency admin.
                  </div>
                )}
                {codeStatus === 'idle' && (
                  <p className="text-[11px] text-brand-muted">
                    Ask your agency admin for the code — they can find it in their dashboard under Settings.
                  </p>
                )}
              </div>
            )}

            {/* ── Email invite notice (blocked) ── */}
            {joinMethod === 'email_invite' && (
              <div className="space-y-3">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-[11px] text-amber-700 leading-relaxed font-medium mb-1">
                    Open your invitation email
                  </p>
                  <p className="text-[11px] text-amber-600 leading-relaxed">
                    Find the email from your agency admin and click the <strong>"Accept invitation"</strong> link.
                    It will bring you back here with your agency already linked — you won't need to fill in a code.
                  </p>
                </div>
                <p className="text-[11px] text-brand-muted text-center">
                  Can't find the email?{' '}
                  <button className="text-brand-teal hover:underline" onClick={() => setJoinMethod('code')}>
                    Use an invite code instead
                  </button>
                </p>
              </div>
            )}

            {/* ── Agency search (request path) ── */}
            {joinMethod === 'request' && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-brand-muted uppercase tracking-[0.15em]">
                  Find your agency <span className="text-red-400">*</span>
                </label>
                {!confirmedAgency ? (
                  <>
                    <div className="relative">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
                      <input
                        value={agencySearch}
                        onChange={e => setAgencySearch(e.target.value)}
                        placeholder="Search by agency name…"
                        className="w-full py-3 pl-10 pr-4 bg-brand-surface border border-brand-border rounded-xl text-sm text-brand-charcoal focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none"
                      />
                    </div>
                    {agencyResults.length > 0 && (
                      <div className="border border-brand-border rounded-xl overflow-hidden divide-y divide-brand-border">
                        {agencyResults.map(a => (
                          <button key={a.id} type="button"
                            onClick={() => { setConfirmedAgency({ id: a.id, name: a.agency_name, city: a.city }); setAgencyResults([]); }}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-brand-surface transition-colors flex items-center justify-between">
                            <span className="font-medium text-brand-charcoal">{a.agency_name}</span>
                            {a.city && (
                              <span className="text-[11px] text-brand-muted flex items-center gap-1">
                                <MapPin size={10} />{a.city}{a.province ? `, ${a.province}` : ''}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    {agencySearch.length >= 2 && agencyResults.length === 0 && (
                      <p className="text-[11px] text-brand-muted text-center py-1">
                        No agencies found for "{agencySearch}" — try a shorter name.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="space-y-2">
                    <AgencyBadge name={confirmedAgency.name} city={confirmedAgency.city} method="request" />
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-700 leading-relaxed">
                      Your account will be created as <strong>pending</strong>. You can only log in once your agency admin approves your request.
                    </div>
                    <button type="button"
                      onClick={() => { setConfirmedAgency(null); setAgencySearch(''); }}
                      className="text-[11px] text-brand-muted hover:text-red-500 transition-colors flex items-center gap-1">
                      <X size={11} /> Choose a different agency
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Independent path info */}
            {joinMethod === 'independent' && (
              <div className="flex gap-2.5 items-start p-3 bg-brand-teal-light border border-brand-teal/20 rounded-xl">
                <AlertCircle size={14} className="text-brand-teal mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-brand-teal-dark leading-relaxed">
                  You'll have limited features until you join an agency. You can connect anytime from Settings in your dashboard.
                </p>
              </div>
            )}

            {/* Continue button */}
            <button
              onClick={next}
              disabled={joinMethod === 'email_invite' || (joinMethod !== 'independent' && !canLeaveStep0())}
              className={cn(
                'w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 group',
                (joinMethod === 'independent' || canLeaveStep0()) && joinMethod !== 'email_invite'
                  ? 'bg-brand-charcoal text-white hover:bg-black'
                  : 'bg-brand-border text-brand-muted cursor-not-allowed',
              )}>
              {joinMethod === 'email_invite'
                ? 'Use the link in your email'
                : joinMethod === 'code' && codeStatus !== 'valid'
                  ? 'Enter a valid code to continue'
                : joinMethod === 'request' && !confirmedAgency
                  ? 'Select an agency to continue'
                  : <><span>Continue</span><ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" /></>
              }
            </button>

            <div className="text-center">
              <button onClick={onToggle}
                className="text-xs text-brand-muted hover:text-brand-teal transition-colors">
                Already have an account? Sign in
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 1: Contact details ── */}
        {step === 1 && (
          <motion.div key="step1"
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
            className="space-y-4">

            <div>
              <h3 className="text-base font-display font-bold text-brand-charcoal">Your details</h3>
              <p className="text-xs text-brand-muted mt-0.5">Contact info shown on your listings and posts.</p>
            </div>

            {/* Persistent agency badge */}
            {confirmedAgency && joinMethod !== 'independent' && (
              <AgencyBadge name={confirmedAgency.name} city={confirmedAgency.city} method={joinMethod} />
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="First name" required>
                <TextInput value={form.firstName} onChange={v => set('firstName', v)} placeholder="Sarah" icon={User} required />
              </Field>
              <Field label="Last name" required>
                <TextInput value={form.lastName} onChange={v => set('lastName', v)} placeholder="Jenkins" icon={User} required />
              </Field>
            </div>

            <Field label="Email address" required>
              <TextInput type="email" value={form.email} onChange={v => set('email', v)}
                placeholder="sarah@acmerealty.co.za" icon={Mail} required />
            </Field>

            <Field label="Mobile number" required hint="Displayed on your listings. Clients will contact you on this number.">
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-3 py-3 bg-brand-surface border border-brand-border rounded-xl text-sm text-brand-muted flex-shrink-0">
                  <span className="text-xs">🇿🇦</span><span>+27</span>
                </div>
                <input value={form.cellphone} onChange={e => set('cellphone', e.target.value)}
                  placeholder="82 123 4567" type="tel"
                  className="flex-1 py-3 px-4 bg-brand-surface border border-brand-border rounded-xl text-brand-charcoal text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none" />
              </div>
            </Field>

            <div className="flex gap-3">
              <button onClick={back}
                className="flex-shrink-0 px-4 py-3 border border-brand-border bg-white text-brand-slate rounded-xl text-sm font-medium hover:bg-brand-surface transition-all flex items-center gap-1.5">
                <ArrowLeft size={14} /> Back
              </button>
              <button onClick={next}
                className="flex-1 py-3 bg-brand-charcoal text-white rounded-xl font-bold text-sm hover:bg-black transition-all flex items-center justify-center gap-2 group">
                Continue <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: Agent profile ── */}
        {step === 2 && (
          <motion.div key="step2"
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
            className="space-y-4">

            <div>
              <h3 className="text-base font-display font-bold text-brand-charcoal">Your agent profile</h3>
              <p className="text-xs text-brand-muted mt-0.5">Appears on every post and listing you create.</p>
            </div>

            <Field label="Job title / role" required>
              <TextInput value={form.jobTitle} onChange={v => set('jobTitle', v)}
                placeholder="Senior Property Consultant" icon={Briefcase} />
            </Field>

            <Field label="Specialisation" optional>
              <div className="flex gap-2 flex-wrap mt-0.5">
                {SPECIALISATIONS.map(s => (
                  <button key={s} type="button" onClick={() => set('specialisation', form.specialisation === s ? '' : s)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                      form.specialisation === s
                        ? 'bg-brand-teal text-white border-brand-teal'
                        : 'bg-brand-surface border-brand-border text-brand-slate hover:border-brand-teal',
                    )}>
                    {s}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="PPRA licence number" optional
              hint="Property Practitioners Regulatory Authority. Displayed on your profile for compliance.">
              <TextInput value={form.ppraNumber} onChange={v => set('ppraNumber', v)} placeholder="e.g. 1234567" />
            </Field>

            <Field label="Bio" optional hint="Max 160 characters · shown on your public agent profile">
              <textarea value={form.bio} onChange={e => set('bio', e.target.value.slice(0, 160))}
                placeholder="Specialising in residential sales across Sandton and Rosebank for over 8 years…"
                rows={3}
                className="w-full py-2.5 px-4 bg-brand-surface border border-brand-border rounded-xl text-brand-charcoal text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none resize-none" />
              <p className="text-[10px] text-right text-brand-muted">{form.bio.length} / 160</p>
            </Field>

            <Field label="Areas you work in" optional hint="Helps match you with buyers and tenants in your area">
              <div className="flex gap-2 flex-wrap mt-0.5">
                {SA_AREAS.map(area => (
                  <button key={area} type="button" onClick={() => toggleArea(area)}
                    className={cn(
                      'px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
                      selectedAreas.includes(area)
                        ? 'bg-brand-teal text-white border-brand-teal'
                        : 'bg-brand-surface border-brand-border text-brand-slate hover:border-brand-teal',
                    )}>
                    {area}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="WhatsApp" optional>
                <div className="flex gap-1">
                  <div className="flex items-center px-2 py-3 bg-brand-surface border border-brand-border rounded-xl text-xs text-brand-muted flex-shrink-0">🇿🇦</div>
                  <input value={form.whatsappNumber} onChange={e => set('whatsappNumber', e.target.value)}
                    placeholder="82 123 4567" type="tel"
                    className="flex-1 py-3 px-3 bg-brand-surface border border-brand-border rounded-xl text-brand-charcoal text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none" />
                </div>
              </Field>
              <Field label="Instagram" optional>
                <TextInput value={form.instagramUrl} onChange={v => set('instagramUrl', v)}
                  placeholder="@sarah.realty" icon={Instagram} />
              </Field>
            </div>

            <div className="flex gap-3">
              <button onClick={back}
                className="flex-shrink-0 px-4 py-3 border border-brand-border bg-white text-brand-slate rounded-xl text-sm font-medium hover:bg-brand-surface transition-all flex items-center gap-1.5">
                <ArrowLeft size={14} /> Back
              </button>
              <button onClick={next}
                className="flex-1 py-3 bg-brand-charcoal text-white rounded-xl font-bold text-sm hover:bg-black transition-all flex items-center justify-center gap-2 group">
                Continue <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: Password + Terms ── */}
        {step === 3 && (
          <motion.div key="step3"
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
            className="space-y-4">

            <div>
              <h3 className="text-base font-display font-bold text-brand-charcoal">Secure your account</h3>
              <p className="text-xs text-brand-muted mt-0.5">Create a password to log in to PropPost.</p>
            </div>

            {/* Final agency reminder before submit */}
            {confirmedAgency && joinMethod !== 'independent' && (
              <AgencyBadge name={confirmedAgency.name} city={confirmedAgency.city} method={joinMethod} />
            )}

            <Field label="Password" required hint="Min. 8 chars · 1 uppercase · 1 number · 1 special character">
              <TextInput type="password" value={form.password} onChange={v => set('password', v)}
                placeholder="••••••••" icon={Lock} required autoFocus />
              <PasswordStrength password={form.password} />
            </Field>

            <Field label="Confirm password" required>
              <TextInput type="password" value={form.confirmPassword} onChange={v => set('confirmPassword', v)}
                placeholder="••••••••" icon={Lock} required />
            </Field>

            <div className="space-y-3 pt-1">
              {([
                {
                  key: 'termsAccepted' as const,
                  label: <>I agree to PropPost's <a href="#" className="text-brand-teal underline">Terms of Service</a> and <a href="#" className="text-brand-teal underline">Privacy Policy</a></>,
                },
                {
                  key: 'confirmsAgent' as const,
                  label: 'I confirm I am a registered or working real estate agent in South Africa',
                },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set(key, !form[key])}
                  className="flex items-start gap-2.5 text-left w-full"
                >
                  <div className={cn(
                    'w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-all',
                    form[key] ? 'bg-brand-teal border-brand-teal' : 'border-brand-border',
                  )}>
                    {form[key] && <CheckCircle2 size={10} className="text-white" />}
                  </div>
                  <span className="text-xs text-brand-slate leading-relaxed">{label}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={back}
                className="flex-shrink-0 px-4 py-3 border border-brand-border bg-white text-brand-slate rounded-xl text-sm font-medium hover:bg-brand-surface transition-all flex items-center gap-1.5">
                <ArrowLeft size={14} /> Back
              </button>
              <button onClick={handleSubmit} disabled={isLoading}
                className="flex-1 py-3 bg-brand-teal text-white rounded-xl font-bold text-sm hover:bg-brand-teal-deep transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                {isLoading
                  ? <Loader2 size={16} className="animate-spin" />
                  : <>{joinMethod === 'request' ? 'Send join request' : 'Create my account'} <CheckCircle2 size={16} /></>
                }
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
