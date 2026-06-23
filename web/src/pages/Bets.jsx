import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import BetsTable from '../components/BetsTable.jsx';
import { IconInbox, IconPlus } from '../components/icons.jsx';
import { useT } from '../settings.jsx';

const FILTERS = [
  { key: '', label: 'bets.all' },
  { key: 'pending', label: 'bets.pending' },
  { key: 'won', label: 'bets.won' },
  { key: 'lost', label: 'bets.lost' },
  { key: 'void', label: 'bets.void' },
];

export default function Bets() {
  const t = useT();
  const [filter, setFilter] = useState('');
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.listBets(filter ? { status: filter } : {})
      .then((r) => setBets(r.bets))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function mark(bet, status) {
    const patch = { status };
    if (status === 'lost') {
      const v = window.prompt(t('bets.lostPrompt'), '0');
      if (v === null) return;
      patch.actual_profit = parseFloat(String(v).replace(',', '.')) || 0;
    }
    await api.updateBet(bet.id, patch);
    load();
  }

  async function remove(bet) {
    if (!window.confirm(`${t('bets.delPrompt')} "${bet.event}"?`)) return;
    await api.deleteBet(bet.id);
    load();
  }

  return (
    <div className="stack stack--lg">
      <div className="row row--between row--wrap" style={{ gap: 12 }}>
        <div className="segmented">
          {FILTERS.map((f) => (
            <button key={f.key} className={filter === f.key ? 'active' : ''} onClick={() => setFilter(f.key)}>
              {t(f.label)}
            </button>
          ))}
        </div>
        <Link to="/calculadora" className="btn btn--primary"><IconPlus size={16} /> {t('action.newSurebet')}</Link>
      </div>

      <div className="panel">
        <div className="panel__body--flush">
          {loading ? (
            <div className="empty"><p>{t('bets.loading')}</p></div>
          ) : bets.length ? (
            <BetsTable bets={bets} onMark={mark} onDelete={remove} />
          ) : (
            <div className="empty">
              <IconInbox />
              <h3>{t('bets.emptyTitle')} {filter && t('bets.emptyFilter')}</h3>
              <p>{t('bets.emptyText')}</p>
              <Link to="/calculadora" className="btn btn--primary" style={{ marginTop: 16 }}>{t('bets.create')}</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
