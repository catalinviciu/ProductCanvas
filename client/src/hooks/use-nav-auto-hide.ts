import { useState, useEffect, useCallback, useRef } from 'react';

export function useNavAutoHide() {
  const [isNavVisible, setIsNavVisible] = useState(true);
  const navTimeoutRef = useRef<NodeJS.Timeout>();
  const magneticZoneRef = useRef<HTMLDivElement>(null);

  // Hide nav when user interacts with canvas elements
  const hideNav = useCallback(() => {
    setIsNavVisible(false);
  }, []);

  // Show nav with magnetic return
  const showNav = useCallback(() => {
    setIsNavVisible(true);
    // Clear any pending hide timeouts
    if (navTimeoutRef.current) {
      clearTimeout(navTimeoutRef.current);
    }
  }, []);

  // Handle mouse movement for magnetic zone
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const { clientY } = e;
    
    // Magnetic zone: entire top 60px strip
    if (clientY <= 60 && !isNavVisible) {
      showNav();
    }
  }, [isNavVisible, showNav]);

  // Handle escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && !isNavVisible) {
      showNav();
    }
  }, [isNavVisible, showNav]);

  // Handle double-click on empty canvas area
  const handleDoubleClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Check if double-click is on canvas background (not on nodes or UI elements)
    if (target.tagName === 'CANVAS' || target.classList.contains('canvas-background')) {
      if (!isNavVisible) {
        showNav();
      }
    }
  }, [isNavVisible, showNav]);

  // Set up event listeners
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dblclick', handleDoubleClick);

    // Listen for custom canvas events
    const handleCustomCanvasEvent = () => {
      if (isNavVisible) {
        hideNav();
      }
    };

    document.addEventListener('canvasInteraction', handleCustomCanvasEvent);
    document.addEventListener('nodeSelected', handleCustomCanvasEvent);
    document.addEventListener('nodeDragged', handleCustomCanvasEvent);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dblclick', handleDoubleClick);
      document.removeEventListener('canvasInteraction', handleCustomCanvasEvent);
      document.removeEventListener('nodeSelected', handleCustomCanvasEvent);
      document.removeEventListener('nodeDragged', handleCustomCanvasEvent);
      if (navTimeoutRef.current) {
        clearTimeout(navTimeoutRef.current);
      }
    };
  }, [handleMouseMove, handleKeyDown, handleDoubleClick, isNavVisible, hideNav]);

  // Listen for canvas interaction events
  useEffect(() => {
    const handleCanvasInteraction = (e: Event) => {
      const target = e.target as HTMLElement;
      
      // Don't hide nav if clicking on the nav itself or user profile menu
      if (target.closest('header') || target.closest('[role="dialog"]') || target.closest('[role="menu"]')) {
        return;
      }
      
      // Don't hide if we're in the magnetic zone (top 60px area)
      const { clientY } = e as MouseEvent;
      if (clientY <= 60) {
        return;
      }
      
      // Hide nav when interacting with canvas elements
      const isCanvasInteraction = (
        target.closest('.modern-canvas-container') ||
        target.closest('.canvas-toolbar') ||
        target.closest('.tree-node') ||
        target.closest('.zoom-controls-container') ||
        target.classList.contains('canvas-interaction-layer') ||
        target.classList.contains('modern-canvas-background') ||
        target.classList.contains('modern-grid-pattern')
      );
      
      if (isCanvasInteraction && isNavVisible) {
        hideNav();
      }
    };

    // Listen for various interaction events
    document.addEventListener('mousedown', handleCanvasInteraction);
    document.addEventListener('click', handleCanvasInteraction);
    document.addEventListener('touchstart', handleCanvasInteraction);
    
    return () => {
      document.removeEventListener('mousedown', handleCanvasInteraction);
      document.removeEventListener('click', handleCanvasInteraction);
      document.removeEventListener('touchstart', handleCanvasInteraction);
    };
  }, [hideNav, isNavVisible]);

  return {
    isNavVisible,
    hideNav,
    showNav,
    magneticZoneRef,
  };
}