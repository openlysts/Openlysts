import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ThreeBackground from './ThreeBackground';

export default function OpenlystLayout() {
  return (
    <div className="min-h-screen flex flex-col theme-transition">
      <ThreeBackground />
      <div className="relative z-10 flex flex-col flex-1">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}