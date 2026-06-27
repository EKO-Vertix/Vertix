import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const DICT = {
  es: {
    'nav.dashboard': 'Panel', 'nav.calculator': 'Calculadora', 'nav.bets': 'Apuestas',
    'nav.calendar': 'Calendario', 'nav.settings': 'Ajustes', 'nav.add': 'Añadir',
    'sub.dashboard': 'Resumen de tu rendimiento', 'sub.calculator': 'Calcula stakes y surebets',
    'sub.bets': 'Registro de tus operaciones', 'sub.calendar': 'Ganancias por día',
    'sub.settings': 'Idioma y apariencia', 'sub.add': 'Registra una apuesta manualmente',
    'add.title': 'Añadir apuesta', 'add.event': 'Evento', 'add.eventPh': 'Ej: Madrid vs Barça',
    'add.sport': 'Deporte', 'add.market': 'Mercado', 'add.marketPh': 'Surebet, combinada, hándicap…',
    'add.date': 'Fecha', 'add.stake': 'Importe total (€)', 'add.status': 'Estado',
    'add.profit': 'Beneficio (€)', 'add.profitHintPending': 'Beneficio esperado (garantizado en surebets)',
    'add.profitHintSettled': 'Beneficio real. Usa un número negativo si perdiste.',
    'add.notes': 'Notas (opcional)', 'add.save': 'Guardar apuesta', 'add.saving': 'Guardando…',
    'add.saved': 'Apuesta guardada.', 'add.seeBets': 'Ver en mis apuestas →',
    'add.needEvent': 'Pon un nombre de evento', 'add.needStake': 'El importe debe ser mayor que 0',
    'action.newSurebet': 'Nueva surebet', 'action.viewAll': 'Ver todas', 'common.account': 'Mi cuenta',
    'action.logout': 'Cerrar sesión',

    'auth.loginTitle': 'Inicia sesión', 'auth.loginSub': 'Accede a tu registro de surebets',
    'auth.email': 'Email', 'auth.password': 'Contraseña', 'auth.enter': 'Entrar', 'auth.entering': 'Entrando…',
    'auth.noAccount': '¿No tienes cuenta?', 'auth.signup': 'Regístrate',
    'auth.signupTitle': 'Crea tu cuenta', 'auth.signupSub': 'Empieza a registrar tus ganancias',
    'auth.name': 'Nombre', 'auth.create': 'Crear cuenta', 'auth.creating': 'Creando…',
    'auth.hasAccount': '¿Ya tienes cuenta?', 'auth.login': 'Inicia sesión',
    'auth.minPass': 'La contraseña debe tener al menos 6 caracteres',

    'dash.totalProfit': 'Beneficio total', 'dash.thisMonth': 'Este mes', 'dash.roi': 'ROI',
    'dash.pending': 'Pendientes', 'dash.bets': 'apuestas', 'dash.bet': 'apuesta', 'dash.over': 'sobre',
    'dash.unsettled': 'sin liquidar', 'dash.monthlyProfit': 'Beneficio por mes', 'dash.last6': 'Últimos 6 meses',
    'dash.recent': 'Últimas apuestas', 'dash.emptyTitle': 'Aún no has registrado apuestas',
    'dash.emptyText': 'Usa la calculadora para repartir tu stake en una surebet y guárdala. Aquí verás tu beneficio, ROI y rachas.',
    'dash.openCalc': 'Abrir calculadora', 'dash.loading': 'Cargando panel…', 'dash.noBets': 'Sin apuestas todavía.',

    'calc.title': 'Cuotas y reparto', 'calc.decimal': 'Cuotas decimales', 'calc.totalStake': 'Inversión total',
    'calc.rounding': 'Redondeo de stakes', 'calc.noRound': 'Sin redondeo', 'calc.roundTo': 'A',
    'calc.bookmaker': 'Casa de apuestas', 'calc.outcome': 'Resultado', 'calc.odds': 'Cuota',
    'calc.addOutcome': 'Añadir resultado', 'calc.register': 'Registrar esta apuesta', 'calc.event': 'Evento',
    'calc.sport': 'Deporte', 'calc.market': 'Mercado', 'calc.date': 'Fecha', 'calc.save': 'Guardar apuesta',
    'calc.saving': 'Guardando…', 'calc.surebet': 'Surebet', 'calc.noArb': 'Sin arbitraje',
    'calc.result': 'Resultado', 'calc.guaranteed': 'Beneficio garantizado de', 'calc.noProfit': 'Estas cuotas no garantizan beneficio',
    'calc.introTitle': 'Introduce las cuotas', 'calc.introText': 'Rellena al menos 2 resultados con su cuota para calcular el reparto y el beneficio garantizado.',
    'calc.guaranteedShort': 'Beneficio garantizado', 'calc.impliedSum': 'Suma prob. implícitas',
    'calc.stake': 'Apostar', 'calc.return': 'retorno', 'calc.needEvent': 'Pon un nombre de evento para guardar la apuesta',
    'calc.saved': 'Apuesta guardada como pendiente.', 'calc.seeInBets': 'Ver en mis apuestas →',
    'calc.eventPh': 'Ej: Real Madrid vs Barcelona', 'calc.marketPh': '1X2, Ganador…', 'calc.house': 'Casa',

    'bets.all': 'Todas', 'bets.pending': 'Pendientes', 'bets.won': 'Ganadas', 'bets.lost': 'Perdidas',
    'bets.void': 'Anuladas', 'bets.date': 'Fecha', 'bets.event': 'Evento', 'bets.stake': 'Stake',
    'bets.profit': 'Beneficio', 'bets.pct': '%', 'bets.status': 'Estado', 'bets.reopen': 'Reabrir',
    'bets.loading': 'Cargando…', 'bets.emptyTitle': 'No hay apuestas', 'bets.emptyFilter': 'con este filtro',
    'bets.emptyText': 'Cuando guardes una surebet desde la calculadora aparecerá aquí para que la liquides.',
    'bets.create': 'Crear una apuesta', 'bets.lostPrompt': 'Resultado real de esta apuesta en € (usa un número negativo si perdiste dinero):',
    'bets.delPrompt': '¿Eliminar la apuesta', 'bets.markWon': 'Marcar ganada', 'bets.markLost': 'Marcar perdida', 'bets.delete': 'Eliminar',

    'st.pending': 'Pendiente', 'st.won': 'Ganada', 'st.lost': 'Perdida', 'st.void': 'Anulada',

    'cal.month': 'Beneficio del mes', 'cal.bets': 'Apuestas', 'cal.today': 'Hoy', 'cal.tapDay': 'Toca un día para ver el detalle',
    'cal.dBets': 'Apuestas', 'cal.dRecord': 'Récord', 'cal.dRoi': 'ROI', 'cal.noDayBets': 'No hay apuestas registradas este día.',

    'set.title': 'Ajustes', 'set.language': 'Idioma', 'set.langSub': 'Idioma de la interfaz',
    'set.theme': 'Apariencia', 'set.themeSub': 'Tema claro u oscuro', 'set.dark': 'Oscuro', 'set.light': 'Claro',
    'set.account': 'Cuenta', 'set.spanish': 'Español', 'set.english': 'English',
    'admin.title': 'Administración', 'admin.sub': 'Estadísticas globales — solo visible para ti',
    'admin.users': 'Usuarios', 'admin.bets': 'Apuestas', 'admin.staked': 'Total apostado',
    'admin.recent': 'Últimos registros', 'admin.none': 'Aún no hay usuarios.', 'admin.error': 'No se pudieron cargar las estadísticas.',
  },
  en: {
    'nav.dashboard': 'Dashboard', 'nav.calculator': 'Calculator', 'nav.bets': 'Bets',
    'nav.calendar': 'Calendar', 'nav.settings': 'Settings', 'nav.add': 'Add',
    'sub.dashboard': 'Your performance overview', 'sub.calculator': 'Compute stakes and surebets',
    'sub.bets': 'Your bet log', 'sub.calendar': 'Profit by day', 'sub.settings': 'Language and appearance',
    'sub.add': 'Log a bet manually',
    'add.title': 'Add bet', 'add.event': 'Event', 'add.eventPh': 'e.g. Madrid vs Barça',
    'add.sport': 'Sport', 'add.market': 'Market', 'add.marketPh': 'Surebet, parlay, handicap…',
    'add.date': 'Date', 'add.stake': 'Total stake (€)', 'add.status': 'Status',
    'add.profit': 'Profit (€)', 'add.profitHintPending': 'Expected profit (guaranteed for surebets)',
    'add.profitHintSettled': 'Actual profit. Use a negative number if you lost.',
    'add.notes': 'Notes (optional)', 'add.save': 'Save bet', 'add.saving': 'Saving…',
    'add.saved': 'Bet saved.', 'add.seeBets': 'See in my bets →',
    'add.needEvent': 'Enter an event name', 'add.needStake': 'Stake must be greater than 0',
    'action.newSurebet': 'New surebet', 'action.viewAll': 'View all', 'common.account': 'My account',
    'action.logout': 'Log out',

    'auth.loginTitle': 'Sign in', 'auth.loginSub': 'Access your surebet tracker',
    'auth.email': 'Email', 'auth.password': 'Password', 'auth.enter': 'Sign in', 'auth.entering': 'Signing in…',
    'auth.noAccount': "Don't have an account?", 'auth.signup': 'Sign up',
    'auth.signupTitle': 'Create your account', 'auth.signupSub': 'Start tracking your profits',
    'auth.name': 'Name', 'auth.create': 'Create account', 'auth.creating': 'Creating…',
    'auth.hasAccount': 'Already have an account?', 'auth.login': 'Sign in',
    'auth.minPass': 'Password must be at least 6 characters',

    'dash.totalProfit': 'Total profit', 'dash.thisMonth': 'This month', 'dash.roi': 'ROI',
    'dash.pending': 'Pending', 'dash.bets': 'bets', 'dash.bet': 'bet', 'dash.over': 'over',
    'dash.unsettled': 'unsettled', 'dash.monthlyProfit': 'Profit by month', 'dash.last6': 'Last 6 months',
    'dash.recent': 'Recent bets', 'dash.emptyTitle': "You haven't logged any bets yet",
    'dash.emptyText': 'Use the calculator to split your stake into a surebet and save it. Your profit, ROI and streaks will appear here.',
    'dash.openCalc': 'Open calculator', 'dash.loading': 'Loading dashboard…', 'dash.noBets': 'No bets yet.',

    'calc.title': 'Odds & stakes', 'calc.decimal': 'Decimal odds', 'calc.totalStake': 'Total stake',
    'calc.rounding': 'Round stakes', 'calc.noRound': 'No rounding', 'calc.roundTo': 'To',
    'calc.bookmaker': 'Bookmaker', 'calc.outcome': 'Outcome', 'calc.odds': 'Odds',
    'calc.addOutcome': 'Add outcome', 'calc.register': 'Log this bet', 'calc.event': 'Event',
    'calc.sport': 'Sport', 'calc.market': 'Market', 'calc.date': 'Date', 'calc.save': 'Save bet',
    'calc.saving': 'Saving…', 'calc.surebet': 'Surebet', 'calc.noArb': 'No arbitrage',
    'calc.result': 'Result', 'calc.guaranteed': 'Guaranteed profit of', 'calc.noProfit': 'These odds do not guarantee a profit',
    'calc.introTitle': 'Enter the odds', 'calc.introText': 'Fill in at least 2 outcomes with their odds to compute the split and the guaranteed profit.',
    'calc.guaranteedShort': 'Guaranteed profit', 'calc.impliedSum': 'Implied prob. sum',
    'calc.stake': 'Stake', 'calc.return': 'return', 'calc.needEvent': 'Enter an event name to save the bet',
    'calc.saved': 'Bet saved as pending.', 'calc.seeInBets': 'See in my bets →',
    'calc.eventPh': 'e.g. Real Madrid vs Barcelona', 'calc.marketPh': '1X2, Winner…', 'calc.house': 'Book',

    'bets.all': 'All', 'bets.pending': 'Pending', 'bets.won': 'Won', 'bets.lost': 'Lost',
    'bets.void': 'Void', 'bets.date': 'Date', 'bets.event': 'Event', 'bets.stake': 'Stake',
    'bets.profit': 'Profit', 'bets.pct': '%', 'bets.status': 'Status', 'bets.reopen': 'Reopen',
    'bets.loading': 'Loading…', 'bets.emptyTitle': 'No bets', 'bets.emptyFilter': 'with this filter',
    'bets.emptyText': 'When you save a surebet from the calculator it will show up here to settle.',
    'bets.create': 'Create a bet', 'bets.lostPrompt': 'Actual result of this bet in € (use a negative number if you lost money):',
    'bets.delPrompt': 'Delete the bet', 'bets.markWon': 'Mark won', 'bets.markLost': 'Mark lost', 'bets.delete': 'Delete',

    'st.pending': 'Pending', 'st.won': 'Won', 'st.lost': 'Lost', 'st.void': 'Void',

    'cal.month': 'Profit this month', 'cal.bets': 'Bets', 'cal.today': 'Today', 'cal.tapDay': 'Tap a day to see the breakdown',
    'cal.dBets': 'Bets', 'cal.dRecord': 'Record', 'cal.dRoi': 'ROI', 'cal.noDayBets': 'No bets logged on this day.',

    'set.title': 'Settings', 'set.language': 'Language', 'set.langSub': 'Interface language',
    'set.theme': 'Appearance', 'set.themeSub': 'Light or dark theme', 'set.dark': 'Dark', 'set.light': 'Light',
    'set.account': 'Account', 'set.spanish': 'Español', 'set.english': 'English',
    'admin.title': 'Administration', 'admin.sub': 'Global stats — only visible to you',
    'admin.users': 'Users', 'admin.bets': 'Bets', 'admin.staked': 'Total staked',
    'admin.recent': 'Recent sign-ups', 'admin.none': 'No users yet.', 'admin.error': 'Could not load stats.',
  },
};

// Email con acceso a la sección de administración (debe coincidir con ADMIN_EMAIL del backend).
export const ADMIN_EMAIL = 'anwarmendsdeniali@gmail.com';

export const MONTHS = {
  es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
// Lunes primero
export const DOW = {
  es: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};

const Ctx = createContext(null);
export const useSettings = () => useContext(Ctx);
export function useT() {
  const { lang } = useSettings();
  return useCallback((key) => (DICT[lang] && DICT[lang][key]) || (DICT.es[key]) || key, [lang]);
}

export function SettingsProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('lang') || 'es');
  const [theme, setThemeState] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('theme', theme); }, [theme]);
  useEffect(() => { document.documentElement.lang = lang; localStorage.setItem('lang', lang); }, [lang]);

  const setLang = useCallback((l) => setLangState(l), []);
  const setTheme = useCallback((t) => setThemeState(t), []);

  return <Ctx.Provider value={{ lang, theme, setLang, setTheme }}>{children}</Ctx.Provider>;
}
