import { Outlet } from 'react-router-dom';
import { useAppStore } from '../../store';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import Footer from './Footer';
import Toast from '../common/Toast';

export default function Layout() {
  const theme = useAppStore((s) => s.theme);

  return (
    <div data-theme={theme}>
      {/* ── full-height flex column so footer is always pushed to the bottom ── */}
      <div className="flex flex-col min-h-screen bg-[var(--bg-page)] transition-colors">
        <Header />

        {/* ── content row: sidebar + main — flex-1 makes this fill remaining height ── */}
        <div className="flex flex-1 max-w-[1440px] mx-auto w-full">
          <Sidebar />
          <main className="flex-1 min-w-0 pb-32 mb-16 lg:pb-6 lg:mb-0">
            <Outlet />
          </main>
        </div>

        {/* ── footer sits at the bottom, only visible when user scrolls there ── */}
        <Footer />

        <BottomNav />
        <Toast />
      </div>
    </div>
  );
}