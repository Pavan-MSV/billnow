import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Mail } from 'lucide-react';

import { authApi, getErrorMessage } from '../lib/api';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ErrorState } from '../components/ui/ErrorState';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');
    setError('');
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setFormError(getErrorMessage(err, 'Unable to send the reset email. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the email you use for BillNow and we'll send you a reset link."
      footer={
        <>
          Remembered it?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
            Back to sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="rounded-xl border border-success-200 bg-success-50 p-6 text-center dark:border-success-600/30 dark:bg-success-600/10">
          <CheckCircle2 className="mx-auto h-10 w-10 text-success-600 dark:text-success-400" aria-hidden="true" />
          <h3 className="mt-3 text-base font-semibold text-ink">Check your inbox</h3>
          <p className="mt-1.5 text-sm text-subtle">
            If an account exists for <span className="font-medium text-ink">{email}</span>, you&apos;ll
            receive an email with a link to reset your password.
          </p>
          <Link
            to="/login"
            className="mt-5 inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            Return to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          {formError && <ErrorState title="Request failed" message={formError} className="py-6" />}
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={error}
            leftIcon={<Mail className="h-4 w-4" />}
            required
          />
          <Button type="submit" size="lg" fullWidth loading={submitting}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
