import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../api/axios.js';
import { AuthCard, Field, SubmitButton } from '../components/AuthForm.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Client-side validation = fast feedback. The server validates AGAIN (never trust the browser).
  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.confirm !== form.password) errs.confirm = 'Passwords do not match';
    return errs;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      await register(form.name.trim(), form.email, form.password);
      toast.success('Account created. Welcome to Shabbir Traders!');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="It only takes a minute."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-brand-600 hover:underline">Log in</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Full name" name="name" autoComplete="name" value={form.name} onChange={onChange} error={errors.name} />
        <Field label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={onChange} error={errors.email} />
        <Field label="Password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={onChange} error={errors.password} />
        <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={onChange} error={errors.confirm} />
        <SubmitButton loading={loading}>Create account</SubmitButton>
      </form>
    </AuthCard>
  );
}
