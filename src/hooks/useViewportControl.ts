import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

export const useViewportControl = () => {
  const location = useLocation();
  
  const setViewport = useCallback((isAdmin: boolean) => {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      if (isAdmin) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      } else {
        // Force mobile viewport - completely disable desktop mode
        viewport.setAttribute('content', 'width=520, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }
    }
  }, []);
  
  useEffect(() => {
    const isAdminRoute = location.pathname.startsWith('/admin');
    
    // Set immediately
    setViewport(isAdminRoute);
    
    // Also set on visibility change (when user switches tabs/apps)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setViewport(isAdminRoute);
      }
    };
    
    // Re-apply on focus (when browser tab becomes active)
    const handleFocus = () => {
      setViewport(isAdminRoute);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    // Run every 500ms to counter any browser desktop mode override
    const interval = setInterval(() => {
      setViewport(isAdminRoute);
    }, 500);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [location.pathname, setViewport]);
};
