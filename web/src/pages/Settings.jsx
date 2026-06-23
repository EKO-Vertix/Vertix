import { useSettings, useT } from '../settings.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { IconLogout } from '../components/icons.jsx';

function Row({ title, sub, children }) {
  return (
    <div className="set-row">
      <div>
        <div className="set-row__title">{title}</div>
        <div className="set-row__sub">{sub}</div>
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const { lang, setLang, theme, setTheme } = useSettings();
  const t = useT();
  const { user, logout } = useAuth();

  return (
    <div className="stack stack--lg" style={{ maxWidth: 620, margin: '0 auto', width: '100%' }}>
      <div className="panel">
        <div className="panel__head"><h2>{t('set.title')}</h2></div>
        <div className="panel__body stack stack--lg">
          <Row title={t('set.language')} sub={t('set.langSub')}>
            <div className="segmented">
              <button className={lang === 'es' ? 'active' : ''} onClick={() => setLang('es')}>{t('set.spanish')}</button>
              <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>{t('set.english')}</button>
            </div>
          </Row>

          <div className="hr" />

          <Row title={t('set.theme')} sub={t('set.themeSub')}>
            <div className="segmented">
              <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}>{t('set.dark')}</button>
              <button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}>{t('set.light')}</button>
            </div>
          </Row>
        </div>
      </div>

      <div className="panel">
        <div className="panel__head"><h2>{t('set.account')}</h2></div>
        <div className="panel__body stack">
          <Row title={user?.name || t('common.account')} sub={user?.email}>
            <button className="btn btn--ghost" onClick={logout}>
              <IconLogout size={16} /> {t('action.logout')}
            </button>
          </Row>
        </div>
      </div>
    </div>
  );
}
