import { HeartPulse, LogIn, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    heightCm: '',
    dietaryPreference: 'balanced',
  });
  const [localError, setLocalError] = useState('');
  const { login, register, loading, error } = useAuth();
  const navigate = useNavigate();

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setLocalError('');
    try {
      if (mode === 'register') {
        await register({
          name: form.name,
          email: form.email,
          password: form.password,
          profile: {
            heightCm: Number(form.heightCm) || undefined,
            dietaryPreference: form.dietaryPreference,
          },
        });
      } else {
        await login({ email: form.email, password: form.password });
      }
      navigate('/app');
    } catch (submitError) {
      setLocalError(submitError.message);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark large">
            <HeartPulse size={28} />
          </div>
          <div>
            <p className="eyebrow">PCODCare</p>
            <h1>{mode === 'login' ? 'Sign in to your tracker' : 'Create your health tracker'}</h1>
          </div>
        </div>

        <div className="segmented">
          <button className={mode === 'login' ? 'active' : ''} type="button" onClick={() => setMode('login')}>
            <LogIn size={16} />
            Sign in
          </button>
          <button className={mode === 'register' ? 'active' : ''} type="button" onClick={() => setMode('register')}>
            <UserPlus size={16} />
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === 'register' ? (
            <label>
              Name
              <input value={form.name} onChange={(event) => update('name', event.target.value)} required />
            </label>
          ) : null}
          <label>
            Email
            <input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" minLength="8" value={form.password} onChange={(event) => update('password', event.target.value)} required />
          </label>
          {mode === 'register' ? (
            <div className="form-grid two">
              <label>
                Height (cm)
                <input type="number" min="80" max="250" value={form.heightCm} onChange={(event) => update('heightCm', event.target.value)} />
              </label>
              <label>
                Preference
                <select value={form.dietaryPreference} onChange={(event) => update('dietaryPreference', event.target.value)}>
                  <option value="balanced">Balanced</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="eggetarian">Eggetarian</option>
                  <option value="non-vegetarian">Non-vegetarian</option>
                </select>
              </label>
            </div>
          ) : null}
          {(localError || error) ? <p className="error-text">{localError || error}</p> : null}
          <button className="primary-button" type="submit" disabled={loading}>
            {mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </section>
    </main>
  );
}
