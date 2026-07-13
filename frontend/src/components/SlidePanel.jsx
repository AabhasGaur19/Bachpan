import { useEffect } from 'react';
import Icon from './Icon.jsx';

// Bottom sheet on phones, right-side drawer on larger screens.
export default function SlidePanel({ open, title, onClose, children }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    if (open) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="absolute inset-x-0 bottom-0 flex max-h-[90dvh] animate-sheet-up flex-col rounded-t-3xl bg-white shadow-drawer
                   sm:inset-y-0 sm:left-auto sm:right-0 sm:bottom-auto sm:h-[100dvh] sm:max-h-none sm:w-full sm:max-w-md sm:animate-slide-in sm:rounded-t-none"
      >
        <div className="relative flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-slate-200 sm:hidden" />
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button className="icon-btn -mr-2" onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );
}
