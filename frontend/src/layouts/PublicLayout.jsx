import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import DesktopNavbar from '../components/DesktopNavbar';

const PublicLayout = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Mobile Navbar */}
      <div className="lg:hidden">
        <Navbar />
      </div>
      
      {/* Desktop Navbar */}
      <DesktopNavbar />
      
      <main className="w-full max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;
