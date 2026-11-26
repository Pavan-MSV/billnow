import { useState, type FormEvent } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, AlertTriangle, CheckCircle2, Mail, ShieldAlert } from 'lucide-react';

import { authApi, getErrorMessage } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function DeleteAccountPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // Request flow state
  const [email, setEmail] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState('');

  // Confirm flow state
  const [confirming, setConfirming] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  const handleRequestDeletion = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setRequesting(true);
    setRequestError('');
    try {
      await authApi.requestAccountDeletion(email.trim());
      setRequestSent(true);
    } catch (err) {
      setRequestError(getErrorMessage(err, 'Failed to submit request. Please try again.'));
    } finally {
      setRequesting(false);
    }
  };

  const handleConfirmDeletion = async () => {
    if (!token) return;

    setConfirming(true);
    setConfirmError('');
    try {
      await authApi.confirmAccountDeletion(token);
      setDeleted(true);
    } catch (err) {
      setConfirmError(getErrorMessage(err, 'Invalid or expired deletion token.'));
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-ink py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Navigation */}
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Sign In</span>
        </Link>

        <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-sm">
          {token ? (
            /* Confirm Deletion Flow with Token */
            deleted ? (
              <div className="text-center space-y-4 py-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h1 className="text-xl font-extrabold text-ink">Account Permanently Deleted</h1>
                <p className="text-xs text-subtle leading-relaxed">
                  Your BillNow account, tracked products, warranty schedules, invoices, and service records have been wiped clean from our systems.
                </p>
                <Link
                  to="/"
                  className="inline-block mt-4 rounded-xl bg-brand-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-colors"
                >
                  Return to Homepage
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                    <Trash2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-lg font-extrabold text-ink">Confirm Account Deletion</h1>
                    <p className="text-xs text-rose-500 font-medium">Permanent & Irreversible</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 p-4 space-y-2 text-xs text-rose-900 dark:text-rose-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                    <p className="font-semibold">All data will be permanently wiped:</p>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-rose-700 dark:text-rose-300">
                    <li>All tracked products & active warranties</li>
                    <li>Uploaded invoice receipts in Cloudflare R2</li>
                    <li>Maintenance & repair history records</li>
                    <li>Notification alerts & preferences</li>
                  </ul>
                </div>

                {confirmError && (
                  <p className="rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 text-xs font-medium text-rose-600 dark:text-rose-400">
                    {confirmError}
                  </p>
                )}

                <Button
                  variant="danger"
                  className="w-full justify-center"
                  loading={confirming}
                  onClick={handleConfirmDeletion}
                >
                  Confirm & Delete Everything
                </Button>
              </div>
            )
          ) : requestSent ? (
            /* Request Sent Confirmation */
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                <Mail className="h-7 w-7" />
              </div>
              <h1 className="text-xl font-extrabold text-ink">Confirmation Link Sent</h1>
              <p className="text-xs text-subtle leading-relaxed">
                If an account exists for <strong className="text-ink">{email}</strong>, we have dispatched a secure deletion confirmation link. Please check your inbox and click the link to confirm permanent deletion.
              </p>
              <p className="text-[11px] text-muted">The link remains active for 30 minutes.</p>
            </div>
          ) : (
            /* Public Request Form (Google Play compliance) */
            <form onSubmit={handleRequestDeletion} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-lg font-extrabold text-ink">Request Account Deletion</h1>
                  <p className="text-xs text-subtle">Google Play Store & User Rights Portal</p>
                </div>
              </div>

              <p className="text-xs text-subtle leading-relaxed">
                Enter your registered BillNow email address below. We will send a secure one-time verification link to confirm ownership before permanently erasing your account and associated documents.
              </p>

              {requestError && (
                <p className="rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 text-xs font-medium text-rose-600 dark:text-rose-400">
                  {requestError}
                </p>
              )}

              <Input
                label="Registered Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />

              <Button
                type="submit"
                variant="danger"
                className="w-full justify-center"
                loading={requesting}
              >
                Send Deletion Confirmation Link
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeleteAccountPage;
