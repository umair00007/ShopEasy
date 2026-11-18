import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../api/axios.js';
import { AuthCard, Field, SubmitButton } from '../components/AuthForm.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(location.state?.from || '/', { replace: true }); // go back to the page they wanted
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to continue shopping."
      footer={<>New here? <Link to="/register" className="font-semibold text-brand-600 hover:underline">Create an account</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={onChange} error={errors.email} />
        <Field label="Password" name="password" type="password" autoComplete="current-password" value={form.password} onChange={onChange} error={errors.password} />
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:underline">Forgot password?</Link>
        </div>
        <SubmitButton loading={loading}>Log in</SubmitButton>
      </form>
    </AuthCard>
  );
}
