import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Calculator from './pages/Calculator.jsx';
import Bets from './pages/Bets.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import Settings from './pages/Settings.jsx';
import AddBet from './pages/AddBet.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading">…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/calculadora" element={<Calculator />} />
        <Route path="/anadir" element={<AddBet />} />
        <Route path="/apuestas" element={<Bets />} />
        <Route path="/calendario" element={<CalendarPage />} />
        <Route path="/ajustes" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
