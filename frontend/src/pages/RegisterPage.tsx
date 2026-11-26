import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, User, Phone, ShieldCheck, ArrowLeft, RefreshCw, KeyRound, Sparkles } from 'lucide-react';

import { authApi, getErrorMessage } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PasswordInput } from '../components/ui/PasswordInput';
import { ErrorState } from '../components/ui/ErrorState';

export function RegisterPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Step 1 Form Data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  // Step 2 OTP State
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const validateDetails = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Full name is required.';
    if (!email.trim()) next.email = 'Email address is required.';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Enter a valid email address.';
    
    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    if (!cleanPhone) next.phone = 'Mobile number is required.';
    else if (cleanPhone.length < 10) next.phone = 'Enter a valid mobile number (at least 10 digits).';

    if (!password) next.password = 'Password is required.';
    else if (password.length < 8) next.password = 'Password must be at least 8 characters.';
    if (confirm !== password) next.confirm = 'Passwords do not match.';
    
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSendOtp = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');
    if (!validateDetails()) return;

    setSendingOtp(true);
    try {
      const res = await authApi.sendOtp({
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
      });
      if (res.dev_otp) {
        setDevOtp(res.dev_otp);
      }
      setResendCooldown(30);
      setStep('otp');
      showToast({
        variant: 'success',
        title: 'Verification code sent',
        message: `OTP sent to ${email.trim()} and ${phone.trim()}`,
      });
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to send verification code. Please check your details.'));
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || sendingOtp) return;
    setSendingOtp(true);
    setFormError('');
    try {
      const res = await authApi.sendOtp({
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
      });
      if (res.dev_otp) {
        setDevOtp(res.dev_otp);
      }
      setResendCooldown(30);
      showToast({
        variant: 'success',
        title: 'Code resent successfully',
        message: `New code sent to ${email.trim()} and ${phone.trim()}`,
      });
    } catch (error) {
      setFormError(getErrorMessage(error, 'Failed to resend code. Please try again.'));
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyAndRegister = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');

    if (!otp.trim() || otp.trim().length < 4) {
      setFormError('Please enter the verification code sent to your email and mobile.');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        otp: otp.trim(),
        account_type: 'personal',
      });
      
      // Save local phone cache for convenient offline access
      localStorage.setItem('billnow_user_phone', phone.trim());

      showToast({
        variant: 'success',
        title: 'Account created & verified!',
        message: 'Welcome to BillNow.',
      });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error, 'Verification failed. Please check the code and try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  // STEP 2: OTP Verification Screen
  if (step === 'otp') {
    return (
      <AuthLayout
        title="Verify your account"
        subtitle="Confirm your identity to protect your warranties and invoices."
        footer={
          <button
            type="button"
            onClick={() => setStep('details')}
            className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Change email or phone number</span>
          </button>
        }
      >
        <form onSubmit={handleVerifyAndRegister} noValidate className="space-y-4">
          {formError && <ErrorState title="Verification Error" message={formError} className="py-3" />}

          {/* Verification Target Info Card */}
          <div className="rounded-2xl border border-line bg-surface/70 p-3.5 space-y-2">
            <p className="text-[11px] font-semibold text-subtle uppercase tracking-wider">
              Verification code sent to
            </p>
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex items-center gap-2 font-medium text-ink">
                <Mail className="h-3.5 w-3.5 text-brand-600" />
                <span>{email}</span>
              </div>
              <div className="flex items-center gap-2 font-medium text-ink">
                <Phone className="h-3.5 w-3.5 text-brand-600" />
                <span>{phone}</span>
              </div>
            </div>
          </div>

          {/* Quick Demo Helper (if available) */}
          {devOtp && (
            <button
              type="button"
              onClick={() => setOtp(devOtp)}
              className="w-full flex items-center justify-between rounded-xl bg-brand-50/80 dark:bg-brand-500/15 border border-brand-200 dark:border-brand-500/30 px-3 py-2 text-xs text-brand-700 dark:text-brand-300 active:scale-98 transition-transform"
            >
              <div className="flex items-center gap-1.5 font-medium">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Test Code: <strong>{devOtp}</strong></span>
              </div>
              <span className="text-[11px] font-bold underline">Tap to autofill</span>
            </button>
          )}

          {/* OTP Input */}
          <div>
            <label htmlFor="otp-input" className="block text-xs font-bold text-ink mb-1.5">
              Enter 6-Digit Code
            </label>
            <div className="relative">
              <input
                id="otp-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="• • • • • •"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full h-12 text-center text-xl font-extrabold tracking-[0.5em] rounded-xl border border-line bg-surface text-ink focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none"
                autoFocus
              />
              <KeyRound className="absolute left-3.5 top-3.5 h-5 w-5 text-subtle pointer-events-none" />
            </div>
          </div>

          {/* Resend Action */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-subtle">Didn't receive the code?</span>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || sendingOtp}
              className="font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${sendingOtp ? 'animate-spin' : ''}`} />
              <span>
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </span>
            </button>
          </div>

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={submitting}
            className="h-12 text-sm font-bold shadow-md mt-4"
          >
            <ShieldCheck className="h-4 w-4 mr-1.5" />
            Verify & Create Account
          </Button>
        </form>
      </AuthLayout>
    );
  }

  // STEP 1: Registration Details
  return (
    <AuthLayout
      title="Create account"
      subtitle="Join BillNow and never forget a warranty again."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSendOtp} noValidate className="space-y-3.5">
        {formError && <ErrorState title="Registration error" message={formError} className="py-3" />}

        <Input
          label="Full name"
          autoComplete="name"
          placeholder="e.g. Pavan Kumar"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
          leftIcon={<User className="h-4 w-4" />}
          required
        />

        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="e.g. pavan@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
          leftIcon={<Mail className="h-4 w-4" />}
          required
        />

        <Input
          label="Mobile number"
          type="tel"
          autoComplete="tel"
          placeholder="e.g. +91 98765 43210"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          error={errors.phone}
          leftIcon={<Phone className="h-4 w-4" />}
          hint="We'll send an OTP to verify your mobile & email"
          required
        />

        <PasswordInput
          label="Password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          required
        />

        <PasswordInput
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          error={errors.confirm}
          required
        />

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={sendingOtp}
          className="h-12 text-sm font-bold shadow-md mt-2"
        >
          Send Verification Code
        </Button>
      </form>
    </AuthLayout>
  );
}

export default RegisterPage;
