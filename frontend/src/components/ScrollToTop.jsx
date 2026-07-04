import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll window
    window.scrollTo(0, 0);
    
    // Also scroll the main container if it exists (for layouts like AdminLayout)
    const mainAreas = document.querySelectorAll('main, .overflow-y-auto');
    mainAreas.forEach(area => {
      area.scrollTo(0, 0);
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
