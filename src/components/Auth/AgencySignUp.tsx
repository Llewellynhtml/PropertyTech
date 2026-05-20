import React, { useState } from 'react';
import {
  Building2, Mail, Phone, Globe, MapPin, Users,
  User, Lock, Loader2, ArrowRight, ArrowLeft,
  CheckCircle2, Eye, EyeOff, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { SA_PROVINCES, PLAN_LIMITS } from '../../types';

interface AgencySignUpProps {
  onToggle: () => void;
}

type Plan = 'free' | 'growth' | 'scale';

const AGENT_COUNTS = ['1–5', '6–15', '16–30', '31+'];

const plans: { id: Plan; features: string }[] = [
  { id: 'free',   features: 'Up to 3 agents · 5 posts/month · 2 platforms · Basic templates' },
  { id: 'growth', features: 'Up to 15 agents · Unlimited posts · All 6 platforms · AI captions · Full branding kit · Analytics' },
  { id: 'scale',  features: 'Unlimited agents · White-label · API access · Dedicated support' },
];

function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <React.Fragment key={i}>
          <div className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all',
            i + 1 < step  && 'bg-brand-teal text-white',
            i + 1 === step && 'bg-brand-teal text-white ring-4 ring-brand-teal/20',
            i + 1 > step  && 'bg-brand-border text-brand-muted',
          )}>{i + 1}</div>
          {i < total - 1 && (
            <div className={cn('flex-1 h-px', i + 1 < step ? 'bg-brand-teal' : 'bg-brand-border')} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-bold text-brand-muted uppercase tracking-[0.15em]">
        {label}
        {required && <span className="text-red-400 normal-case tracking-normal font-medium">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-brand-muted leading-relaxed">{hint}</p>}
    </div>
  );
}

function TextInput({ id, type = 'text', value, onChange, placeholder, icon: Icon, required }: {
  id: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; icon?: React.ElementType; required?: boolean;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="relative group">
      {Icon && <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted group-focus-within:text-brand-teal transition-colors" />}
      <input
        id={id}
        type={isPassword ? (show ? 'text' : 'password') : type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
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
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-brand-green'];
  const labels = ['Too short', 'Weak', 'Fair', 'Strong'];
  if (!password) return null;
  return (
    <div className="space-y-1.5 mt-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={cn('flex-1 h-1 rounded-full transition-all', i < score ? colors[score - 1] : 'bg-brand-border')} />
        ))}
      </div>
      <p className={cn('text-[11px]', score < 3 ? 'text-orange-500' : 'text-brand-green')}>{labels[score - 1] || ''}</p>
    </div>
  );
}

export default function AgencySignUp({ onToggle }: AgencySignUpProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { signUp } = useAuth();

  const [form, setForm] = useState({
    // Step 1 — Agency details
    agencyName: '', tradingName: '', province: '', city: '',
    officeAddress: '', officePhone: '', website: '', agentCount: '',
    // Step 2 — Admin account
    firstName: '', lastName: '', adminEmail: '', adminPhone: '',
    password: '', confirmPassword: '',
    termsAccepted: false, isLegitimate: false,
    // Step 3 — Plan
    plan: 'growth' as Plan,
  });

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const validateStep = () => {
    if (step === 1) {
      if (!form.agencyName.trim()) { toast.error('Agency name is required'); return false; }
      if (!form.province)          { toast.error('Please select a province'); return false; }
      if (!form.city.trim())       { toast.error('City is required'); return false; }
      if (!form.officePhone.trim()){ toast.error('Office phone is required'); return false; }
      if (!form.agentCount)        { toast.error('Please select your team size'); return false; }
    }
    if (step === 2) {
      if (!form.firstName.trim())   { toast.error('First name is required'); return false; }
      if (!form.lastName.trim())    { toast.error('Last name is required'); return false; }
      if (!form.adminEmail.trim())  { toast.error('Email is required'); return false; }
      if (!form.adminPhone.trim())  { toast.error('Mobile number is required'); return false; }
      if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return false; }
      if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return false; }
      if (!form.termsAccepted)      { toast.error('Please accept the Terms of Service'); return false; }
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep(s => s + 1); };
  const back = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const planLimits = PLAN_LIMITS[form.plan];
      await signUp(form.adminEmail, 'agency', {
        password: form.password,
        name: `${form.firstName} ${form.lastName}`,
        agency_name: form.agencyName,
        trading_name: form.tradingName,
        agency_email: form.adminEmail,
        office_number: form.officePhone,
        province: form.province,
        city: form.city,
        address: form.officeAddress,
        website: form.website,
        agent_count: form.agentCount,
        plan: form.plan,
        plan_agent_limit: planLimits.agents,
        plan_post_limit: planLimits.posts,
        plan_platform_limit: planLimits.platforms,
        trial_ends_at: form.plan !== 'free'
          ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
          : null,
      });
      setIsSuccess(true);
      toast.success('Agency registered! Check your email to verify.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to register agency');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8 space-y-5">
        <div className="w-16 h-16 bg-brand-green-light rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-brand-green" />
        </div>
        <div>
          <h3 className="text-xl font-display font-bold text-brand-charcoal">You're registered!</h3>
          <p className="text-brand-slate text-sm mt-2 leading-relaxed">
            Check <span className="font-semibold text-brand-charcoal">{form.adminEmail}</span> to verify your account and unlock your agency dashboard.
          </p>
        </div>
        <div className="text-left bg-brand-surface rounded-xl p-4 text-sm text-brand-slate space-y-2">
          <p className="font-semibold text-brand-charcoal text-[11px] uppercase tracking-widest mb-3">Next steps</p>
          <div className="flex gap-2"><CheckCircle2 size={14} className="text-brand-green mt-0.5 flex-shrink-0" /><span>Verify your email address</span></div>
          <div className="flex gap-2"><CheckCircle2 size={14} className="text-brand-green mt-0.5 flex-shrink-0" /><span>Upload your logo and set brand colours</span></div>
          <div className="flex gap-2"><CheckCircle2 size={14} className="text-brand-green mt-0.5 flex-shrink-0" /><span>Share your invite code with your agents</span></div>
        </div>
        <button onClick={onToggle}
          className="w-full py-3 bg-brand-charcoal text-white rounded-xl font-bold text-sm hover:bg-black transition-all">
          Back to Sign In
        </button>
      </motion.div>
    );
  }

  return (
    <div>
      <StepDots step={step} total={3} />

      <AnimatePresence mode="wait">
        {/* ── STEP 1: Agency details ── */}
        {step === 1 && (
          <motion.div key="step1"
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
            className="space-y-4">
            <div>
              <h3 className="text-base font-display font-bold text-brand-charcoal">About your agency</h3>
              <p className="text-xs text-brand-muted mt-0.5">This information appears on all agent profiles and posts.</p>
            </div>

            <Field label="Agency name" required>
              <TextInput id="agencyName" value={form.agencyName} onChange={v => set('agencyName', v)}
                placeholder="Acme Realty Group" icon={Building2} required />
            </Field>

            <Field label="Trading name / DBA" hint="Shorter display name shown on social posts, if different">
              <TextInput id="tradingName" value={form.tradingName} onChange={v => set('tradingName', v)}
                placeholder="Acme Realty" icon={Building2} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Province" required>
                <div className="relative">
                  <select value={form.province} onChange={e => set('province', e.target.value)}
                    className="w-full py-3 pl-4 pr-8 bg-brand-surface border border-brand-border rounded-xl text-brand-charcoal text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none appearance-none">
                    <option value="">Select…</option>
                    {SA_PROVINCES.map(p => (
                      <option key={p.code} value={p.code}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
                </div>
              </Field>
              <Field label="City" required>
                <TextInput id="city" value={form.city} onChange={v => set('city', v)}
                  placeholder="Johannesburg" icon={MapPin} required />
              </Field>
            </div>

            <Field label="Office phone" required>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-3 py-3 bg-brand-surface border border-brand-border rounded-xl text-sm text-brand-muted flex-shrink-0">
                  <span className="text-xs">🇿🇦</span><span>+27</span>
                </div>
                <input value={form.officePhone} onChange={e => set('officePhone', e.target.value)}
                  placeholder="11 234 5678" type="tel"
                  className="flex-1 py-3 px-4 bg-brand-surface border border-brand-border rounded-xl text-brand-charcoal text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none" />
              </div>
            </Field>

            <div className="grid grid-cols-1 gap-3">
              <Field label="Office address" hint="Full street address (optional)">
                <TextInput id="officeAddress" value={form.officeAddress} onChange={v => set('officeAddress', v)}
                  placeholder="12 Sandton Drive, Sandton, 2196" icon={MapPin} />
              </Field>
              <Field label="Website" hint="Optional">
                <TextInput id="website" value={form.website} onChange={v => set('website', v)}
                  placeholder="www.acmerealty.co.za" icon={Globe} />
              </Field>
            </div>

            <Field label="Number of agents" required hint="Helps us suggest the right plan for your team">
              <div className="flex gap-2 flex-wrap">
                {AGENT_COUNTS.map(c => (
                  <button key={c} type="button" onClick={() => set('agentCount', c)}
                    className={cn('px-4 py-2 rounded-lg border text-sm font-medium transition-all',
                      form.agentCount === c
                        ? 'bg-brand-teal text-white border-brand-teal'
                        : 'bg-brand-surface border-brand-border text-brand-slate hover:border-brand-teal')}>
                    {c}
                  </button>
                ))}
              </div>
            </Field>

            <button onClick={next}
              className="w-full py-3.5 bg-brand-charcoal text-white rounded-xl font-bold text-sm hover:bg-black transition-all flex items-center justify-center gap-2 group mt-2">
              Continue <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>

            <div className="text-center pt-2">
              <button 
                type="button"
                onClick={onToggle}
                className="text-xs font-bold text-brand-muted hover:text-brand-teal transition-colors"
              >
                Already registered? <span className="text-brand-teal">Sign in to workspace</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: Admin account ── */}
        {step === 2 && (
          <motion.div key="step2"
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
            className="space-y-4">
            <div>
              <h3 className="text-base font-display font-bold text-brand-charcoal">Admin account</h3>
              <p className="text-xs text-brand-muted mt-0.5">The main owner and manager of this agency workspace.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="First name" required>
                <TextInput id="firstName" value={form.firstName} onChange={v => set('firstName', v)}
                  placeholder="Thabo" icon={User} required />
              </Field>
              <Field label="Last name" required>
                <TextInput id="lastName" value={form.lastName} onChange={v => set('lastName', v)}
                  placeholder="Nkosi" icon={User} required />
              </Field>
            </div>

            <Field label="Work email" required hint="Use your agency domain email when possible">
              <TextInput id="adminEmail" type="email" value={form.adminEmail} onChange={v => set('adminEmail', v)}
                placeholder="thabo@acmerealty.co.za" icon={Mail} required />
            </Field>

            <Field label="Mobile number" required hint="Used for 2FA and account recovery. Never shown publicly.">
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-3 py-3 bg-brand-surface border border-brand-border rounded-xl text-sm text-brand-muted flex-shrink-0">
                  <span className="text-xs">🇿🇦</span><span>+27</span>
                </div>
                <input value={form.adminPhone} onChange={e => set('adminPhone', e.target.value)}
                  placeholder="82 000 0000" type="tel"
                  className="flex-1 py-3 px-4 bg-brand-surface border border-brand-border rounded-xl text-brand-charcoal text-sm focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal outline-none" />
              </div>
            </Field>

            <Field label="Password" required hint="Min. 8 characters · 1 uppercase · 1 number · 1 special character">
              <TextInput id="password" type="password" value={form.password} onChange={v => set('password', v)}
                placeholder="••••••••" icon={Lock} required />
              <PasswordStrength password={form.password} />
            </Field>

            <Field label="Confirm password" required>
              <TextInput id="confirmPassword" type="password" value={form.confirmPassword}
                onChange={v => set('confirmPassword', v)} placeholder="••••••••" icon={Lock} required />
            </Field>

            <div className="space-y-3 pt-1">
              {[
                { key: 'termsAccepted' as const, label: <>I agree to PropPost's <a href="#" className="text-brand-teal underline">Terms of Service</a> and <a href="#" className="text-brand-teal underline">Privacy Policy</a></> },
                { key: 'isLegitimate' as const, label: 'I confirm this is a legitimate registered South African property business' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set(key, !form[key])}
                  className="flex items-start gap-2.5 text-left w-full"
                >
                  <div className={cn('w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-all',
                    form[key] ? 'bg-brand-teal border-brand-teal' : 'border-brand-border')}>
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
              <button onClick={next}
                className="flex-1 py-3 bg-brand-charcoal text-white rounded-xl font-bold text-sm hover:bg-black transition-all flex items-center justify-center gap-2 group">
                Continue <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: Plan ── */}
        {step === 3 && (
          <motion.div key="step3"
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
            className="space-y-4">
            <div>
              <h3 className="text-base font-display font-bold text-brand-charcoal">Choose your plan</h3>
              <p className="text-xs text-brand-muted mt-0.5">Start free — upgrade anytime. No credit card needed today.</p>
            </div>

            <div className="space-y-2">
              {plans.map(({ id, features }) => {
                const limits = PLAN_LIMITS[id];
                const isSelected = form.plan === id;
                return (
                  <button key={id} type="button" onClick={() => set('plan', id)}
                    className={cn('w-full text-left p-4 rounded-xl border transition-all',
                      isSelected ? 'border-brand-teal bg-brand-teal-light' : 'border-brand-border bg-white hover:border-brand-teal/50')}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-brand-charcoal">{limits.label}</span>
                        {id === 'growth' && (
                          <span className="text-[10px] font-bold bg-brand-teal text-white px-2 py-0.5 rounded-full">Most popular · 14-day trial</span>
                        )}
                        {id === 'free' && (
                          <span className="text-[10px] font-bold bg-brand-surface text-brand-muted px-2 py-0.5 rounded-full border border-brand-border">Free forever</span>
                        )}
                      </div>
                      <span className="font-bold text-sm text-brand-teal whitespace-nowrap">
                        {limits.price === 0 ? 'R 0' : `R ${limits.price.toLocaleString()}/mo`}
                      </span>
                    </div>
                    <p className="text-[11px] text-brand-muted leading-relaxed">{features}</p>
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-brand-muted text-center">
              Billed in ZAR · Cancel anytime · PayFast & card accepted
            </p>

            {form.plan !== 'free' && (
              <div className="bg-brand-teal-light border border-brand-teal/20 rounded-xl p-3 text-[11px] text-brand-teal-dark leading-relaxed">
                14-day free trial starts when you create your account. No card required until day 14.
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button onClick={back}
                className="flex-shrink-0 px-4 py-3 border border-brand-border bg-white text-brand-slate rounded-xl text-sm font-medium hover:bg-brand-surface transition-all flex items-center gap-1.5">
                <ArrowLeft size={14} /> Back
              </button>
              <button onClick={handleSubmit} disabled={isLoading}
                className="flex-1 py-3 bg-brand-teal text-white rounded-xl font-bold text-sm hover:bg-brand-teal-deep transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <>Create agency account <CheckCircle2 size={16} /></>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}