import React, { useState, useEffect } from 'react';
import {
  Mail, Lock, User, Phone, Briefcase, Loader2, ArrowRight, ArrowLeft,
  CheckCircle2, Eye, EyeOff, Instagram
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

interface AgentSignUpProps {
  onToggle: () => void;
}

// Agents receive the same Agent workspace features whether they join through
// an email invitation or create an independent account.
// ──────────────────────────────────────────────────────────────────────────────

type JoinMethod = 'email_invite' | 'independent';

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
function AgencyBadge({ name, city }: { name: string; city?: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-brand-teal-light border border-brand-teal/30 rounded-xl">
      <div className="w-8 h-8 rounded-lg bg-brand-teal flex items-center justify-center flex-shrink-0">
        <CheckCircle2 size={16} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-brand-charcoal truncate">{name}</p>
        <p className="text-[11px] text-brand-teal-dark">
          {city && `${city} · `}Joining via email invite
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AgentSignUp({ onToggle }: AgentSignUpProps) {
  const [step, setStep]               = useState(0);
  const [joinMethod, setJoinMethod]   = useState<JoinMethod>('independent');
  const [isLoading, setIsLoading]     = useState(false);
  const [isSuccess, setIsSuccess]     = useState(false);

  // Agency state — ALL paths must resolve to a confirmed agency before step 1
  const [confirmedAgency, setConfirmedAgency] = useState<{
    id: string; name: string; city?: string;
  } | null>(null);

  // Email invite token (resolved from ?invite= URL param on mount)
  const [inviteToken, setInviteToken]           = useState<string | null>(null);
  const [inviteValidating, setInviteValidating] = useState(false);
  const [inviteError, setInviteError]           = useState<string | null>(null);

  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const { signUp } = useAuth();

  // ── Resolve ?invite=TOKEN on mount ─────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('invite');
    if (!token) return;

    setJoinMethod('email_invite');
    setInviteValidating(true);

    (async () => {
      const { data: invite } = await supabase
        .from('invites')
        .select('id, agency_id, invitee_email, expires_at')
        .eq('token', token)
        .is('used_at', null)
        .maybeSingle();

      if (!invite) {
        setInviteError('This invitation link is invalid or has already been used.');
        setInviteValidating(false);
        return;
      }
      if (new Date(invite.expires_at) < new Date()) {
        setInviteError('This invitation link has expired. Ask your agency admin for a new one.');
        setInviteValidating(false);
        return;
      }

      const { data: agency } = await supabase
        .from('agencies')
        .select('id, agency_name, city')
        .eq('id', invite.agency_id)
        .maybeSingle();

      if (agency) {
        setConfirmedAgency({ id: agency.id, name: agency.agency_name, city: agency.city });
      }
      if (invite.invitee_email) {
        setForm(prev => ({ ...prev, email: invite.invitee_email }));
      }
      setInviteToken(token);
      setInviteValidating(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [form, setForm] = useState({
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

  const toggleArea = (area: string) =>
    setSelectedAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );

  // ── Agency is optional — validate only when a path requires it ──────────────
  const canLeaveStep0 = (): boolean => {
    if (joinMethod === 'independent')  return true;
    if (joinMethod === 'email_invite') return !!inviteToken && !!confirmedAgency;
    return false;
  };

  const validateStep = (): boolean => {
    if (step === 0) {
      if (joinMethod === 'email_invite' && !inviteToken) {
        toast.error('Please use the link in your invitation email to sign up.');
        return false;
      }
      if (!canLeaveStep0()) {
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
        join_method: joinMethod,
        job_title: form.jobTitle,
        ppra_number: form.ppraNumber,
        bio: form.bio,
        specialisation: form.specialisation,
        areas: selectedAreas,
        instagram_url: form.instagramUrl,
        status: 'active',
      });

      if (inviteToken) {
        await supabase
          .from('invites')
          .update({ used_at: new Date().toISOString() })
          .eq('token', inviteToken);
      }

      setIsSuccess(true);
      toast.success(`Account created! Check ${form.email} to verify your account.`);
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
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto bg-brand-green-light">
          <CheckCircle2 className="w-8 h-8 text-brand-green" />
        </div>
        <div>
          <h3 className="text-xl font-display font-bold text-brand-charcoal">Welcome, {form.firstName}!</h3>
          <p className="text-brand-slate text-sm mt-2 leading-relaxed">
            {joinMethod === 'independent'
              ? `Check ${form.email} to verify your account and unlock your full agent dashboard.`
              : `Check ${form.email} to verify your account. Once confirmed, you can start publishing under ${confirmedAgency?.name}.`
            }
          </p>
        </div>
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
                Choose how you'd like to create your agent account.
              </p>
            </div>

            {/* Join method options */}
            {([
              {
                id: 'email_invite' as JoinMethod,
                title: 'I was invited by email',
                desc: 'Use the link in your invitation email — it pre-fills everything.',
              },
              {
                id: 'independent' as JoinMethod,
                title: 'Sign up as an independent agent',
                desc: 'Create your account with full access to all agent features.',
              },
            ] as const).map(opt => (
              <button key={opt.id} type="button"
                onClick={() => { setJoinMethod(opt.id); setConfirmedAgency(null); }}
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

            {/* ── Email invite ── */}
            {joinMethod === 'email_invite' && (
              <div className="space-y-3">
                {inviteValidating && (
                  <div className="flex items-center gap-3 p-4 bg-brand-surface border border-brand-border rounded-xl">
                    <Loader2 size={16} className="animate-spin text-brand-teal flex-shrink-0" />
                    <p className="text-[11px] text-brand-muted">Validating your invitation…</p>
                  </div>
                )}

                {!inviteValidating && inviteError && (
                  <div className="space-y-2">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-[11px] text-red-600 leading-relaxed font-medium mb-1">Invalid invitation</p>
                      <p className="text-[11px] text-red-500 leading-relaxed">{inviteError}</p>
                    </div>
                    <p className="text-[11px] text-brand-muted text-center">
                      Ask your agency admin to send a new invitation.
                    </p>
                  </div>
                )}

                {!inviteValidating && !inviteError && inviteToken && confirmedAgency && (
                  <AgencyBadge name={confirmedAgency.name} city={confirmedAgency.city} />
                )}

                {!inviteValidating && !inviteToken && !inviteError && (
                  <div className="space-y-2">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-[11px] text-amber-700 leading-relaxed font-medium mb-1">
                        Open your invitation email
                      </p>
                      <p className="text-[11px] text-amber-600 leading-relaxed">
                        Find the email from your agency admin and click the <strong>"Accept invitation"</strong> link.
                        It will bring you back here with your agency already linked.
                      </p>
                    </div>
                    <p className="text-[11px] text-brand-muted text-center">
                      Can't find the email? Ask your agency admin to resend the invitation.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Continue button */}
            <button
              type="button"
              onClick={next}
              disabled={inviteValidating || !canLeaveStep0()}
              className={cn(
                'w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 group',
                canLeaveStep0() && !inviteValidating
                  ? 'bg-brand-charcoal text-white hover:bg-black'
                  : 'bg-brand-border text-brand-muted cursor-not-allowed',
              )}>
              {inviteValidating
                ? <><Loader2 size={16} className="animate-spin" /> Validating invite…</>
                : joinMethod === 'email_invite' && !inviteToken
                  ? 'Use the link in your email'
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
              <AgencyBadge name={confirmedAgency.name} city={confirmedAgency.city} />
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
                  <span className="text-[10px] font-black tracking-wider">ZA</span><span>+27</span>
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
                  <div className="flex items-center px-2 py-3 bg-brand-surface border border-brand-border rounded-xl text-[10px] font-black tracking-wider text-brand-muted flex-shrink-0">ZA</div>
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
              <AgencyBadge name={confirmedAgency.name} city={confirmedAgency.city} />
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
                  : <>Create my account <CheckCircle2 size={16} /></>
                }
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
