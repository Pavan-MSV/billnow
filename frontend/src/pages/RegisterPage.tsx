import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, User } from 'lucide-react';

import { getErrorMessage } from '../lib/api';
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

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Full name is required.';
    if (!email.trim()) next.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Enter a valid email address.';
    if (!password) next.password = 'Password is required.';
    else if (password.length < 8) next.password = 'Password must be at least 8 characters.';
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
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        account_type: 'personal',
      });
      showToast({ variant: 'success', title: 'Account created!', message: 'Welcome to BillNow.' });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to create account. Please check your information.'));
    } finally {
      setSubmitting(false);
    }
  };

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
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && <ErrorState title="Registration failed" message={formError} className="py-4" />}

        <Input
          label="Full name"
          autoComplete="name"
          placeholder="Pavan Kumar"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors.name}
          leftIcon={<User className="h-4 w-4" />}
          required
        />

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="pavan@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
          leftIcon={<Mail className="h-4 w-4" />}
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
          placeholder="Re-enter password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          error={errors.confirm}
          required
        />

        <Button type="submit" size="lg" fullWidth loading={submitting} className="h-12 text-sm font-bold shadow-md mt-2">
          Create Account
        </Button>
      </form>
    </AuthLayout>
  );
}

export default RegisterPage;
