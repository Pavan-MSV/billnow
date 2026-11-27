import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  User,
  Phone,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  KeyRound,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';

import { authApi, getErrorMessage } from '../lib/api';
import {
  isFirebaseConfigured,
  sendFirebasePhoneOtp,
  verifyFirebasePhoneOtp,
} from '../lib/firebase';
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
  const [channel, setChannel] = useState<'email' | 'sms'>('email');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  // Step 2 OTP State
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [otp, setOtp] = useState('');
  const [activeChannel, setActiveChannel] = useState<'email' | 'sms'>('email');
  const [isFirebaseSession, setIsFirebaseSession] = useState(false);
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

  const handleSendOtp = async (event?: FormEvent, targetChannel?: 'email' | 'sms') => {
    if (event) event.preventDefault();
    setFormError('');
    if (!validateDetails()) return;

    const chosenChannel = targetChannel || channel;
    setSendingOtp(true);
    try {
      // If user selected SMS and Firebase is configured, use Firebase Phone Auth
      if (chosenChannel === 'sms' && isFirebaseConfigured) {
        await sendFirebasePhoneOtp(phone.trim(), 'recaptcha-container');
        setIsFirebaseSession(true);
        setActiveChannel('sms');
        setResendCooldown(30);
        setStep('otp');

        showToast({
          variant: 'success',
          title: 'SMS Sent via Firebase',
          message: `Verification code sent to ${phone.trim()}`,
        });
      } else {
        // Use Backend API (Email OTP or Backend SMS Gateway)
        setIsFirebaseSession(false);
        const res = await authApi.sendOtp({
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          channel: chosenChannel,
        });

        setActiveChannel(chosenChannel);
        setResendCooldown(30);
        setStep('otp');

        showToast({
          variant: 'success',
          title: chosenChannel === 'sms' ? 'SMS sent' : 'Email sent',
          message:
            res.message ||
            (chosenChannel === 'sms'
              ? `Verification code sent via SMS to ${phone.trim()}`
              : `Verification code sent to ${email.trim()}`),
        });
      }
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to send verification code. Please check your details.'));
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || sendingOtp) return;
    await handleSendOtp(undefined, activeChannel);
  };

  const handleSwitchChannelAndSend = async (newChannel: 'email' | 'sms') => {
    if (sendingOtp) return;
    await handleSendOtp(undefined, newChannel);
  };

  const handleVerifyAndRegister = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');

    if (!otp.trim() || otp.trim().length < 4) {
      setFormError('Please enter the 6-digit verification code sent to you.');
      return;
    }

    setSubmitting(true);
    try {
      let firebaseToken: string | undefined = undefined;

      // If this was a Firebase SMS session, confirm with Firebase to get ID token
      if (isFirebaseSession) {
        const result = await verifyFirebasePhoneOtp(otp.trim());
        firebaseToken = result.idToken;
      }

      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        otp: isFirebaseSession ? undefined : otp.trim(),
        firebase_id_token: firebaseToken,
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

          {/* Hidden container for Firebase invisible reCAPTCHA */}
          <div id="recaptcha-container"></div>

          {/* Delivery Target Banner */}
          <div className="rounded-2xl border border-line bg-surface/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-subtle uppercase tracking-wider">
                Verification Code Sent
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2 py-0.5 text-[11px] font-semibold text-brand-600 dark:text-brand-400">
                <CheckCircle2 className="h-3 w-3" />
                {activeChannel === 'sms' ? (isFirebaseSession ? 'Firebase SMS' : 'SMS') : 'Email'}
              </span>
            </div>

            {activeChannel === 'sms' ? (
              <div className="flex items-start gap-3 rounded-xl bg-surface p-3 border border-line">
                <div className="rounded-lg bg-brand-500/10 p-2 text-brand-600">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-ink">{phone}</p>
                  <p className="text-subtle text-[11px]">Check your phone messages for the 6-digit code.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-xl bg-surface p-3 border border-line">
                <div className="rounded-lg bg-brand-500/10 p-2 text-brand-600">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-ink">{email}</p>
                  <p className="text-subtle text-[11px]">Check your inbox or spam folder for the code.</p>
                </div>
              </div>
            )}

            {/* Switch Channel Quick Link */}
            <div className="pt-1 text-center">
              {activeChannel === 'sms' ? (
                <button
                  type="button"
                  disabled={sendingOtp}
                  onClick={() => handleSwitchChannelAndSend('email')}
                  className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline font-medium"
                >
                  Didn't receive SMS? <strong>Send code to email instead</strong>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={sendingOtp}
                  onClick={() => handleSwitchChannelAndSend('sms')}
                  className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline font-medium"
                >
                  Didn't receive email? <strong>Send code via SMS instead</strong>
                </button>
              )}
            </div>
          </div>

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
      <form onSubmit={(e) => handleSendOtp(e)} noValidate className="space-y-3.5">
        {formError && <ErrorState title="Registration error" message={formError} className="py-3" />}

        {/* Hidden container for Firebase invisible reCAPTCHA */}
        <div id="recaptcha-container"></div>

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
          placeholder="e.g. 7382082800"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          error={errors.phone}
          leftIcon={<Phone className="h-4 w-4" />}
          hint="10-digit mobile number for SMS OTP and warranty alerts"
          required
        />

        {/* Channel Selector: Email vs SMS */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-bold text-ink">
            Send verification OTP via:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setChannel('email')}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 border text-xs font-bold transition-all ${
                channel === 'email'
                  ? 'bg-brand-500/10 border-brand-500 text-brand-600 dark:text-brand-400 ring-2 ring-brand-500/20'
                  : 'border-line bg-surface/50 text-subtle hover:text-ink hover:border-line-focus'
              }`}
            >
              <Mail className="h-4 w-4" />
              <span>Email OTP</span>
            </button>
            <button
              type="button"
              onClick={() => setChannel('sms')}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 border text-xs font-bold transition-all ${
                channel === 'sms'
                  ? 'bg-brand-500/10 border-brand-500 text-brand-600 dark:text-brand-400 ring-2 ring-brand-500/20'
                  : 'border-line bg-surface/50 text-subtle hover:text-ink hover:border-line-focus'
              }`}
            >
              <Smartphone className="h-4 w-4" />
              <span>Mobile SMS</span>
            </button>
          </div>
          <p className="text-[11px] text-subtle">
            {channel === 'email'
              ? 'Verification code will be sent to your email inbox.'
              : isFirebaseConfigured
              ? 'Verification code will be sent via Firebase SMS to your phone.'
              : 'Verification code will be sent as an SMS to your mobile.'}
          </p>
        </div>

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
          {channel === 'sms' ? 'Send Code via SMS' : 'Send Code via Email'}
        </Button>
      </form>
    </AuthLayout>
  );
}

export default RegisterPage;
