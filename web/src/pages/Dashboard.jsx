import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import BetsTable from '../components/BetsTable.jsx';
import { money, pct, pnlClass } from '../lib/format.js';
import { useT, useSettings, MONTHS } from '../settings.jsx';
import {
  IconWallet, IconTrendUp, IconTarget, IconClock, IconList, IconBolt,
} from '../components/icons.jsx';

function lastSixMonths() {
  const out = [];
  const d = new Date();
  for (let i = 5; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push({ key: `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`, m: x.getMonth() });
  }
  return out;
}

export default function Dashboard() {
  const t = useT();
  const { lang } = useSettings();
  const [summary, setSummary] = useState(null);
  const [bars, setBars] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const year = new Date().getFullYear();
    Promise.all([
      api.summary(),
      api.monthly(year),
      api.monthly(year - 1),
      api.listBets(),
    ]).then(([sum, m1, m0, betsRes]) => {
      setSummary(sum);
      const map = {};
      [...m0.months, ...m1.months].forEach((m) => { map[m.month] = m.profit; });
      setBars(lastSixMonths().map((m) => ({ ...m, profit: map[m.key] || 0 })));
      setRecent(betsRes.bets.slice(0, 6));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="muted">{t('dash.loading')}</div>;

  if (summary && summary.count === 0) {
    return (
      <div className="panel">
        <div className="empty">
          <IconBolt />
          <h3>{t('dash.emptyTitle')}</h3>
          <p>{t('dash.emptyText')}</p>
          <Link to="/calculadora" className="btn btn--primary" style={{ marginTop: 16 }}>{t('dash.openCalc')}</Link>
        </div>
      </div>
    );
  }

  const maxBar = Math.max(1, ...bars.map((b) => Math.abs(b.profit)));
  const month = MONTHS[lang][new Date().getMonth()];

  return (
    <div className="stack stack--lg">
      <div className="panel overview">
        <div className="overview__item">
          <div className="overview__label"><IconWallet size={15} /> {t('dash.totalProfit')}</div>
          <div className={`overview__value ${pnlClass(summary.totalProfit)}`}>{money(summary.totalProfit, { sign: true })}</div>
          <div className="overview__sub">{summary.count} {summary.count !== 1 ? t('dash.bets') : t('dash.bet')}</div>
        </div>
        <div className="overview__item">
          <div className="overview__label"><IconTrendUp size={15} /> {t('dash.thisMonth')}</div>
          <div className={`overview__value ${pnlClass(summary.monthProfit)}`}>{money(summary.monthProfit, { sign: true })}</div>
          <div className="overview__sub">{month}</div>
        </div>
        <div className="overview__item">
          <div className="overview__label"><IconTarget size={15} /> {t('dash.roi')}</div>
          <div className={`overview__value ${pnlClass(summary.roi)}`}>{pct(summary.roi, { sign: true })}</div>
          <div className="overview__sub">{t('dash.over')} {money(summary.totalStaked)}</div>
        </div>
        <div className="overview__item">
          <div className="overview__label"><IconClock size={15} /> {t('dash.pending')}</div>
          <div className="overview__value">{summary.pending}</div>
          <div className="overview__sub">{t('dash.unsettled')}</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel__head"><h2>{t('dash.monthlyProfit')}</h2><span className="muted">{t('dash.last6')}</span></div>
        <div className="panel__body">
          <div className="bars">
            {bars.map((b) => (
              <div className="bars__col" key={b.key}>
                <div className={`bars__val ${pnlClass(b.profit)}`}>{b.profit ? money(b.profit) : ''}</div>
                <div className="bars__track">
                  <div className={`bars__bar ${b.profit >= 0 ? 'pos' : 'neg'}`}
                    style={{ height: `${b.profit ? Math.max(5, (Math.abs(b.profit) / maxBar) * 100) : 0}%` }} />
                </div>
                <div className="bars__label">{MONTHS[lang][b.m].slice(0, 3)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel__head">
          <h2>{t('dash.recent')}</h2>
          <Link to="/apuestas" className="btn btn--ghost btn--sm"><IconList size={15} /> {t('action.viewAll')}</Link>
        </div>
        <div className="panel__body--flush">
          {recent.length ? <BetsTable bets={recent} compact /> : <div className="empty"><p>{t('dash.noBets')}</p></div>}
        </div>
      </div>
    </div>
  );
}
