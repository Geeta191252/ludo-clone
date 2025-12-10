import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useViewportControl = () => {
  const location = useLocation();
  
  useEffect(() => {
    const isAdminRoute = location.pathname.startsWith('/admin');
    const viewport = document.querySelector('meta[name="viewport"]');
    
    if (viewport) {
      if (isAdminRoute) {
        // Admin: Allow desktop scaling
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      } else {
        // Main site: Force mobile viewport, prevent desktop mode zoom out
        viewport.setAttribute('content', 'width=520, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }
    }
  }, [location.pathname]);
};
