import { Navigate, useLocation, Outlet, useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const location = useLocation();
  const context = useOutletContext();

  // Show loading spinner if authenticated but profile is still fetching
  if (isAuthenticated && !user && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    if (location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    if (location.pathname.startsWith('/astrologer')) {
      return <Navigate to="/astrologer/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/user/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their correct panel
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'astrologer') return <Navigate to="/astrologer/dashboard" replace />;
    return <Navigate to="/user/home" replace />;
  }

  return children ? children : <Outlet context={context} />;
};

export default ProtectedRoute;
