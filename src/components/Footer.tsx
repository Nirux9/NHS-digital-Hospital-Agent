import React from 'react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-100/90 border-t border-slate-200/80 py-3 px-4 lg:px-6 text-xs text-slate-600 flex flex-col md:flex-row items-center justify-between gap-2 mt-auto z-10 no-print">
      <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
        <span className="bg-[#003087] text-white text-[10px] font-black px-1.5 py-0.5 rounded-sm">NHS</span>
        <span className="font-semibold text-slate-700">
          © {currentYear} NHS Digital Hospital Agent · Central Region Trust · DCB0129 Safety Verified
        </span>
      </div>

      <div className="flex items-center gap-4 text-slate-500 font-semibold text-[11px] pr-28 md:pr-32 lg:pr-36">
        <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-slate-900 transition-colors">
          Privacy Policy
        </a>
        <a href="#accessibility" onClick={(e) => e.preventDefault()} className="hover:text-slate-900 transition-colors">
          Accessibility Statement
        </a>
        <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-slate-900 transition-colors">
          Terms of Use
        </a>
      </div>
    </footer>
  );
};
