import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

import { authApi, getErrorMessage } from '../lib/api';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Button } from '../components/ui/Button';
import { PasswordInput } from '../components/ui/PasswordInput';
import { ErrorState } from '../components/ui/ErrorState';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!password) next.password = 'Password is required.';
    else if (password.length < 8) next.password = 'Use at least 8 characters.';
    if (confirm !== password) next.confirm = 'Passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to reset your password. The link may have expired.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Reset your password">
        <ErrorState
          title="Invalid reset link"
          message="This password reset link is missing or invalid. Please request a new one."
        />
        <Button variant="outline" fullWidth className="mt-5" onClick={() => window.location.assign('/forgot-password')}>
          Request a new link
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Your new password must be at least 8 characters long."
      footer={
        <>
          Back to{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
            sign in
          </Link>
        </>
      }
    >
      {done ? (
        <div className="rounded-xl border border-success-200 bg-success-50 p-6 text-center dark:border-success-600/30 dark:bg-success-600/10">
          <CheckCircle2 className="mx-auto h-10 w-10 text-success-600 dark:text-success-400" aria-hidden="true" />
          <h3 className="mt-3 text-base font-semibold text-ink">Password updated</h3>
          <p className="mt-1.5 text-sm text-subtle">
            Your password has been changed. You can now sign in with your new password.
          </p>
          <Link
            to="/login"
            className="mt-5 inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            Go to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          {formError && <ErrorState title="Reset failed" message={formError} className="py-6" />}
          <PasswordInput
            label="New password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors.password}
            required
          />
          <PasswordInput
            label="Confirm new password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            error={errors.confirm}
            required
          />
          <Button type="submit" size="lg" fullWidth loading={submitting}>
            Update password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

export default ResetPasswordPage;
