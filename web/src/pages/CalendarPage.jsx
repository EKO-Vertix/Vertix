import { useEffect, useMemo, useState, useCallback } from 'react';
import { api } from '../api.js';
import { effectiveProfit } from '../components/BetsTable.jsx';
import { money, pnlClass, fmtDate, todayISO, localeFor } from '../lib/format.js';
import { useT, useSettings, MONTHS, DOW } from '../settings.jsx';
import { IconChevronLeft, IconChevronRight } from '../components/icons.jsx';

const pad = (n) => String(n).padStart(2, '0');

function tileStyle(profit, maxPos) {
  if (profit >= -0.001) {
    const t = Math.min(1, profit / maxPos);
    const L = 0.40 + t * 0.16;
    return { backgroundColor: `oklch(${L.toFixed(3)} 0.13 150)`, borderColor: `oklch(${(L + 0.12).toFixed(3)} 0.13 150)` };
  }
  return { backgroundColor: 'oklch(0.42 0.13 27)', borderColor: 'oklch(0.54 0.15 27)' };
}

function cellAmt(p) {
  return (p >= 0 ? '+' : '−') + Math.round(Math.abs(p)) + '€';
}

export default function CalendarPage() {
  const t = useT();
  const { lang } = useSettings();
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [days, setDays] = useState({});
  const [selected, setSelected] = useState(null);
  const [dayBets, setDayBets] = useState([]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const ym = `${year}-${pad(month + 1)}`;

  const loadMonth = useCallback(() => {
    api.calendar(ym).then((r) => {
      const map = {};
      r.days.forEach((d) => { map[d.date] = d; });
      setDays(map);
    });
  }, [ym]);

  useEffect(() => { loadMonth(); setSelected(null); setDayBets([]); }, [loadMonth]);

  function pickDay(dateStr) {
    setSelected(dateStr);
    api.listBets({ from: dateStr, to: dateStr }).then((r) => setDayBets(r.bets));
  }

  const weeks = useMemo(() => {
    const first = new Date(year, month, 1);
    const start = (first.getDay() + 6) % 7; // lunes = 0
    const total = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < start; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    while (cells.length % 7) cells.push(null);
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [year, month]);

  const allProfits = Object.values(days).filter((d) => d.count > 0).map((d) => d.profit);
  const maxPos = Math.max(1, ...allProfits.filter((v) => v > 0));
  const monthTotal = allProfits.reduce((a, b) => a + b, 0);
  const todayStr = todayISO();

  const detail = useMemo(() => {
    if (!selected || !dayBets.length) return null;
    const profit = dayBets.reduce((a, b) => a + effectiveProfit(b), 0);
    const stake = dayBets.reduce((a, b) => a + b.total_stake, 0);
    const wins = dayBets.filter((b) => b.status === 'won').length;
    const losses = dayBets.filter((b) => b.status === 'lost').length;
    const roi = stake ? (profit / stake) * 100 : 0;
    return {
      profit, record: `${wins}–${losses}`, bets: dayBets.length,
      roi: (roi >= 0 ? '+' : '−') + Math.abs(roi).toFixed(1) + '%',
    };
  }, [selected, dayBets]);

  return (
    <div className="stack" style={{ maxWidth: 480, margin: '0 auto', width: '100%' }}>
      <div className="panel">
        <div className="panel__body">
          <div className="cal">
            <div className="cal-head">
              <button className="cal-nav" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="←"><IconChevronLeft /></button>
              <div className="cal-month">{MONTHS[lang][month]} {year}</div>
              <button className="cal-nav" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="→"><IconChevronRight /></button>
            </div>
            <div className="cal-total">
              <span className="cal-total__label">{t('cal.month')}</span>
              <span className={`cal-total__val ${pnlClass(monthTotal)}`}>{money(monthTotal, { sign: true })}</span>
            </div>

            <div className="cal__dow">
              {DOW[lang].map((d, i) => <span key={i}>{d}</span>)}
            </div>
            <div className="cal__weeks">
              {weeks.map((week, wi) => (
                <div className="cal__week" key={wi}>
                  {week.map((d, di) => {
                    if (d === null) return <div className="cell empty" key={di} />;
                    const ds = `${year}-${pad(month + 1)}-${pad(d)}`;
                    const info = days[ds];
                    const has = info && info.count > 0;
                    const cls = ['cell', has ? 'bet' : 'nobet', ds === todayStr ? 'today' : '', ds === selected ? 'sel' : ''].join(' ');
                    if (!has) return <div className={cls} key={di}><span className="cell-num">{d}</span></div>;
                    return (
                      <div className={cls} key={di} style={tileStyle(info.profit, maxPos)} onClick={() => pickDay(ds)}>
                        <span className="cell-num">{d}</span>
                        <span className="cell-amt">{cellAmt(info.profit)}</span>
                        {info.pending > 0 && <span className="cell-dot" />}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {detail ? (
              <div className="cal-detail">
                <div className="cal-detail__head">
                  <span className="cal-detail__date">{fmtDate(selected, localeFor(lang))}</span>
                  <span className="cal-detail__amt" style={{ color: `var(--${detail.profit >= 0 ? 'profit' : 'loss'})` }}>{money(detail.profit, { sign: true })}</span>
                </div>
                <div className="cal-detail__stats">
                  <div className="cal-stat"><span className="cal-stat__k">{t('cal.dBets')}</span><span className="cal-stat__v">{detail.bets}</span></div>
                  <div className="cal-stat"><span className="cal-stat__k">{t('cal.dRecord')}</span><span className="cal-stat__v">{detail.record}</span></div>
                  <div className="cal-stat"><span className="cal-stat__k">{t('cal.dRoi')}</span><span className="cal-stat__v" style={{ color: `var(--${detail.profit >= 0 ? 'profit' : 'loss'})` }}>{detail.roi}</span></div>
                </div>

                <div className="cal-betlist">
                  {dayBets.map((b) => {
                    const p = effectiveProfit(b);
                    const sub = [b.event && b.market ? b.market : (b.sport || ''), t(`st.${b.status}`)].filter(Boolean).join(' · ');
                    return (
                      <div className="cal-bet" key={b.id}>
                        <div className="cal-bet__main">
                          <div className="cal-bet__event">{b.event}</div>
                          <div className="cal-bet__sub">{sub}</div>
                        </div>
                        <div className={`cal-bet__amt ${pnlClass(p)}`}>{money(p, { sign: true })}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="cal-empty">{t('cal.tapDay')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
