import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { todayISO } from '../lib/format.js';
import { useT } from '../settings.jsx';
import { IconCheck } from '../components/icons.jsx';

const num = (v) => parseFloat(String(v).replace(',', '.'));
const STATUSES = ['pending', 'won', 'lost', 'void'];

export default function AddBet() {
  const t = useT();
  const [event, setEvent] = useState('');
  const [sport, setSport] = useState('');
  const [market, setMarket] = useState('');
  const [placedAt, setPlacedAt] = useState(todayISO());
  const [stake, setStake] = useState('');
  const [status, setStatus] = useState('pending');
  const [profit, setProfit] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const isVoid = status === 'void';
  const settled = status === 'won' || status === 'lost';

  async function save() {
    setError('');
    if (!event.trim()) { setError(t('add.needEvent')); return; }
    const totalStake = num(stake) || 0;
    if (!(totalStake > 0)) { setError(t('add.needStake')); return; }

    const p = isVoid ? 0 : (num(profit) || 0);
    const payload = {
      event: event.trim(),
      sport: sport.trim() || null,
      market: market.trim() || null,
      legs: [],
      total_stake: totalStake,
      expected_profit: p,
      placed_at: placedAt,
      status,
      notes: notes.trim() || null,
    };
    if (settled) payload.actual_profit = p;
    if (isVoid) payload.actual_profit = 0;

    setSaving(true);
    try {
      await api.createBet(payload);
      setSaved(true);
      setEvent(''); setSport(''); setMarket(''); setStake(''); setProfit(''); setNotes('');
      setStatus('pending'); setPlacedAt(todayISO());
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack" style={{ maxWidth: 620, margin: '0 auto', width: '100%' }}>
      <div className="panel">
        <div className="panel__head"><h2>{t('add.title')}</h2></div>
        <div className="panel__body stack">
          {error && <div className="alert alert--error">{error}</div>}
          {saved && (
            <div className="alert alert--ok">
              {t('add.saved')} <Link to="/apuestas">{t('add.seeBets')}</Link>
            </div>
          )}

          <div className="field">
            <label>{t('add.event')}</label>
            <input className="input" placeholder={t('add.eventPh')} value={event}
              onChange={(e) => { setEvent(e.target.value); setSaved(false); }} />
          </div>

          <div className="row" style={{ gap: 16 }}>
            <div className="field grow">
              <label>{t('add.sport')}</label>
              <input className="input" value={sport} onChange={(e) => setSport(e.target.value)} placeholder="Fútbol, Tenis…" />
            </div>
            <div className="field grow">
              <label>{t('add.date')}</label>
              <input className="input" type="date" value={placedAt} onChange={(e) => setPlacedAt(e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label>{t('add.market')}</label>
            <input className="input" placeholder={t('add.marketPh')} value={market} onChange={(e) => setMarket(e.target.value)} />
          </div>

          <div className="field">
            <label>{t('add.status')}</label>
            <div className="segmented">
              {STATUSES.map((s) => (
                <button key={s} className={status === s ? 'active' : ''} onClick={() => setStatus(s)}>{t(`st.${s}`)}</button>
              ))}
            </div>
          </div>

          <div className="row" style={{ gap: 16 }}>
            <div className="field grow">
              <label>{t('add.stake')}</label>
              <input className="input num" inputMode="decimal" placeholder="100" value={stake}
                onChange={(e) => { setStake(e.target.value); setSaved(false); }} />
            </div>
            <div className="field grow">
              <label>{t('add.profit')}</label>
              <input className="input num" inputMode="decimal" placeholder={isVoid ? '0' : '12.50'} value={isVoid ? '0' : profit}
                disabled={isVoid} onChange={(e) => { setProfit(e.target.value); setSaved(false); }} />
            </div>
          </div>
          {!isVoid && (
            <div className="field__hint muted" style={{ fontSize: '0.8rem', marginTop: -6 }}>
              {settled ? t('add.profitHintSettled') : t('add.profitHintPending')}
            </div>
          )}

          <div className="field">
            <label>{t('add.notes')}</label>
            <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <button className="btn btn--primary" onClick={save} disabled={saving}>
            <IconCheck size={16} /> {saving ? t('add.saving') : t('add.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
