import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ThreeBackground from './ThreeBackground';
import { useMobileLayout } from '@/lib/MobileLayoutContext';

export default function OpenlystLayout() {
  const { isMobileLayout } = useMobileLayout();
  
  return (
    <div className="min-h-screen flex flex-col theme-transition">
      <ThreeBackground />
      <div className="relative z-10 flex flex-col flex-1">
        <Header />
        <main className={`flex-1 transition-all duration-300 ease-in-out ${isMobileLayout ? 'max-w-md w-full mx-auto shadow-2xl border-x border-border bg-bg/50' : ''}`}>
          <Outlet />
        </main>
        <div className={`${isMobileLayout ? 'max-w-md w-full mx-auto' : ''}`}>
          <Footer />
        </div>
      </div>
    </div>
  );
}