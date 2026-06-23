import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { Brand } from '../components/Layout.jsx';
import { useT } from '../settings.jsx';

export default function Login() {
  const t = useT();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth__card panel">
        <div className="panel__body">
          <div className="auth__brand"><Brand /></div>
          <h2 className="auth__title">{t('auth.loginTitle')}</h2>
          <p className="auth__sub">{t('auth.loginSub')}</p>
          <form className="stack" onSubmit={onSubmit}>
            {error && <div className="alert alert--error">{error}</div>}
            <div className="field">
              <label htmlFor="email">{t('auth.email')}</label>
              <input id="email" className="input" type="email" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@email.com" />
            </div>
            <div className="field">
              <label htmlFor="pw">{t('auth.password')}</label>
              <input id="pw" className="input" type="password" autoComplete="current-password" required
                value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button className="btn btn--primary btn--block" disabled={busy}>
              {busy ? t('auth.entering') : t('auth.enter')}
            </button>
          </form>
          <p className="auth__alt">{t('auth.noAccount')} <Link to="/register">{t('auth.signup')}</Link></p>
          <p className="auth__alt faint" style={{ marginTop: 8, fontSize: '0.78rem' }}>
            Demo: demo@surebets.app / demo1234
          </p>
        </div>
      </div>
    </div>
  );
}
