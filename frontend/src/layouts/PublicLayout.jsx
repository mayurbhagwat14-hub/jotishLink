import { Outlet } from 'react-router-dom';

const PublicLayout = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="w-full max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;
