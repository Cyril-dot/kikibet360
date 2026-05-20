import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAppStore } from './store/index';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import MatchDetailsPage from './pages/MatchDetailsPage';
import LiveMatchesPage from './pages/LiveMatchesPage';
import BetSlipPage from './pages/BetSlipPage';
import WalletPage from './pages/WalletPage';
import DepositPage from './pages/DepositPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import AccountPage from './pages/AccountPage';
import CasinoPage from './pages/CasinoPage';
import PromosPage from './pages/PromosPage';
import AffiliatePage from './pages/AffiliatePage';
import AdminModal from './pages/AdminModal';

// GameRunner lives at src/games/GameRunner.tsx
import GameRunner from './games/GameRunner';

// ---------------------------------------------------------------------------
// Stub pages for footer links – replace with real pages when ready
// ---------------------------------------------------------------------------
const StubPage = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>{title}</h1>
  </div>
);

function App() {
  const theme = useAppStore((s) => s.theme);

  // Keep data-theme in sync with the store at all times.
  // main.tsx sets it once before mount; this effect keeps it correct
  // if the store value ever diverges from the DOM attribute.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* ── Core pages ── */}
          <Route path="/"          element={<HomePage />} />
          <Route path="/match/:id" element={<MatchDetailsPage />} />
          <Route path="/live"      element={<LiveMatchesPage />} />
          <Route path="/betslip"   element={<BetSlipPage />} />
          <Route path="/wallet"    element={<WalletPage />} />
          <Route path="/deposit"   element={<DepositPage />} />
          <Route path="/register"  element={<RegisterPage />} />
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/account"   element={<AccountPage />} />
          <Route path="/casino"    element={<CasinoPage />} />
          <Route path="/promos"    element={<PromosPage />} />
          <Route path="/affiliate" element={<AffiliatePage />} />

          {/* ── Footer quick links ── */}
          <Route path="/sports"      element={<StubPage title="Sports" />} />
          <Route path="/live-tv"     element={<StubPage title="Live TV" />} />
          <Route path="/jackpot"     element={<StubPage title="Jackpot" />} />

          {/* ── Footer company links ── */}
          <Route path="/about"       element={<StubPage title="About Us" />} />
          <Route path="/terms"       element={<StubPage title="Terms & Conditions" />} />
          <Route path="/privacy"     element={<StubPage title="Privacy Policy" />} />
          <Route path="/cookies"     element={<StubPage title="Cookie Policy" />} />
          <Route path="/responsible" element={<StubPage title="Responsible Gaming" />} />
          <Route path="/faq"         element={<StubPage title="FAQ" />} />

          {/* ── All games resolved via slug → GameRunner ── */}
          <Route path="/games/:slug" element={<GameRunner />} />
        </Route>
      </Routes>
      <AdminModal />
    </BrowserRouter>
  );
}

export default App;