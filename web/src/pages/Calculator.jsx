import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { calcArbitrage } from '../lib/arb.js';
import { money, pct, todayISO } from '../lib/format.js';
import { useT, useSettings } from '../settings.jsx';
import { IconPlus, IconTrash, IconBolt, IconCheck } from '../components/icons.jsx';

const num = (v) => parseFloat(String(v).replace(',', '.'));

const SPORTS = [
  { v: 'Fútbol', en: 'Football' }, { v: 'Tenis', en: 'Tennis' }, { v: 'Baloncesto', en: 'Basketball' },
  { v: 'F1', en: 'F1' }, { v: 'Béisbol', en: 'Baseball' }, { v: 'Hockey', en: 'Hockey' },
  { v: 'eSports', en: 'eSports' }, { v: 'Otro', en: 'Other' },
];

export default function Calculator() {
  const t = useT();
  const { lang } = useSettings();
  const [legs, setLegs] = useState([
    { bookmaker: '', outcome: '', odds: '' },
    { bookmaker: '', outcome: '', odds: '' },
  ]);
  const [totalStake, setTotalStake] = useState('100');
  const [rounding, setRounding] = useState('0');

  const [event, setEvent] = useState('');
  const [sport, setSport] = useState('Fútbol');
  const [market, setMarket] = useState('');
  const [placedAt, setPlacedAt] = useState(todayISO());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const decimals = legs.map((l) => num(l.odds));
  const allValid = decimals.length >= 2 && decimals.every((o) => o > 1);

  const calc = useMemo(
    () => (allValid ? calcArbitrage(decimals, num(totalStake) || 0, { round: Number(rounding) }) : null),
    [JSON.stringify(decimals), totalStake, rounding, allValid]
  );

  function setLeg(i, patch) {
    setLegs((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
    setSaved(false);
  }
  function addLeg() {
    setLegs((prev) => [...prev, { bookmaker: '', outcome: '', odds: '' }]);
  }
  function removeLeg(i) {
    setLegs((prev) => (prev.length > 2 ? prev.filter((_, idx) => idx !== i) : prev));
  }

  async function save() {
    if (!calc) return;
    setError('');
    if (!event.trim()) {
      setError(t('calc.needEvent'));
      return;
    }
    setSaving(true);
    try {
      const betLegs = legs.map((l, i) => ({
        bookmaker: l.bookmaker || `${t('calc.house')} ${i + 1}`,
        outcome: l.outcome || `${t('calc.outcome')} ${i + 1}`,
        odds: decimals[i],
        stake: calc.stakes[i],
      }));
      await api.createBet({
        event: event.trim(),
        sport,
        market: market.trim() || null,
        legs: betLegs,
        total_stake: calc.totalStake,
        expected_profit: calc.guaranteedProfit,
        profit_pct: calc.profitPctRealized,
        placed_at: placedAt,
        status: 'pending',
      });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const isArb = calc?.isArb;
  const sportLabel = (s) => (lang === 'en' ? s.en : s.v);

  return (
    <div className="calc-grid">
      {/* ---- Entradas ---- */}
      <div className="stack">
        <div className="panel">
          <div className="panel__head">
            <h2>{t('calc.title')}</h2>
            <span className="muted" style={{ fontSize: '0.8rem' }}>{t('calc.decimal')}</span>
          </div>
          <div className="panel__body stack">
            <div className="row" style={{ gap: 16 }}>
              <div className="field grow">
                <label>{t('calc.totalStake')}</label>
                <input className="input num" inputMode="decimal" value={totalStake}
                  onChange={(e) => { setTotalStake(e.target.value); setSaved(false); }} placeholder="100" />
              </div>
              <div className="field grow">
                <label>{t('calc.rounding')}</label>
                <select className="select" value={rounding} onChange={(e) => setRounding(e.target.value)}>
                  <option value="0">{t('calc.noRound')}</option>
                  <option value="1">{t('calc.roundTo')} 1</option>
                  <option value="5">{t('calc.roundTo')} 5</option>
                  <option value="10">{t('calc.roundTo')} 10</option>
                </select>
              </div>
            </div>

            <div>
              <div className="leg-row" style={{ marginBottom: 6 }}>
                <span className="section-title">{t('calc.bookmaker')}</span>
                <span className="section-title">{t('calc.outcome')}</span>
                <span className="section-title" style={{ textAlign: 'right' }}>{t('calc.odds')}</span>
                <span />
              </div>
              {legs.map((l, i) => (
                <div className="leg-row" key={i}>
                  <input className="input" placeholder={`${t('calc.house')} ${i + 1}`} value={l.bookmaker}
                    onChange={(e) => setLeg(i, { bookmaker: e.target.value })} />
                  <input className="input" placeholder={t('calc.outcome')} value={l.outcome}
                    onChange={(e) => setLeg(i, { outcome: e.target.value })} />
                  <input className="input num" inputMode="decimal" placeholder="2.10"
                    value={l.odds} onChange={(e) => setLeg(i, { odds: e.target.value })} />
                  <button className="btn btn--icon btn--ghost" onClick={() => removeLeg(i)}
                    disabled={legs.length <= 2} title={t('bets.delete')}>
                    <IconTrash size={15} />
                  </button>
                </div>
              ))}
              <button className="btn btn--ghost btn--sm" style={{ marginTop: 12 }} onClick={addLeg}>
                <IconPlus size={15} /> {t('calc.addOutcome')}
              </button>
            </div>
          </div>
        </div>

        {/* ---- Guardar ---- */}
        <div className="panel">
          <div className="panel__head"><h2>{t('calc.register')}</h2></div>
          <div className="panel__body stack">
            {error && <div className="alert alert--error">{error}</div>}
            {saved && (
              <div className="alert alert--ok">
                {t('calc.saved')} <Link to="/apuestas">{t('calc.seeInBets')}</Link>
              </div>
            )}
            <div className="field">
              <label>{t('calc.event')}</label>
              <input className="input" placeholder={t('calc.eventPh')} value={event}
                onChange={(e) => { setEvent(e.target.value); setSaved(false); }} />
            </div>
            <div className="row" style={{ gap: 16 }}>
              <div className="field grow">
                <label>{t('calc.sport')}</label>
                <select className="select" value={sport} onChange={(e) => setSport(e.target.value)}>
                  {SPORTS.map((s) => <option key={s.v} value={s.v}>{sportLabel(s)}</option>)}
                </select>
              </div>
              <div className="field grow">
                <label>{t('calc.market')}</label>
                <input className="input" placeholder={t('calc.marketPh')} value={market}
                  onChange={(e) => setMarket(e.target.value)} />
              </div>
              <div className="field grow">
                <label>{t('calc.date')}</label>
                <input className="input" type="date" value={placedAt} onChange={(e) => setPlacedAt(e.target.value)} />
              </div>
            </div>
            <button className="btn btn--primary" onClick={save} disabled={!calc || saving}>
              <IconCheck size={16} /> {saving ? t('calc.saving') : t('calc.save')}
            </button>
          </div>
        </div>
      </div>

      {/* ---- Resultados ---- */}
      <div className="panel" style={{ position: 'sticky', top: 88 }}>
        <div className="panel__head">
          <h2>{t('calc.result')}</h2>
          {calc && (
            <span className={`badge ${isArb ? 'badge--profit' : 'badge--loss'}`}>
              {isArb ? <><IconBolt size={13} /> {t('calc.surebet')}</> : t('calc.noArb')}
            </span>
          )}
        </div>

        {!calc ? (
          <div className="empty">
            <IconBolt />
            <h3>{t('calc.introTitle')}</h3>
            <p>{t('calc.introText')}</p>
          </div>
        ) : (
          <>
            <div className="result-big">
              <div className={`result-big__pct ${isArb ? 'value-profit' : 'value-loss'}`}>
                {pct(calc.profitPctRealized, { sign: true })}
              </div>
              <div className="result-big__label">
                {isArb
                  ? <>{t('calc.guaranteed')} <strong className="value-profit">{money(calc.guaranteedProfit, { sign: true })}</strong></>
                  : t('calc.noProfit')}
              </div>
            </div>

            <div className="panel__body">
              {legs.map((l, i) => (
                <div className="payout-row" key={i}>
                  <div>
                    <div className="payout-row__book">{l.bookmaker || `${t('calc.house')} ${i + 1}`}</div>
                    <div className="payout-row__out">{l.outcome || `${t('calc.outcome')} ${i + 1}`} · {t('calc.odds')} {decimals[i]?.toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="cell-strong num">{money(calc.stakes[i])}</div>
                    <div className="cell-sub num">{t('calc.return')} {money(calc.payouts[i])}</div>
                  </div>
                </div>
              ))}

              <div className="payout-row">
                <span className="muted">{t('calc.totalStake')}</span>
                <span className="cell-strong num">{money(calc.totalStake)}</span>
              </div>
              <div className="payout-row">
                <span className="muted">{t('calc.guaranteedShort')}</span>
                <span className={`cell-strong ${isArb ? 'value-profit' : 'value-loss'}`}>{money(calc.guaranteedProfit, { sign: true })}</span>
              </div>
              <div className="payout-row">
                <span className="muted">{t('calc.impliedSum')}</span>
                <span className="num">{calc.arbPercent.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
