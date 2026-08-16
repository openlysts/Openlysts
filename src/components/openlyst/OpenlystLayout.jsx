import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function OpenlystLayout() {
  return (
    <div className="min-h-screen flex flex-col theme-transition">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}