import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PageFrame from '../components/ui/PageFrame';
import Panel from '../components/ui/Panel';
import PixelButton from '../components/ui/PixelButton';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <PageFrame title="Player Login" subtitle="Sync your profile and continue your run.">
      <Panel>
        <form onSubmit={onSubmit} className="form-grid">
          <input className="input" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="input" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required />
          <PixelButton type="submit">Log In</PixelButton>
        </form>
        {error && <p className="status-error">{error}</p>}
        <p>Need an account? <Link className="nav-link" to="/register">Register</Link></p>
      </Panel>
    </PageFrame>
  );
}
