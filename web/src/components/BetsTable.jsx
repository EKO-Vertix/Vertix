import { money, pct, pnlClass, fmtDateShort, localeFor, STATUS } from '../lib/format.js';
import { useT, useSettings } from '../settings.jsx';
import { IconCheck, IconX, IconTrash } from './icons.jsx';

export function effectiveProfit(b) {
  if (b.status === 'void') return 0;
  if (b.status === 'pending') return b.expected_profit;
  return b.actual_profit != null ? b.actual_profit : b.expected_profit;
}

export default function BetsTable({ bets, compact = false, onMark, onDelete }) {
  const t = useT();
  const { lang } = useSettings();
  if (!bets.length) return null;
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>{t('bets.date')}</th>
            <th>{t('bets.event')}</th>
            <th className="right">{t('bets.stake')}</th>
            <th className="right">{t('bets.profit')}</th>
            <th className="right">{t('bets.pct')}</th>
            <th>{t('bets.status')}</th>
            {!compact && <th aria-label="actions" />}
          </tr>
        </thead>
        <tbody>
          {bets.map((b) => {
            const p = effectiveProfit(b);
            const st = STATUS[b.status] || STATUS.pending;
            return (
              <tr key={b.id}>
                <td className="nowrap cell-sub">{fmtDateShort(b.placed_at, localeFor(lang))}</td>
                <td>
                  <div className="cell-strong">{b.event}</div>
                  {!compact ? (
                    <div className="row row--wrap" style={{ gap: 6, marginTop: 5 }}>
                      {(b.legs || []).map((l, i) => (
                        <span className="badge badge--muted" key={i}>
                          {l.bookmaker} · {Number(l.odds).toFixed(2)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    b.sport && <div className="cell-sub">{b.sport}</div>
                  )}
                </td>
                <td className="right num">{money(b.total_stake)}</td>
                <td className={`right ${pnlClass(p)}`}>{money(p, { sign: true })}</td>
                <td className="right num">{pct(b.profit_pct, { sign: true })}</td>
                <td><span className={`badge ${st.badge}`}><span className="dot" />{t(`st.${b.status}`)}</span></td>
                {!compact && (
                  <td className="nowrap">
                    {b.status === 'pending' ? (
                      <div className="row" style={{ gap: 6 }}>
                        <button className="btn btn--icon btn--ghost" title={t('bets.markWon')} onClick={() => onMark(b, 'won')}><IconCheck size={15} /></button>
                        <button className="btn btn--icon btn--ghost" title={t('bets.markLost')} onClick={() => onMark(b, 'lost')}><IconX size={15} /></button>
                        <button className="btn btn--icon btn--danger" title={t('bets.delete')} onClick={() => onDelete(b)}><IconTrash size={15} /></button>
                      </div>
                    ) : (
                      <div className="row" style={{ gap: 6 }}>
                        <button className="btn btn--sm btn--ghost" onClick={() => onMark(b, 'pending')}>{t('bets.reopen')}</button>
                        <button className="btn btn--icon btn--danger" title={t('bets.delete')} onClick={() => onDelete(b)}><IconTrash size={15} /></button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
