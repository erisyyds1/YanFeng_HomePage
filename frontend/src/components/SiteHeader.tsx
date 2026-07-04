import React from 'react';
import { UserPlus } from 'lucide-react';
import { NAV_ITEMS } from '../data/siteContent';
import type { AnchorId } from '../types';

interface SiteHeaderProps {
  activeScreen: AnchorId;
  onNavigate: (target: AnchorId) => void;
}

const SiteHeader: React.FC<SiteHeaderProps> = ({ activeScreen, onNavigate }) => {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/72 backdrop-blur-md">
      <div className="flex h-[76px] items-stretch justify-between px-4 md:h-[92px] md:px-8 xl:px-12">
        <div className="flex w-[220px] shrink-0 items-center text-left md:w-[320px] xl:w-[380px]">
          <img
            src="/image/yanfeng-logo-wordmark.png"
            alt="檐枫动漫社"
            className="h-12 w-auto max-w-full object-contain md:h-14 xl:h-16"
          />
        </div>

        <nav className="hidden flex-1 items-stretch justify-center lg:flex">
          {NAV_ITEMS.map((item) => {
            const active = item.target === activeScreen;
            return (
              <button
                key={item.target}
                type="button"
                onClick={() => onNavigate(item.target)}
                className={`group flex min-w-[92px] flex-col items-center justify-center border-x border-white/[0.03] px-2 text-center transition hover:bg-white/[0.04] xl:min-w-[116px] 2xl:min-w-[136px] ${
                  active ? 'text-[#c8322a]' : 'text-white/82 hover:text-white'
                }`}
              >
                <span className="block text-[15px] font-black leading-none tracking-[0.05em] md:text-[18px] xl:text-[21px]">{item.labelEn}</span>
                <span className="mt-2 block text-[11px] font-black leading-none tracking-[0.1em] md:text-[13px]">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => onNavigate('join')}
          className="hidden w-[112px] shrink-0 flex-col items-center justify-center border-l border-white/10 bg-white/[0.03] text-white/75 transition hover:bg-[#c8322a] hover:text-white lg:flex xl:w-[136px]"
        >
          <UserPlus className="h-7 w-7 md:h-8 md:w-8" />
          <span className="mt-2 text-[11px] font-black tracking-[0.18em]">JOIN</span>
        </button>
      </div>
      <nav className="flex gap-2 overflow-x-auto border-t border-white/10 px-4 py-2 lg:hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.target}
              type="button"
              onClick={() => onNavigate(item.target)}
              className="flex shrink-0 items-center gap-2 border border-white/10 bg-black/45 px-3 py-2 text-[11px] font-black tracking-[0.12em] text-white/75 transition hover:border-[#c8322a] hover:bg-[#c8322a] hover:text-white"
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};

export default SiteHeader;
