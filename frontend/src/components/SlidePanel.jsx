import { useEffect } from 'react';
import Icon from './Icon.jsx';

// Full-screen sheet on phones (keyboard-friendly), right-side drawer on desktop.
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
      <div className="absolute inset-0 hidden animate-fade-in bg-slate-900/40 backdrop-blur-[2px] sm:block" onClick={onClose} />
      <div
        className="absolute inset-0 flex animate-sheet-up flex-col bg-white
                   sm:inset-y-0 sm:left-auto sm:right-0 sm:w-full sm:max-w-md sm:animate-slide-in sm:shadow-drawer"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3.5 pt-[calc(0.875rem+env(safe-area-inset-top))] sm:pt-3.5">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button className="icon-btn -mr-1" onClick={onClose} aria-label="Close">
            <Icon name="x" size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );
}
