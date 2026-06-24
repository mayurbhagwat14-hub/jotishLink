import { Navigate, useLocation, Outlet, useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const userAuth = useSelector((state) => state.auth);
  const adminAuth = useSelector((state) => state.adminAuth);
  const astrologerAuth = useSelector((state) => state.astrologerAuth);
  
  const location = useLocation();
  const context = useOutletContext();

  // Determine which auth slice to use based on the route
  let currentAuth = userAuth;
  if (location.pathname.startsWith('/admin')) {
    currentAuth = adminAuth;
  } else if (location.pathname.startsWith('/astrologer')) {
    currentAuth = astrologerAuth;
  }

  const { isAuthenticated, user, loading } = currentAuth || {};

  // Show loading spinner if authenticated but profile is still fetching
  if (isAuthenticated && !user && loading) {
    return <SplashScreen />;
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

  // Block access to dashboard if astrologer is not approved
  if (
    location.pathname.startsWith('/astrologer') && 
    user.role === 'astrologer' && 
    user.approvalStatus && 
    user.approvalStatus !== 'approved'
  ) {
    return <Navigate to="/astrologer/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet context={context} />;
};

export default ProtectedRoute;
