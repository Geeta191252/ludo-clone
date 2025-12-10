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
    
    // If mobile device but viewport is wide (desktop mode enabled)
    if (isMobileDevice() && window.innerWidth > 600) {
      const scale = window.innerWidth / 520;
      container.style.transform = `scale(${scale})`;
      container.style.transformOrigin = 'top center';
      container.style.width = '520px';
      container.style.minHeight = `${100 / scale}vh`;
    } else {
      container.style.transform = '';
      container.style.transformOrigin = '';
      container.style.width = '';
      container.style.minHeight = '';
    }
  }, [location.pathname, isMobileDevice]);
  
  useEffect(() => {
    const isAdminRoute = location.pathname.startsWith('/admin');
    const viewport = document.querySelector('meta[name="viewport"]');
    
    if (viewport) {
      if (isAdminRoute) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      } else {
        viewport.setAttribute('content', 'width=520, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
      }
    }
    
    // Apply scale for mobile devices in desktop mode
    applyMobileScale();
    
    window.addEventListener('resize', applyMobileScale);
    window.addEventListener('orientationchange', applyMobileScale);
    
    return () => {
      window.removeEventListener('resize', applyMobileScale);
      window.removeEventListener('orientationchange', applyMobileScale);
    };
  }, [location.pathname, applyMobileScale]);
};
