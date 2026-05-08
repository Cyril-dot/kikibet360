import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

// GameRunner lives at  src/games/GameRunner.tsx
import GameRunner from './games/GameRunner';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/match/:id" element={<MatchDetailsPage />} />
          <Route path="/live" element={<LiveMatchesPage />} />
          <Route path="/betslip" element={<BetSlipPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/deposit" element={<DepositPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/casino" element={<CasinoPage />} />
          <Route path="/promos" element={<PromosPage />} />
          <Route path="/affiliate" element={<AffiliatePage />} />

          {/* All games resolved via slug → GameRunner */}
          <Route path="/games/:slug" element={<GameRunner />} />
        </Route>
      </Routes>
      <AdminModal />
    </BrowserRouter>
  );
}

export default App;