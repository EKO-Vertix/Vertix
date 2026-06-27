import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useT } from '../settings.jsx';
import {
  IconDashboard, IconCalculator, IconList, IconCalendar, IconSettings, IconLogout, IconPlus,
} from './icons.jsx';

const NAV = [
  { to: '/', key: 'dashboard', icon: IconDashboard, end: true },
  { to: '/calculadora', key: 'calculator', icon: IconCalculator },
  { to: '/anadir', key: 'add', icon: IconPlus },
  { to: '/apuestas', key: 'bets', icon: IconList },
  { to: '/calendario', key: 'calendar', icon: IconCalendar },
  { to: '/ajustes', key: 'settings', icon: IconSettings },
];

export function Brand() {
  return (
    <div className="brand">
      <span className="brand__mark" aria-hidden="true">
        <svg viewBox="0 0 100 100" width="30" height="30">
          <path d="M50 16 L50 32 L30 50 L20 40 Z" fill="#17a374" />
          <path d="M50 16 L80 40 L70 50 L50 32 Z" fill="#2bbd8c" />
          <path d="M50 54 L50 70 L30 88 L20 78 Z" fill="#0e7355" />
          <path d="M50 54 L80 78 L70 88 L50 70 Z" fill="#17a374" />
        </svg>
      </span>
      <div className="brand__name"><span>V</span>ertix</div>
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const t = useT();
  const location = useLocation();
  const navigate = useNavigate();
  const current = NAV.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to))) || NAV[0];
  const initials = (user?.name || user?.email || '?').trim().slice(0, 1).toUpperCase();
  const showNew = location.pathname !== '/calculadora' && location.pathname !== '/ajustes' && location.pathname !== '/anadir';

  return (
    <div className="app">
      <aside className="sidebar">
        <Brand />
        <nav className="nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className="nav__link">
              <n.icon /> <span className="label-extra">{t(`nav.${n.key}`)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__foot">
          <div className="userchip">
            <div className="userchip__avatar">{initials}</div>
            <div className="userchip__meta grow">
              <div className="userchip__name">{user?.name || t('common.account')}</div>
              <div className="userchip__email">{user?.email}</div>
            </div>
            <button className="btn btn--icon btn--ghost" title={t('action.logout')} onClick={logout}>
              <IconLogout size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar__title">
            <h1>{t(`nav.${current.key}`)}</h1>
            <small>{t(`sub.${current.key}`)}</small>
          </div>
          {showNew && (
            <button className="btn btn--primary" onClick={() => navigate('/calculadora')}>
              <IconPlus size={16} /> {t('action.newSurebet')}
            </button>
          )}
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
