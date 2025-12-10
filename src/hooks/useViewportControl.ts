import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

export const useViewportControl = () => {
  const location = useLocation();
  
  const isMobileDevice = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);
  
  const applyMobileScale = useCallback(() => {
    const isAdminRoute = location.pathname.startsWith('/admin');
    if (isAdminRoute) return;
    
    const container = document.querySelector('.mobile-container') as HTMLElement;
    if (!container) return;
    
    // If viewport is wider than mobile (desktop mode or actual desktop)
    if (window.innerWidth > 520) {
      const scale = window.innerWidth / 520;
      container.style.transform = `scale(${scale})`;
      container.style.transformOrigin = 'top left';
      container.style.width = '520px';
      container.style.height = 'auto';
      container.style.minHeight = '100vh';
      container.style.marginLeft = '0';
      container.style.marginRight = 'auto';
      
      // Prevent body from scrolling beyond content
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      container.style.overflowY = 'auto';
      container.style.maxHeight = `${100 / scale}vh`;
      
      // For mobile devices in desktop mode - fill entire screen
      if (isMobileDevice()) {
        container.style.transformOrigin = 'top left';
      }
    } else {
      container.style.transform = '';
      container.style.transformOrigin = '';
      container.style.width = '';
      container.style.height = '';
      container.style.minHeight = '';
      container.style.marginLeft = '';
      container.style.marginRight = '';
      container.style.overflowY = '';
      container.style.maxHeight = '';
      document.body.style.overflow = '';
      document.body.style.height = '';
    }
  }, [location.pathname, isMobileDevice]);
  
  useEffect(() => {
    const isAdminRoute = location.pathname.startsWith('/admin');
    const viewport = document.querySelector('meta[name="viewport"]');
    
    if (viewport) {
      if (isAdminRoute) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      } else {
        // Use device-width for normal mobile, scaling handles desktop mode
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }
    }
    
    // Apply scale for desktop mode
    applyMobileScale();
    
    window.addEventListener('resize', applyMobileScale);
    window.addEventListener('orientationchange', applyMobileScale);
    
    // Check periodically for desktop mode changes
    const interval = setInterval(applyMobileScale, 1000);
    
    return () => {
      window.removeEventListener('resize', applyMobileScale);
      window.removeEventListener('orientationchange', applyMobileScale);
      clearInterval(interval);
    };
  }, [location.pathname, applyMobileScale]);
};
