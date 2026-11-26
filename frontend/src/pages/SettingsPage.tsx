import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  ChevronRight,
  Download,
  FileText,
  Globe,
  HelpCircle,
  KeyRound,
  LogOut,
  Mail,
  Moon,
  Package,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Trash2,
  User as UserIcon,
} from 'lucide-react';

import { getErrorMessage, settingsApi, dashboardApi, notificationsApi } from '../lib/api';
import { cn } from '../lib/cn';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { PasswordInput } from '../components/ui/PasswordInput';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import type { DashboardSummary, NotificationPreferences, ThemePreference } from '../types';

export function SettingsPage() {
  const { user, updateLocalUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [phone, setPhone] = useState(() => user?.phone || localStorage.getItem('billnow_user_phone') || '');

  // Modals
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showPolicy, setShowPolicy] = useState<'privacy' | 'terms' | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit Profile Form State
  const [editName, setEditName] = useState(user?.name ?? '');
  const [editEmail, setEditEmail] = useState(user?.email ?? '');
  const [editPhone, setEditPhone] = useState(user?.phone ?? phone);
  const [editPhoto, setEditPhoto] = useState(user?.profile_image ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [savingPassword, setSavingPassword] = useState(false);

  // Notification Preferences State
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences | null>(null);

  // Data states
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [sum, prefs] = await Promise.all([
        dashboardApi.summary().catch(() => null),
        notificationsApi.getPreferences().catch(() => null),
      ]);
      if (sum) setSummary(sum);
      if (prefs) setNotifPrefs(prefs);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Keep edit form in sync with current user
  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditEmail(user.email);
      setEditPhone(user.phone || '');
      setPhone(user.phone || localStorage.getItem('billnow_user_phone') || '');
      setEditPhoto(user.profile_image ?? '');
    }
  }, [user]);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim()) {
      showToast({ variant: 'error', title: 'Name and email are required' });
      return;
    }
    setSavingProfile(true);
    try {
      const updated = await settingsApi.updateProfile({
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim() || null,
        profile_image: editPhoto.trim() || null,
      });
      if (editPhone.trim()) {
        localStorage.setItem('billnow_user_phone', editPhone.trim());
      } else {
        localStorage.removeItem('billnow_user_phone');
      }
      setPhone(editPhone.trim());
      updateLocalUser(updated);
      showToast({ variant: 'success', title: 'Profile updated' });
      setShowEditProfile(false);
    } catch (err) {
      showToast({
        variant: 'error',
        title: 'Could not update profile',
        message: getErrorMessage(err, 'Please try again.'),
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!currentPassword) next.current = 'Current password is required.';
    if (!newPassword) next.new = 'New password is required.';
    else if (newPassword.length < 8) next.new = 'Password must be at least 8 characters.';
    if (confirmPassword !== newPassword) next.confirm = 'Passwords do not match.';
    setPasswordErrors(next);
    if (Object.keys(next).length > 0) return;

    setSavingPassword(true);
    try {
      await settingsApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      showToast({ variant: 'success', title: 'Password updated successfully!' });
      setShowChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast({
        variant: 'error',
        title: 'Could not change password',
        message: getErrorMessage(err, 'Check your current password and try again.'),
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleToggleTheme = () => {
    const nextTheme: ThemePreference = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    void settingsApi.updatePreferences({ theme: nextTheme }).catch(() => { });
  };

  const handleUpdateNotifPref = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!notifPrefs) return;
    const next = { ...notifPrefs, [key]: value };
    setNotifPrefs(next);
    try {
      const saved = await notificationsApi.updatePreferences(next);
      setNotifPrefs(saved);
      showToast({ variant: 'success', title: 'Notification settings updated' });
    } catch (err) {
      showToast({ variant: 'error', title: 'Failed to update preferences' });
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      await settingsApi.exportData();
      showToast({
        variant: 'success',
        title: 'Data exported',
        message: 'Your products, warranties and invoices downloaded as JSON.',
      });
    } catch (err) {
      showToast({
        variant: 'error',
        title: 'Export failed',
        message: getErrorMessage(err, 'Please try again in a moment.'),
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await settingsApi.deleteAccount();
      await logout();
      showToast({ variant: 'success', title: 'Account deleted' });
      navigate('/login', { replace: true });
    } catch (err) {
      showToast({
        variant: 'error',
        title: 'Could not delete account',
        message: getErrorMessage(err, 'Please try again in a moment.'),
      });
      setDeleting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="space-y-4 pb-12">
      {/* 18. Mobile Header: My Account */}
      <div className="pt-1">
        <h1 className="text-xl font-extrabold tracking-tight text-ink">
          My Account
        </h1>
        <p className="text-[11px] font-medium text-subtle">
          Profile, preferences & application settings
        </p>
      </div>

      {/* User Profile Card */}
      <div className="rounded-2xl border border-line/80 bg-surface p-4 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Avatar */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 font-extrabold text-xl text-white shadow-md">
            {user?.name ? user.name.slice(0, 1).toUpperCase() : <UserIcon className="h-6 w-6" />}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-base font-extrabold text-ink truncate">
              {user?.name || 'Account'}
            </h2>
            <p className="text-xs font-medium text-subtle truncate">
              {user?.email || ''}
            </p>
            {phone ? (
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span>{phone}</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setShowEditProfile(true)}
                className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 mt-0.5 flex items-center gap-1 hover:underline text-left"
              >
                <Phone className="h-3 w-3" />
                <span>+ Add mobile number</span>
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowEditProfile(true)}
          className="shrink-0 rounded-xl border border-line bg-elevated px-3 py-1.5 text-xs font-bold text-ink hover:border-brand-400 active:scale-95 transition-all"
        >
          Edit
        </button>
      </div>

      {/* 18. My BillNow Stats Cards */}
      <div className="space-y-1.5">
        <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-subtle px-1">
          My BillNow Summary
        </h3>
        <div className="grid grid-cols-4 gap-2">
          <Link
            to="/products"
            className="flex flex-col items-center justify-center rounded-2xl border border-line bg-surface p-2.5 text-center shadow-sm active:scale-95 transition-all"
          >
            <Package className="h-4 w-4 text-brand-600 mb-1" />
            <span className="text-sm font-black text-ink">{summary?.total_products ?? 0}</span>
            <span className="text-[9px] font-medium text-subtle">Products</span>
          </Link>

          <Link
            to="/products?warranty_status=active"
            className="flex flex-col items-center justify-center rounded-2xl border border-line bg-surface p-2.5 text-center shadow-sm active:scale-95 transition-all"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-600 mb-1" />
            <span className="text-sm font-black text-emerald-600">{summary?.active_warranties ?? 0}</span>
            <span className="text-[9px] font-medium text-subtle">Active</span>
          </Link>

          <Link
            to="/notifications"
            className="flex flex-col items-center justify-center rounded-2xl border border-line bg-surface p-2.5 text-center shadow-sm active:scale-95 transition-all"
          >
            <ShieldAlert className="h-4 w-4 text-amber-600 mb-1" />
            <span className="text-sm font-black text-amber-600">{summary?.expiring_soon ?? 0}</span>
            <span className="text-[9px] font-medium text-subtle">Expiring</span>
          </Link>

          <Link
            to="/products"
            className="flex flex-col items-center justify-center rounded-2xl border border-line bg-surface p-2.5 text-center shadow-sm active:scale-95 transition-all"
          >
            <FileText className="h-4 w-4 text-purple-600 mb-1" />
            <span className="text-sm font-black text-purple-600">{summary?.total_products ?? 0}</span>
            <span className="text-[9px] font-medium text-subtle">Invoices</span>
          </Link>
        </div>
      </div>

      {/* 18. Account & Personal Info Menu */}
      <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-sm">
        <div className="px-4 py-2.5 border-b border-line/60 bg-elevated/40">
          <span className="text-[10px] font-bold uppercase tracking-wider text-subtle">
            Account Details
          </span>
        </div>

        <div className="divide-y divide-line/60">
          <button
            type="button"
            onClick={() => setShowEditProfile(true)}
            className="w-full flex items-center justify-between p-3.5 text-left hover:bg-elevated/50 active:bg-elevated transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                <UserIcon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-ink">Personal Information</p>
                <p className="text-[11px] text-subtle">Name, photo & phone number</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-subtle/70" />
          </button>

          <button
            type="button"
            onClick={() => setShowChangePassword(true)}
            className="w-full flex items-center justify-between p-3.5 text-left hover:bg-elevated/50 active:bg-elevated transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                <KeyRound className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-ink">Change Password</p>
                <p className="text-[11px] text-subtle">Update your sign-in password</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-subtle/70" />
          </button>
        </div>
      </div>

      {/* 18. Preferences Section */}
      <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-sm">
        <div className="px-4 py-2.5 border-b border-line/60 bg-elevated/40">
          <span className="text-[10px] font-bold uppercase tracking-wider text-subtle">
            Preferences
          </span>
        </div>

        <div className="divide-y divide-line/60">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between p-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </span>
              <div>
                <p className="text-xs font-bold text-ink">Theme (Dark / Light)</p>
                <p className="text-[11px] text-subtle">
                  {theme === 'dark' ? 'OLED Dark Mode active' : 'Clean Light Mode active'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleTheme}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                theme === 'dark' ? 'bg-brand-600' : 'bg-slate-300'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          {/* Notification Settings */}
          <button
            type="button"
            onClick={() => setShowNotificationSettings(true)}
            className="w-full flex items-center justify-between p-3.5 text-left hover:bg-elevated/50 active:bg-elevated transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                <Bell className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-ink">Notification Settings</p>
                <p className="text-[11px] text-subtle">Reminders: 30d, 7d, 1d before expiry</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-subtle/70" />
          </button>

          {/* Language Selector */}
          <div className="flex items-center justify-between p-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400">
                <Globe className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-ink">Language</p>
                <p className="text-[11px] text-subtle">Application display language</p>
              </div>
            </div>
            <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
              English (IN)
            </span>
          </div>
        </div>
      </div>

      {/* 18. Data & Privacy */}
      <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-sm">
        <div className="px-4 py-2.5 border-b border-line/60 bg-elevated/40">
          <span className="text-[10px] font-bold uppercase tracking-wider text-subtle">
            Data & Security
          </span>
        </div>

        <div className="divide-y divide-line/60">
          <button
            type="button"
            onClick={handleExportData}
            disabled={exporting}
            className="w-full flex items-center justify-between p-3.5 text-left hover:bg-elevated/50 active:bg-elevated transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400">
                <Download className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-ink">Export My Data</p>
                <p className="text-[11px] text-subtle">Download all your records as JSON</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-subtle">
              {exporting ? 'Exporting...' : 'Export'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-between p-3.5 text-left hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                <Trash2 className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400">Delete Account</p>
                <p className="text-[11px] text-subtle">Permanently remove account and data</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-rose-400" />
          </button>
        </div>
      </div>

      {/* 18. Support & Legal */}
      <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-sm">
        <div className="px-4 py-2.5 border-b border-line/60 bg-elevated/40">
          <span className="text-[10px] font-bold uppercase tracking-wider text-subtle">
            Support & Legal
          </span>
        </div>

        <div className="divide-y divide-line/60">
          <button
            type="button"
            onClick={() => setShowHelpCenter(true)}
            className="w-full flex items-center justify-between p-3.5 text-left hover:bg-elevated/50 active:bg-elevated transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400">
                <HelpCircle className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-ink">Help Center & Support</p>
                <p className="text-[11px] text-subtle">FAQs, contact support & guides</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-subtle/70" />
          </button>

          <button
            type="button"
            onClick={() => setShowPolicy('privacy')}
            className="w-full flex items-center justify-between p-3.5 text-left hover:bg-elevated/50 active:bg-elevated transition-colors"
          >
            <span className="text-xs font-medium text-ink pl-11">Privacy Policy</span>
            <ChevronRight className="h-4 w-4 text-subtle/70" />
          </button>

          <button
            type="button"
            onClick={() => setShowPolicy('terms')}
            className="w-full flex items-center justify-between p-3.5 text-left hover:bg-elevated/50 active:bg-elevated transition-colors"
          >
            <span className="text-xs font-medium text-ink pl-11">Terms & Conditions</span>
            <ChevronRight className="h-4 w-4 text-subtle/70" />
          </button>
        </div>
      </div>

      {/* 18. Logout Button at Bottom */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-600 hover:bg-rose-100 active:scale-95 transition-all dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-400 shadow-sm"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>

        <p className="text-center text-[10px] text-subtle/70 mt-3 font-medium">
          BillNow v1.0.0 · Never Forget a Warranty Again.
        </p>
      </div>

      {/* 19. Profile Edit Modal */}
      <Modal
        open={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        title="Personal Information"
      >
        <form onSubmit={handleSaveProfile} className="space-y-3.5 pt-2">
          <Input
            label="Full Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
            leftIcon={<UserIcon className="h-4 w-4" />}
          />
          <Input
            label="Email"
            type="email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            required
            leftIcon={<Mail className="h-4 w-4" />}
          />
          <Input
            label="Phone Number"
            type="tel"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
            placeholder="+91 98765 43210"
            leftIcon={<Phone className="h-4 w-4" />}
          />

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowEditProfile(false)}
              className="flex-1 rounded-xl border border-line py-2.5 text-xs font-bold text-subtle hover:text-ink"
            >
              Cancel
            </button>
            <Button
              type="submit"
              loading={savingProfile}
              className="flex-1 text-xs font-bold"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        title="Change Password"
      >
        <form onSubmit={handleChangePassword} className="space-y-3.5 pt-2">
          <PasswordInput
            label="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            error={passwordErrors.current}
            required
          />
          <PasswordInput
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={passwordErrors.new}
            placeholder="Min 8 characters"
            required
          />
          <PasswordInput
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={passwordErrors.confirm}
            required
          />

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowChangePassword(false)}
              className="flex-1 rounded-xl border border-line py-2.5 text-xs font-bold text-subtle hover:text-ink"
            >
              Cancel
            </button>
            <Button
              type="submit"
              loading={savingPassword}
              className="flex-1 text-xs font-bold"
            >
              Save Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* Notification Settings Modal */}
      <Modal
        open={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
        title="Notification Settings"
      >
        <div className="space-y-3 pt-2">
          <p className="text-xs text-subtle">
            Choose when BillNow alerts you about upcoming warranty expirations.
          </p>

          <div className="space-y-2 divide-y divide-line/60">
            {[
              { key: 'reminder_90_days', label: '90 days before expiry' },
              { key: 'reminder_60_days', label: '60 days before expiry' },
              { key: 'reminder_30_days', label: '30 days before expiry' },
              { key: 'reminder_7_days', label: '7 days before expiry' },
              { key: 'reminder_1_day', label: '1 day before expiry (Tomorrow)' },
            ].map((r) => {
              const checked = notifPrefs ? (notifPrefs as any)[r.key] : true;
              return (
                <div key={r.key} className="flex items-center justify-between pt-2">
                  <span className="text-xs font-medium text-ink">{r.label}</span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => handleUpdateNotifPref(r.key as any, e.target.checked)}
                    className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500"
                  />
                </div>
              );
            })}
          </div>

          <div className="pt-3">
            <button
              type="button"
              onClick={() => setShowNotificationSettings(false)}
              className="w-full rounded-xl bg-brand-600 py-2.5 text-xs font-bold text-white shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* Help Center Modal */}
      <Modal
        open={showHelpCenter}
        onClose={() => setShowHelpCenter(false)}
        title="Help Center & Support"
      >
        <div className="space-y-3.5 pt-2 text-xs">
          <div className="rounded-xl border border-line bg-elevated/40 p-3 space-y-1">
            <p className="font-bold text-ink">Need assistance?</p>
            <p className="text-subtle">Contact our dedicated support team directly:</p>
            <a
              href="mailto:support@billnow.app"
              className="font-bold text-brand-600 underline block mt-1"
            >
              support@billnow.app
            </a>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-ink uppercase tracking-wider text-[10px]">
              Frequently Asked Questions
            </p>
            <div className="space-y-2">
              <div className="rounded-xl border border-line p-2.5">
                <p className="font-semibold text-ink">How do warranty alerts work?</p>
                <p className="text-subtle mt-0.5">
                  BillNow calculates remaining days automatically and notifies you at 30, 7, and 1 day milestones before expiration.
                </p>
              </div>
              <div className="rounded-xl border border-line p-2.5">
                <p className="font-semibold text-ink">Are my invoices private?</p>
                <p className="text-subtle mt-0.5">
                  Yes, every uploaded invoice is stored in private authenticated storage and accessible only by you.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowHelpCenter(false)}
            className="w-full rounded-xl bg-brand-600 py-2.5 text-xs font-bold text-white shadow-sm mt-2"
          >
            Close
          </button>
        </div>
      </Modal>

      {/* Privacy Policy / Terms Modal */}
      <Modal
        open={showPolicy !== null}
        onClose={() => setShowPolicy(null)}
        title={showPolicy === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}
      >
        <div className="space-y-3 pt-2 text-xs text-subtle leading-relaxed max-h-[60vh] overflow-y-auto">
          {showPolicy === 'privacy' ? (
            <>
              <p>
                BillNow is committed to protecting your privacy. Your personal information, product serial numbers, invoices, and service records are securely encrypted and never sold to third parties.
              </p>
              <p>
                We only use your contact details to provide warranty notifications, service reminders, and authentication security.
              </p>
            </>
          ) : (
            <>
              <p>
                By using BillNow, you agree to store product warranties, receipts, and service logs responsibly. BillNow is a utility tracking application designed to help consumers manage warranty timelines.
              </p>
              <p>
                Manufacturer warranty terms remain subject to their original vendor and manufacturer policies.
              </p>
            </>
          )}

          <button
            type="button"
            onClick={() => setShowPolicy(null)}
            className="w-full rounded-xl bg-brand-600 py-2.5 text-xs font-bold text-white shadow-sm mt-3"
          >
            Close
          </button>
        </div>
      </Modal>

      {/* Delete Account Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Your Account?"
        description="This will permanently delete your account, all tracked products, warranty records, service history, and uploaded invoices. This action cannot be reversed."
        confirmLabel="Delete Account"
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteConfirm(false)}
        loading={deleting}
      />
    </div>
  );
}

export default SettingsPage;
