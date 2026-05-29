import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="bg-white min-h-screen w-full flex items-center justify-center">
      <div className="w-full h-full max-w-md bg-white overflow-hidden relative">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
