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
    const { clientX, clientY } = e;
    
    // Magnetic zone: top-left corner (100px x 60px)
    if (clientX <= 100 && clientY <= 60 && !isNavVisible) {
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

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dblclick', handleDoubleClick);
      if (navTimeoutRef.current) {
        clearTimeout(navTimeoutRef.current);
      }
    };
  }, [handleMouseMove, handleKeyDown, handleDoubleClick]);

  // Listen for canvas interaction events
  useEffect(() => {
    const handleCanvasInteraction = (e: Event) => {
      const target = e.target as HTMLElement;
      
      // Don't hide nav if clicking on the nav itself or user profile menu
      if (target.closest('header') || target.closest('[role="dialog"]')) {
        return;
      }
      
      // Hide nav when interacting with canvas elements
      if (
        target.classList.contains('tree-node') ||
        target.closest('.tree-node') ||
        target.classList.contains('canvas-toolbar') ||
        target.closest('.canvas-toolbar') ||
        target.classList.contains('canvas-background') ||
        target.tagName === 'CANVAS' ||
        (target.tagName === 'BUTTON' && !target.closest('header'))
      ) {
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
  }, [hideNav]);

  return {
    isNavVisible,
    hideNav,
    showNav,
    magneticZoneRef,
  };
}