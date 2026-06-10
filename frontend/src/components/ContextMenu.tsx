import React, { useEffect, useRef, useState } from 'react';

export interface ContextMenuOption {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  options: ContextMenuOption[];
  onClose: () => void;
}

export const ContextMenu = ({ x, y, options, onClose }: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ left: x, top: y });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Adjust coordinates once menu mounts and we know its size
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 8;
      }
      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 8;
      }

      setCoords({ left: adjustedX, top: adjustedY });
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: `${coords.left}px`,
        top: `${coords.top}px`,
        zIndex: 1000,
      }}
      className="bg-white border border-[#242424] shadow-md py-1 min-w-[160px] animate-in fade-in zoom-in-95 duration-100 ease-out select-none"
    >
      {options.map((option, idx) => (
        <button
          key={idx}
          onClick={(e) => {
            e.stopPropagation();
            option.onClick();
            onClose();
          }}
          className={`w-full text-left px-3 py-1.5 text-xs font-bold tracking-tight uppercase flex items-center space-x-2 transition-colors duration-150 ${
            option.danger
              ? 'text-red-600 hover:bg-red-50'
              : 'text-[#242424] hover:bg-gray-100'
          }`}
        >
          {option.icon && <span className="opacity-70">{option.icon}</span>}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
};
