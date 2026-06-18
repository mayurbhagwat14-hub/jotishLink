import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import PublicLayout from './layouts/PublicLayout';
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';
import AstrologerLayout from './layouts/AstrologerLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Auth / Public Pages
import LandingPage from './pages/LandingPage';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';

// User Pages
import Home from './pages/user/Home';
import Wallet from './pages/user/Wallet';
import RechargeWallet from './pages/user/RechargeWallet';
import UserDetails from './pages/user/UserDetails';
import Astrologers from './pages/user/Astrologers';
import AstrologerProfile from './pages/user/AstrologerProfile';
import Horoscope from './pages/user/Horoscope';
import Kundli from './pages/user/Kundli';
import Panchang from './pages/user/Panchang';
import Muhurat from './pages/user/Muhurat';
import Matchmaking from './pages/user/Matchmaking';
import VideoCallList from './pages/user/VideoCallList';
import VideoCallBookingForm from './pages/user/VideoCallBookingForm';
import VideoRoom from './pages/user/VideoRoom';
import Store from './pages/user/Store';
import ProductDetails from './pages/user/ProductDetails';
import Cart from './pages/user/Cart';
import Checkout from './pages/user/Checkout';
import OrderSuccess from './pages/user/OrderSuccess';
import OrderHistory from './pages/user/OrderHistory';
import OrderDetails from './pages/user/OrderDetails';
import PoojaDetails from './pages/user/PoojaDetails';
import Profile from './pages/user/Profile';
import UserChatRoom from './pages/user/UserChatRoom';
import ComingSoon from './pages/user/ComingSoon';
import FreeChatOffer from './pages/user/FreeChatOffer';
import PoojaBookingForm from './pages/user/PoojaBookingForm';
import GlobalSearch from './pages/user/GlobalSearch';
import WaitingScreen from './pages/user/WaitingScreen';
import Notifications from './pages/user/Notifications';

// Admin Pages
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminAstrologers from './pages/admin/Astrologers';
import AdminFinance from './pages/admin/Finance';
import AdminServices from './pages/admin/Services';
import AdminContent from './pages/admin/Content';
import AdminReports from './pages/admin/Reports';
import AdminSessions from './pages/admin/Sessions';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminInventory from './pages/admin/Inventory';
import AdminSettings from './pages/admin/Settings';
import AdminAuditLogs from './pages/admin/AuditLogs';
import AdminEarnings from './pages/admin/Earnings';
import AdminRatings from './pages/admin/Ratings';

// Astrologer Pages
import AstrologerDashboard from './pages/astrologer/Dashboard';
import ApplyAstrologer from './pages/astrologer/Apply';
import AstrologerLogin from './pages/astrologer/Login';
import Chats from './pages/astrologer/Chats';
import ChatRoom from './pages/astrologer/ChatRoom';
import Calls from './pages/astrologer/Calls';
import PoojaRequests from './pages/astrologer/PoojaRequests';
import History from './pages/astrologer/History';
import Earnings from './pages/astrologer/Earnings';
import SessionEarnings from './pages/astrologer/SessionEarnings';
import Analytics from './pages/astrologer/Analytics';
import AstrologerDashboardProfile from './pages/astrologer/Profile';
import AstrologerVideoRoom from './pages/astrologer/VideoRoom';
import BankDetails from './pages/astrologer/BankDetails';

import { useSelector, useDispatch } from 'react-redux';
import { logout } from './store/slices/authSlice';
import { useEffect } from 'react';
import { useGlobalSocket } from './hooks/useGlobalSocket';
import { usePushNotifications } from './hooks/usePushNotifications';
import { fetchPublicSettingsThunk } from './store/slices/settingsSlice';
import getSocket from './socket/socketManager';

