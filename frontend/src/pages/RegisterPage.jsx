import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PageFrame from '../components/ui/PageFrame';
import Panel from '../components/ui/Panel';
import PixelButton from '../components/ui/PixelButton';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', username: '' });
  const [error, setError] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <PageFrame title="Create Profile" subtitle="Join the portal and unlock arcade challenges.">
      <Panel>
        <form onSubmit={onSubmit} className="form-grid">
          <input className="input" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="input" placeholder="Username (optional)" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input className="input" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required />
          <PixelButton type="submit" variant="secondary">Create Account</PixelButton>
        </form>
        {error && <p className="status-error">{error}</p>}
        <p>Already registered? <Link className="nav-link" to="/login">Log in</Link></p>
      </Panel>
    </PageFrame>
  );
}
