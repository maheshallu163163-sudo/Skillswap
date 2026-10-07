import React, { useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2, 9)}`).current;
  const subtitleId = useRef(`modal-desc-${Math.random().toString(36).slice(2, 9)}`).current;

  // Body scroll lock & Keyboard escape handling (Requirements 6 & 9)
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Shift focus into dialog for accessibility
    const timer = setTimeout(() => {
      if (dialogRef.current) {
        dialogRef.current.focus();
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  }[maxWidth];

  const modalMarkup = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:pb-6 overflow-hidden"
      role="presentation"
    >
      {/* 1. Modal Backdrop (z-50) */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Modal Dialog (z-[60], Centered, Responsive, Independent Scrollable Content) */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        className={`relative z-[60] flex flex-col w-[calc(100%-1rem)] sm:w-full ${widthClass} max-h-[calc(100dvh-5.5rem-env(safe-area-inset-bottom,0px))] sm:max-h-[calc(100dvh-4rem)] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100/80 overflow-hidden outline-none transition-all animate-scale-up`}
      >
        {/* Pinned Header (Header remains visible while content scrolls) */}
        <div className="shrink-0 flex items-start justify-between p-4 sm:p-6 border-b border-slate-100 bg-white">
          <div className="pr-4">
            <h3 id={titleId} className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug">
              {title}
            </h3>
            {subtitle && (
              <p id={subtitleId} className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-xl p-2 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content (Only the content section scrolls) */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );

  // Render via portal directly into document.body to prevent parent stacking context traps
  if (typeof document !== 'undefined') {
    return createPortal(modalMarkup, document.body);
  }

  return modalMarkup;
};
