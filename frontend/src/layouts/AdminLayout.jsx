import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { useState, useEffect, useRef } from 'react';
import {
  FiHome, FiUsers, FiCreditCard, FiLogOut, FiLayout, FiBarChart2,
  FiMenu, FiChevronLeft, FiChevronRight, FiChevronDown, FiMessageSquare,
  FiShield, FiStar, FiBell, FiSearch, FiSettings, FiBox, FiShoppingCart,
  FiPackage, FiGrid, FiTruck, FiDatabase, FiX
} from 'react-icons/fi';
import { GiFlowerPot } from 'react-icons/gi';
import NotificationDropdown from '../components/NotificationDropdown';

const AdminLayout = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef(null);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/admin/login');
  };

  const toggleSection = (title) => {
    if (sidebarCollapsed) return;
    setExpandedSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  // Auto-expand section that contains active link
  useEffect(() => {
    navSections.forEach(section => {
      if (section.children) {
        const hasActive = section.children.some(child =>
          location.pathname === child.path || location.pathname.startsWith(child.path + '/')
        );
        if (hasActive) {
          setExpandedSections(prev => ({ ...prev, [section.title]: true }));
        }
      }
    });
  }, [location.pathname]);

  // Close search on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setSearchOpen(false);
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 100);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const navSections = [
    {
      title: 'Overview',
      icon: <FiHome size={18} />,
      path: '/admin/dashboard',
    },
    {
      title: 'People',
      icon: <FiUsers size={18} />,
      children: [
        { path: '/admin/users', name: 'Users', icon: <FiUsers size={16} /> },
        { path: '/admin/astrologers', name: 'Astrologers', icon: <FiStar size={16} /> },
      ],
    },
    {
      title: 'Operations',
      icon: <FiMessageSquare size={18} />,
      children: [
        { path: '/admin/sessions', name: 'Live Sessions', icon: <FiMessageSquare size={16} />, badge: '3' },
        { path: '/admin/finance', name: 'Finance', icon: <FiCreditCard size={16} /> },
        { path: '/admin/services', name: 'Services', icon: <GiFlowerPot size={16} /> },
      ],
    },
    {
      title: 'Store Management',
      icon: <FiShoppingCart size={18} />,
      children: [
        { path: '/admin/products', name: 'Products', icon: <FiBox size={16} /> },
        { path: '/admin/orders', name: 'Orders', icon: <FiShoppingCart size={16} /> },
        { path: '/admin/inventory', name: 'Inventory', icon: <FiDatabase size={16} /> },
      ],
    },
    {
      title: 'Platform',
      icon: <FiGrid size={18} />,
      children: [
        { path: '/admin/content', name: 'Content & CMS', icon: <FiLayout size={16} /> },
        { path: '/admin/reports', name: 'Reports', icon: <FiBarChart2 size={16} /> },
        { path: '/admin/audit-logs', name: 'Audit Logs', icon: <FiShield size={16} /> },
        { path: '/admin/settings', name: 'Settings', icon: <FiSettings size={16} /> },
      ],
    },

  ];

  // Get current page name for breadcrumb
  const getCurrentPageInfo = () => {
    for (const section of navSections) {
      if (section.path && location.pathname.startsWith(section.path)) {
        return { section: section.title, page: section.title };
      }
      if (section.children) {
        for (const child of section.children) {
          if (location.pathname === child.path || location.pathname.startsWith(child.path + '/')) {
            return { section: section.title, page: child.name };
          }
        }
      }
    }
    return { section: 'Admin', page: 'Admin' };
  };

  const pageInfo = getCurrentPageInfo();

  // Quick search items
  const allPages = navSections.flatMap(s =>
    s.children ? s.children.map(c => ({ ...c, section: s.title })) : [{ path: s.path, name: s.title, icon: s.icon, section: 'Overview' }]
  );
  const filteredPages = searchQuery
    ? allPages.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : allPages;

  const isLinkActive = (path) => {
    return location.pathname === path || (path !== '/admin/dashboard' && location.pathname.startsWith(path + '/'));
  };

  const isSectionActive = (section) => {
    if (section.path) return isLinkActive(section.path);
    return section.children?.some(c => isLinkActive(c.path));
  };

  return (
    <div className="flex h-screen bg-[#F8F9FC] font-sans overflow-hidden">

      {/* ═══ SIDEBAR ═══ */}
      <aside className={`bg-white flex flex-col transition-all duration-300 ease-in-out border-r border-gray-200/60 ${sidebarCollapsed ? 'w-[72px]' : 'w-[270px]'} shrink-0 relative z-20`}>

        {/* Brand */}
        <div className={`h-[68px] flex items-center shrink-0 border-b border-gray-100 ${sidebarCollapsed ? 'justify-center px-2' : 'px-5'}`}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3 w-full">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm shadow-orange-500/20">
                <FiShield size={17} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-[14px] font-black text-gray-900 tracking-tight leading-tight">JyotishLink</h1>
                <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase">Admin Panel</p>
              </div>
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
              >
                <FiChevronLeft size={16} />
              </button>
            </div>
          )}
          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm shadow-orange-500/20 hover:scale-105 transition-transform"
            >
              <FiShield size={17} className="text-white" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1 no-scrollbar">
          {navSections.map((section) => {
            const sectionIsActive = isSectionActive(section);

            // Direct link (no children)
            if (section.path) {
              return (
                <Link
                  key={section.title}
                  to={section.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                    isLinkActive(section.path)
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                  title={sidebarCollapsed ? section.title : ''}
                >
                  {isLinkActive(section.path) && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-orange-500 rounded-r-full" />}
                  <span className={`shrink-0 ${isLinkActive(section.path) ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-600'}`}>
                    {section.icon}
                  </span>
                  {!sidebarCollapsed && <span className="font-semibold text-[13px]">{section.title}</span>}
                </Link>
              );
            }

            // Expandable section (has children)
            const isExpanded = expandedSections[section.title] || sidebarCollapsed;

            return (
              <div key={section.title}>
                <button
                  onClick={() => sidebarCollapsed ? setSidebarCollapsed(false) : toggleSection(section.title)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group w-full ${
                    sectionIsActive && !isExpanded
                      ? 'bg-orange-50/60 text-orange-600'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                  title={sidebarCollapsed ? section.title : ''}
                >
                  <span className={`shrink-0 ${sectionIsActive ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-600'}`}>
                    {section.icon}
                  </span>
                  {!sidebarCollapsed && (
                    <>
                      <span className="font-semibold text-[13px] flex-1 text-left">{section.title}</span>
                      <FiChevronDown
                        size={14}
                        className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </>
                  )}
                </button>

                {/* Children */}
                {!sidebarCollapsed && (
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="ml-3 pl-3 border-l-2 border-gray-100 space-y-0.5 py-1">
                      {section.children.map((child) => {
                        const childActive = isLinkActive(child.path);
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 group relative ${
                              childActive
                                ? 'bg-orange-50 text-orange-600 font-bold'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                            }`}
                          >
                            {childActive && <div className="absolute -left-[15px] top-1/2 -translate-y-1/2 w-[2px] h-4 bg-orange-500 rounded-r-full" />}
                            <span className={`shrink-0 ${childActive ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-500'}`}>
                              {child.icon}
                            </span>
                            <span className="text-[13px] font-medium">{child.name}</span>
                            {child.badge && (
                              <span className="ml-auto bg-red-500 text-white text-[9px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center animate-pulse">
                                {child.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom — User + Logout */}
        <div className="p-3 border-t border-gray-100 shrink-0 space-y-1">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center font-bold text-white text-sm shadow-sm shadow-orange-500/20">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-gray-800 truncate">{user?.name || 'Super Admin'}</p>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Administrator</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-red-500 hover:bg-red-50 transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}
            title={sidebarCollapsed ? 'Sign Out' : ''}
          >
            <FiLogOut size={18} />
            {!sidebarCollapsed && <span className="font-semibold text-[13px]">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Bar */}
        <header className="h-[68px] bg-white flex items-center justify-between px-6 lg:px-8 shrink-0 border-b border-gray-200/60">
          {/* Left: Breadcrumb + Mobile toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all lg:hidden"
            >
              <FiMenu size={18} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-gray-400 font-medium">Admin</span>
              <FiChevronRight size={12} className="text-gray-300" />
              {pageInfo.section !== pageInfo.page && (
                <>
                  <span className="text-gray-400 font-medium">{pageInfo.section}</span>
                  <FiChevronRight size={12} className="text-gray-300" />
                </>
              )}
              <span className="text-gray-800 font-bold">{pageInfo.page}</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 sm:hidden">{pageInfo.page}</h2>
          </div>

          {/* Right: Search + Notifications + User */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <button
              onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 100); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all text-gray-400 hover:text-gray-600"
            >
              <FiSearch size={15} />
              <span className="text-xs font-medium hidden md:inline">Search...</span>
              <kbd className="hidden lg:inline text-[10px] bg-white border border-gray-200 rounded px-1.5 py-0.5 font-mono text-gray-400">⌘K</kbd>
            </button>

            {/* Notifications */}
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all relative">
              <NotificationDropdown iconSize={17} iconClassName="text-gray-400 hover:text-gray-600" />
            </div>

            <div className="w-px h-8 bg-gray-100 hidden sm:block"></div>

            {/* User Avatar */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-[13px] font-bold text-gray-800 leading-tight">{user?.name || 'Super Admin'}</p>
                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Administrator</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center font-bold text-white text-sm shadow-sm shadow-orange-500/20">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-5 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* ═══ SEARCH MODAL ═══ */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={() => setSearchOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <FiSearch size={18} className="text-gray-400 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search pages, users, orders..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 text-[15px] font-medium text-gray-800 placeholder-gray-400 outline-none bg-transparent"
              />
              <button onClick={() => setSearchOpen(false)} className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600">
                <FiX size={14} />
              </button>
            </div>
            <div className="max-h-[320px] overflow-y-auto py-2">
              {filteredPages.map((page) => (
                <button
                  key={page.path}
                  onClick={() => { navigate(page.path); setSearchOpen(false); setSearchQuery(''); }}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-orange-50 transition-colors text-left group"
                >
                  <span className="text-gray-400 group-hover:text-orange-500 transition-colors">{page.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-orange-600">{page.name}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{page.section}</p>
                  </div>
                  <FiChevronRight size={14} className="text-gray-300 group-hover:text-orange-400" />
                </button>
              ))}
              {filteredPages.length === 0 && (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-gray-400 font-medium">No results found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
