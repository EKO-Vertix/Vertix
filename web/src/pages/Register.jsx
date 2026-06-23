import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { Brand } from '../components/Layout.jsx';
import { useT } from '../settings.jsx';

export default function Register() {
  const t = useT();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError(t('auth.minPass'));
      return;
    }
    setBusy(true);
    try {
      await register(email, password, name);
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
          <h2 className="auth__title">{t('auth.signupTitle')}</h2>
          <p className="auth__sub">{t('auth.signupSub')}</p>
          <form className="stack" onSubmit={onSubmit}>
            {error && <div className="alert alert--error">{error}</div>}
            <div className="field">
              <label htmlFor="name">{t('auth.name')}</label>
              <input id="name" className="input" type="text" autoComplete="name"
                value={name} onChange={(e) => setName(e.target.value)} placeholder={t('auth.name')} />
            </div>
            <div className="field">
              <label htmlFor="email">{t('auth.email')}</label>
              <input id="email" className="input" type="email" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@email.com" />
            </div>
            <div className="field">
              <label htmlFor="pw">{t('auth.password')}</label>
              <input id="pw" className="input" type="password" autoComplete="new-password" required
                value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth.minPass')} />
            </div>
            <button className="btn btn--primary btn--block" disabled={busy}>
              {busy ? t('auth.creating') : t('auth.create')}
            </button>
          </form>
          <p className="auth__alt">{t('auth.hasAccount')} <Link to="/login">{t('auth.login')}</Link></p>
        </div>
      </div>
    </div>
  );
}