const AppContent = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user, token } = useSelector((state) => state.auth) || {};
  const { isAuthenticated: isAdminAuthenticated, user: adminUser } = useSelector((state) => state.adminAuth) || {};
  const { isAuthenticated: isAstrologerAuthenticated, user: astrologerUser } = useSelector((state) => state.astrologerAuth) || {};
  const { appName, appLogo } = useSelector((state) => state.settings) || { appName: 'JyotishLink', appLogo: '' };
  const userRole = user?.role || 'user';

  // Initialize Global Sockets
  useGlobalSocket();
  
  // Initialize Push Notifications
  usePushNotifications();

  // Fetch Public App Branding
  useEffect(() => {
    dispatch(fetchPublicSettingsThunk());
    
    // Listen for real-time updates
    const socket = getSocket();
    if (socket) {
      const handleSettingsUpdate = () => {
        dispatch(fetchPublicSettingsThunk());
      };
      socket.on('settings_updated', handleSettingsUpdate);
      return () => {
        socket.off('settings_updated', handleSettingsUpdate);
      };
    }
  }, [dispatch]);

  // Update Document Title and Favicon Dynamically
  useEffect(() => {
    if (appName) {
      document.title = `${appName} | Connect with the Stars`;
    }
    if (appLogo) {
      const link = document.querySelector("link[rel~='icon']");
      if (link) {
        link.href = appLogo;
      } else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = appLogo;
        document.head.appendChild(newLink);
      }
    }
  }, [appName, appLogo]);

  // Clear legacy mock guest state from local storage/Redux
  useEffect(() => {
    if (isAuthenticated && (token === 'guest-token' || !token)) {
      dispatch(logout());
    }
  }, [isAuthenticated, token, dispatch]);

  const getHomePath = () => {
    if (!isAuthenticated || !user) return '/user/home';
    if (userRole === 'admin') return '/admin/dashboard';
    if (userRole === 'astrologer') return '/astrologer/dashboard';
    
    // Check if the user is new or hasn't filled details (only if user object is loaded)
    if (user && (user.isNewUser || user.name === 'Guest User' || !user.name)) {
      return '/user/details';
    }
    
    return '/user/home';
  };

  return (
    <Routes>
      {/* Onboarding */}
      <Route path="/onboarding" element={<Onboarding />} />

      {/* Public Pages with Navbar */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Navigate to={getHomePath()} replace />} />
      </Route>

      {/* Auth Pages */}
      <Route element={<AuthLayout />}>
        <Route path="/user/login" element={(isAuthenticated && user) ? <Navigate to={getHomePath()} replace /> : <Login />} />
      </Route>

      {/* User Panel */}
      <Route path="/user" element={<UserLayout />}>
        {/* Default — always start at home */}
        <Route index element={<Navigate to="home" replace />} />
        
        {/* Public Routes within User Panel */}
        <Route path="home" element={<Home />} />
        <Route path="horoscope" element={<Horoscope />} />
        <Route path="kundli" element={<Kundli />} />
        <Route path="panchang" element={<Panchang />} />
        <Route path="muhurat" element={<Muhurat />} />
        <Route path="matchmaking" element={<Matchmaking />} />

        {/* Protected Routes within User Panel */}
        <Route element={<ProtectedRoute allowedRoles={['user']} />}>
          <Route path="astrologers" element={<Astrologers />} />
          <Route path="astrologer/:id" element={<AstrologerProfile />} />
          <Route path="store" element={<Store />} />
          <Route path="product/:id" element={<ProductDetails />} />
          <Route path="cart" element={<Cart />} />
          <Route path="history" element={<OrderHistory />} />
          <Route path="order/:id" element={<OrderDetails />} />
          <Route path="pooja/:id" element={<PoojaDetails />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="order-success/:orderId" element={<OrderSuccess />} />
          <Route path="coming-soon" element={<ComingSoon />} />
          <Route path="free-chat-offer" element={<FreeChatOffer />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="recharge" element={<RechargeWallet />} />
          <Route path="details" element={<UserDetails />} />
          <Route path="video-call" element={<VideoCallList />} />
          <Route path="video-booking/:id" element={<VideoCallBookingForm />} />
          <Route path="waiting" element={<WaitingScreen />} />
          <Route path="video-room/:id" element={<VideoRoom />} />
          <Route path="profile" element={<Profile />} />
          <Route path="history" element={<OrderHistory />} />
          <Route path="pooja-booking/:panditId" element={<PoojaBookingForm />} />
          <Route path="search" element={<GlobalSearch />} />
          <Route path="notifications" element={<Notifications />} />
          
          {/* Coming Soon Links */}
          <Route path="live" element={<ComingSoon />} />
          <Route path="poojas" element={<ComingSoon />} />
          <Route path="remedies" element={<ComingSoon />} />
          <Route path="settings" element={<ComingSoon />} />
        </Route>
      </Route>

      {/* Admin Panel (Public Login) */}
      <Route path="/admin/login" element={isAdminAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin />} />

      {/* Admin Panel (Protected) */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="astrologers" element={<AdminAstrologers />} />
        <Route path="ratings" element={<AdminRatings />} />
        <Route path="finance" element={<AdminFinance />} />
        <Route path="earnings" element={<AdminEarnings />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="sessions" element={<AdminSessions />} />
        <Route path="content" element={<AdminContent />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="inventory" element={<AdminInventory />} />
        <Route path="audit-logs" element={<AdminAuditLogs />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Astrologer Application & Login (Public) */}
      <Route path="/astrologer/apply" element={isAstrologerAuthenticated && astrologerUser?.approvalStatus === 'approved' ? <Navigate to="/astrologer/dashboard" replace /> : <ApplyAstrologer />} />
      <Route path="/astrologer/login" element={isAstrologerAuthenticated && astrologerUser?.approvalStatus === 'approved' ? <Navigate to="/astrologer/dashboard" replace /> : <AstrologerLogin />} />

      {/* Astrologer Panel */}
      <Route path="/astrologer" element={
        <ProtectedRoute allowedRoles={['astrologer']}>
          <AstrologerLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<AstrologerDashboard />} />
        <Route path="chats" element={<Chats />} />
        <Route path="calls" element={<Calls />} />
        <Route path="pooja" element={<PoojaRequests />} />
        <Route path="history" element={<History />} />
        <Route path="earnings" element={<Earnings />} />
        <Route path="session-earnings" element={<SessionEarnings />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="profile" element={<AstrologerDashboardProfile />} />
        <Route path="bank-details" element={<BankDetails />} />
      </Route>
      
      {/* Full-screen Astrologer Chat Room */}
      <Route path="/astrologer/chat/:id" element={
        <ProtectedRoute allowedRoles={['astrologer']}>
          <ChatRoom />
        </ProtectedRoute>
      } />

      {/* Full-screen Astrologer Video Room */}
      <Route path="/astrologer/video-room/:id" element={
        <ProtectedRoute allowedRoles={['astrologer']}>
          <AstrologerVideoRoom />
        </ProtectedRoute>
      } />

      {/* Full-screen User Chat Room */}
      <Route path="/user/chat" element={
        <ProtectedRoute allowedRoles={['user']}>
          <UserChatRoom />
        </ProtectedRoute>
      } />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <Toaster position="top-center" />
      <AppContent />
    </Router>
  );
}

export default App;
