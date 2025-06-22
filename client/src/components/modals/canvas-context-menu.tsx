import { useEffect, useRef, useState } from "react";
import { type NodeType, type TestCategory } from "@shared/schema";

interface CanvasContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onNodeCreate: (type: NodeType, testCategory?: TestCategory) => void;
}

export function CanvasContextMenu({
  isOpen,
  position,
  onClose,
  onNodeCreate,
}: CanvasContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Reset position when menu opens
  useEffect(() => {
    if (isOpen) {
      setAdjustedPosition(position);
    }
  }, [isOpen, position]);

  // Calculate adjusted position to keep menu within viewport
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (!menuRef.current) return;

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
    }, 0);

    return () => clearTimeout(timer);
  }, [isOpen, position]);

  if (!isOpen) return null;

  const handleNodeCreate = (type: NodeType, testCategory?: TestCategory) => {
    onNodeCreate(type, testCategory);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px]"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div className="px-4 py-2">
        <div className="text-xs font-medium text-gray-500 mb-2">Create Node</div>
        <div className="space-y-1">
          <button 
            onClick={() => handleNodeCreate('outcome')}
            className="w-full px-3 py-2 text-sm text-left hover:bg-blue-50 rounded flex items-center transition-colors"
          >
            <i className="fas fa-bullseye mr-3 text-sm" style={{ color: 'var(--primary-indigo)' }}></i>
            <div>
              <div className="font-medium text-gray-900">Outcome</div>
              <div className="text-xs text-gray-500">Business goal or result</div>
            </div>
          </button>
          <button 
            onClick={() => handleNodeCreate('opportunity')}
            className="w-full px-3 py-2 text-sm text-left hover:bg-purple-50 rounded flex items-center transition-colors"
          >
            <i className="fas fa-lightbulb mr-3 text-sm" style={{ color: 'var(--secondary-purple)' }}></i>
            <div>
              <div className="font-medium text-gray-900">Opportunity</div>
              <div className="text-xs text-gray-500">Market or user opportunity</div>
            </div>
          </button>
          <button 
            onClick={() => handleNodeCreate('solution')}
            className="w-full px-3 py-2 text-sm text-left hover:bg-emerald-50 rounded flex items-center transition-colors"
          >
            <i className="fas fa-cog mr-3 text-sm" style={{ color: 'var(--accent-emerald)' }}></i>
            <div>
              <div className="font-medium text-gray-900">Solution</div>
              <div className="text-xs text-gray-500">Product or feature approach</div>
            </div>
          </button>
          <button 
            onClick={() => handleNodeCreate('assumption', 'viability')}
            className="w-full px-3 py-2 text-sm text-left hover:bg-orange-50 rounded flex items-center transition-colors"
          >
            <i className="fas fa-flask mr-3 text-sm" style={{ color: 'var(--orange-test)' }}></i>
            <div>
              <div className="font-medium text-gray-900">Assumption Test</div>
              <div className="text-xs text-gray-500">Hypothesis to validate</div>
            </div>
          </button>
          <button 
            onClick={() => handleNodeCreate('kpi')}
            className="w-full px-3 py-2 text-sm text-left hover:bg-yellow-50 rounded flex items-center transition-colors"
          >
            <i className="fas fa-chart-line mr-3 text-sm" style={{ color: 'var(--kpi-color)' }}></i>
            <div>
              <div className="font-medium text-gray-900">KPI</div>
              <div className="text-xs text-gray-500">Key performance indicator</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}