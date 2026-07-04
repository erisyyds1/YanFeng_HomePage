import React from 'react';
import { Menu, MessageCircle, Music2, Newspaper, Radio, UserPlus, Volume2, VolumeX, X } from 'lucide-react';
import type { AnchorId } from '../../types';
import { MOBILE_LOGO_IMAGE } from '../../data/mobileImages';
import { MOBILE_NAV_ITEMS } from './mobileNavigation';

interface MobileHeaderProps {
  activeSection: AnchorId;
  menuOpen: boolean;
  radioPlaying: boolean;
  onNavigate: (target: AnchorId) => void;
  onMenuToggle: () => void;
  onMenuClose: () => void;
  onToggleRadio: () => void | Promise<void>;
  onOpenMediaEntry: (entry: 'videos' | 'wechat') => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  activeSection,
  menuOpen,
  radioPlaying,
  onNavigate,
  onMenuToggle,
  onMenuClose,
  onToggleRadio,
  onOpenMediaEntry
}) => {
  const navigateAndClose = (target: AnchorId) => {
    onNavigate(target);
    onMenuClose();
  };

  const openMediaAndClose = (entry: 'videos' | 'wechat') => {
    onOpenMediaEntry(entry);
    onMenuClose();
  };

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-[80] border-b border-white/12 bg-black/78 backdrop-blur-md">
        <div className="flex h-[64px] items-center justify-between gap-3 px-3">
          <button type="button" onClick={() => navigateAndClose('home')} className="flex min-w-0 items-center">
            <img src={MOBILE_LOGO_IMAGE} alt="檐枫动漫社" className="h-9 max-w-[128px] object-contain sm:h-10 sm:max-w-[150px]" />
          </button>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => void onToggleRadio()}
              data-radio-control="true"
              aria-label={radioPlaying ? '关闭音乐' : '播放音乐'}
              className="grid h-10 w-10 place-items-center border border-white/14 bg-white/[0.06] text-white transition active:scale-95"
            >
              {radioPlaying ? <Volume2 className="h-5 w-5 text-[#c8322a]" /> : <VolumeX className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={() => navigateAndClose('join')}
              aria-label="加入我们"
              className="grid h-10 w-10 place-items-center bg-[#c8322a] text-white transition active:scale-95"
            >
              <UserPlus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onMenuToggle}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? '关闭菜单' : '打开菜单'}
              className="grid h-10 w-10 place-items-center border border-white/14 bg-white/[0.06] text-white transition active:scale-95"
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/94 px-5 pb-8 pt-[78px] text-white backdrop-blur-md">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.04)_1px,transparent_1px)] opacity-25 [background-size:72px_72px]"></div>

          <nav className="relative z-10 grid gap-1">
            {MOBILE_NAV_ITEMS.map((item, index) => {
              const active = activeSection === item.target;

              return (
                <button
                  key={item.target}
                  type="button"
                  onClick={() => navigateAndClose(item.target)}
                  className={`group flex min-h-[70px] items-center justify-between border-b px-1 text-left transition ${
                    active ? 'border-[#c8322a] text-[#c8322a]' : 'border-white/12 text-white'
                  }`}
                >
                  <span className="flex min-w-0 items-baseline gap-3">
                    <span className="font-mono text-[10px] font-black text-white/36">{String(index + 1).padStart(2, '0')}</span>
                    <span className="truncate font-mono text-[clamp(2rem,10vw,4.2rem)] font-black leading-none tracking-[-0.02em]">
                      {item.labelEn}
                    </span>
                  </span>
                  <span className={`shrink-0 pl-3 text-sm font-black tracking-[0.18em] ${active ? 'text-[#c8322a]' : 'text-white/64'}`}>
                    {item.labelZh}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="relative z-10 mt-10 border-t border-white/14 pt-5">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.34em] text-[#c8322a]">CONTACT / LINKS</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => navigateAndClose('join')}
                className="grid min-h-[74px] place-items-center border border-white/14 bg-white/[0.05] px-2 text-center text-xs font-black text-white/72"
              >
                <MessageCircle className="h-5 w-5 text-[#c8322a]" />
                QQ
              </button>
              <button
                type="button"
                onClick={() => openMediaAndClose('videos')}
                className="grid min-h-[74px] place-items-center border border-white/14 bg-white/[0.05] px-2 text-center text-xs font-black text-white/72"
              >
                <Radio className="h-5 w-5 text-[#c8322a]" />
                Bilibili
              </button>
              <button
                type="button"
                onClick={() => openMediaAndClose('wechat')}
                className="grid min-h-[74px] place-items-center border border-white/14 bg-white/[0.05] px-2 text-center text-xs font-black text-white/72"
              >
                <Newspaper className="h-5 w-5 text-[#c8322a]" />
                公众号
              </button>
            </div>
            <div className="mt-6 flex items-center gap-2 text-white/34">
              <Music2 className="h-4 w-4" />
              <span className="font-mono text-[10px] font-black uppercase tracking-[0.24em]">YANFENG MOBILE INDEX</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileHeader;
