import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../api/axios.js';
import { AuthCard, Field, SubmitButton } from '../components/AuthForm.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const requestLink = async () => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email');
    setError('');
    requestLink();
  };

  const resend = async () => {
    if (await requestLink()) toast.success('Link sent again');
  };

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link."
      footer={<Link to="/login" className="font-semibold text-brand-600 hover:underline">← Back to log in</Link>}
    >
      {sent ? (
        <div className="rounded-lg bg-brand-50 p-4 text-sm text-brand-700">
          If <strong>{email}</strong> is registered, a reset link is on its way. It expires in 15 minutes.
          <p className="mt-3">
            Didn&apos;t get it?{' '}
            <button type="button" onClick={resend} disabled={loading} className="font-semibold underline disabled:opacity-60">
              {loading ? 'Sending…' : 'Resend link'}
            </button>
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
          <SubmitButton loading={loading}>Send reset link</SubmitButton>
        </form>
      )}
    </AuthCard>
  );
}
