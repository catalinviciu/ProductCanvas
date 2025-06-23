import { useEffect, useRef, useState, memo, useCallback, useMemo } from "react";
import { type NodeType, type TestCategory } from "@shared/schema";

interface CanvasContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onNodeCreate: (type: NodeType, testCategory?: TestCategory) => void;
}

const CanvasContextMenuComponent = memo(function CanvasContextMenu({
  isOpen,
  position,
  onClose,
  onNodeCreate,
}: CanvasContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Memoize click outside handler
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  // Reset position when menu opens
  useEffect(() => {
    if (isOpen) {
      setAdjustedPosition(position);
    }
  }, [isOpen, position]);

  // Memoize position adjustment calculation
  const calculateAdjustedPosition = useCallback(() => {
    if (!menuRef.current || !isOpen) return;

    const menuElement = menuRef.current;
    const menuRect = menuElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let newX = position.x;
    let newY = position.y;

    // Adjust horizontal position if menu would overflow right edge
    if (position.x + menuRect.width > viewportWidth) {
      newX = viewportWidth - menuRect.width - 10;
    }

    // Adjust horizontal position if menu would overflow left edge
    if (newX < 10) {
      newX = 10;
    }

    // Adjust vertical position if menu would overflow bottom edge
    if (position.y + menuRect.height > viewportHeight) {
      newY = viewportHeight - menuRect.height - 10;
    }

    // Adjust vertical position if menu would overflow top edge
    if (newY < 10) {
      newY = 10;
    }

    setAdjustedPosition({ x: newX, y: newY });
  }, [isOpen, position]);

  // Calculate adjusted position to keep menu within viewport
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(calculateAdjustedPosition, 0);
    return () => clearTimeout(timer);
  }, [isOpen, calculateAdjustedPosition]);

  // Memoize node creation handler
  const handleNodeCreate = useCallback((type: NodeType, testCategory?: TestCategory) => {
    onNodeCreate(type, testCategory);
    onClose();
  }, [onNodeCreate, onClose]);

  // Memoize menu style
  const menuStyle = useMemo(() => ({
    left: adjustedPosition.x,
    top: adjustedPosition.y,
  }), [adjustedPosition.x, adjustedPosition.y]);

  // Memoize menu items for performance
  const menuItems = useMemo(() => [
    {
      type: 'outcome' as NodeType,
      icon: 'fas fa-bullseye',
      color: 'var(--primary-indigo)',
      hoverClass: 'hover:bg-muted',
      title: 'Outcome',
      description: 'Business goal or result'
    },
    {
      type: 'opportunity' as NodeType,
      icon: 'fas fa-lightbulb',
      color: 'var(--secondary-purple)',
      hoverClass: 'hover:bg-purple-50',
      title: 'Opportunity',
      description: 'Market or user opportunity'
    },
    {
      type: 'solution' as NodeType,
      icon: 'fas fa-cog',
      color: 'var(--accent-emerald)',
      hoverClass: 'hover:bg-emerald-50',
      title: 'Solution',
      description: 'Product or feature approach'
    },
    {
      type: 'assumption' as NodeType,
      testCategory: 'viability' as TestCategory,
      icon: 'fas fa-flask',
      color: 'var(--orange-test)',
      hoverClass: 'hover:bg-orange-50',
      title: 'Assumption Test',
      description: 'Hypothesis to validate'
    },
    {
      type: 'kpi' as NodeType,
      icon: 'fas fa-chart-line',
      color: 'var(--kpi-color)',
      hoverClass: 'hover:bg-yellow-50',
      title: 'KPI',
      description: 'Key performance indicator'
    }
  ], []);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="modern-context-menu"
      style={menuStyle}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div className="context-menu-header">
        <div className="context-menu-title">
          <i className="fas fa-plus-circle"></i>
          Create Node
        </div>
      </div>
      <div className="context-menu-content">
        {menuItems.map((item) => (
          <button 
            key={item.type}
            onClick={() => handleNodeCreate(item.type, item.testCategory)}
            className="context-menu-item"
          >
            <div className="menu-item-icon" style={{ color: item.color }}>
              <i className={item.icon}></i>
            </div>
            <div className="menu-item-content">
              <div className="menu-item-title">{item.title}</div>
              <div className="menu-item-description">{item.description}</div>
            </div>
            <div className="menu-item-arrow">
              <i className="fas fa-chevron-right"></i>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

// Export the memoized component
export const CanvasContextMenu = CanvasContextMenuComponent;