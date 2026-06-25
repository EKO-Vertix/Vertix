import { useEffect, useState } from 'react';
import { useSettings, useT, ADMIN_EMAIL } from '../settings.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { api } from '../api.js';
import { money, localeFor } from '../lib/format.js';
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

  const isAdmin = (user?.email || '').toLowerCase() === ADMIN_EMAIL;
  const [stats, setStats] = useState(null);
  const [adminErr, setAdminErr] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    api.adminStats().then(setStats).catch(() => setAdminErr(true));
  }, [isAdmin]);

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

      {isAdmin && (
        <div className="panel">
          <div className="panel__head">
            <h2>{t('admin.title')}</h2>
            <span className="muted" style={{ fontSize: '0.8rem' }}>{t('admin.sub')}</span>
          </div>
          <div className="panel__body stack stack--lg">
            {adminErr ? (
              <div className="alert alert--error">{t('admin.error')}</div>
            ) : !stats ? (
              <div className="muted">…</div>
            ) : (
              <>
                <div className="admin-stats">
                  <div className="admin-stat">
                    <div className="admin-stat__n">{stats.users}</div>
                    <div className="admin-stat__l">{t('admin.users')}</div>
                  </div>
                  <div className="admin-stat">
                    <div className="admin-stat__n">{stats.bets}</div>
                    <div className="admin-stat__l">{t('admin.bets')}</div>
                  </div>
                  <div className="admin-stat">
                    <div className="admin-stat__n">{money(stats.totalStaked)}</div>
                    <div className="admin-stat__l">{t('admin.staked')}</div>
                  </div>
                </div>

                <div>
                  <div className="set-row__title" style={{ marginBottom: 10 }}>{t('admin.recent')}</div>
                  {stats.recentUsers.length ? (
                    <div className="stack" style={{ gap: 8 }}>
                      {stats.recentUsers.map((u) => (
                        <div className="admin-user" key={u.id}>
                          <div className="admin-user__avatar">{(u.name || u.email || '?').trim().slice(0, 1).toUpperCase()}</div>
                          <div className="grow">
                            <div className="admin-user__name">{u.name || '—'}</div>
                            <div className="admin-user__email">{u.email}</div>
                          </div>
                          <div className="admin-user__date">
                            {new Date(u.created_at).toLocaleDateString(localeFor(lang), { day: '2-digit', month: 'short' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="muted">{t('admin.none')}</div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
