import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { getErrorMessage, TOKEN_KEY } from '../api/axios.js';
import { AuthCard, Field, SubmitButton } from '../components/AuthForm.jsx';

export default function ResetPassword() {
  const { token } = useParams();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.confirm !== form.password) errs.confirm = 'Passwords do not match';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password: form.password });
      localStorage.setItem(TOKEN_KEY, data.token);
      toast.success('Password updated. Logging you in…');
      window.location.assign('/'); // full reload so AuthContext picks up the new session
    } catch (err) {
      toast.error(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Set a new password"
      subtitle="Choose a strong password you haven't used before."
      footer={<Link to="/forgot-password" className="font-semibold text-brand-600 hover:underline">Need a new link?</Link>}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="New password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={onChange} error={errors.password} />
        <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={onChange} error={errors.confirm} />
        <SubmitButton loading={loading}>Update password</SubmitButton>
      </form>
    </AuthCard>
  );
}
