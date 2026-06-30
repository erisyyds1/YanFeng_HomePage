import React from 'react';

interface SiteFooterProps {
  height: string;
  mainGroupNumber: string;
  onSunflowerDoubleClick: () => void;
  onBackToPage: () => void;
}

const SiteFooter: React.FC<SiteFooterProps> = ({ height, mainGroupNumber, onSunflowerDoubleClick, onBackToPage }) => {
  return (
    <footer
      className="absolute bottom-0 left-0 right-0 z-0 overflow-hidden bg-[#202421] text-white"
      style={{ height }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/35"></div>
      <div className="pointer-events-none absolute left-0 top-0 h-28 w-full bg-[linear-gradient(180deg,rgba(0,0,0,0.5),transparent)]"></div>
      <div className="mx-auto grid h-full max-w-[1500px] grid-cols-[0.75fr_1.25fr] items-center gap-12 px-10 py-10">
        <div className="flex flex-col gap-6">
          <img src="/image/yanfeng-logo-wordmark.png" alt="檐枫动漫社" className="h-16 w-fit max-w-full object-contain opacity-95" />
          <div className="flex w-fit items-center gap-3 bg-black/22 px-4 py-3">
            <img
              src="/image/向日葵.png"
              alt="向日葵"
              draggable={false}
              onDoubleClick={onSunflowerDoubleClick}
              className="h-14 w-14 cursor-pointer select-none object-cover"
            />
            <span>
              <span className="block text-[10px] font-black tracking-[0.22em] text-[#c8322a]">SITE BUILDER</span>
              <span className="mt-1 block text-lg font-black tracking-[0.08em] text-white">向日葵</span>
            </span>
          </div>
        </div>

        <div className="grid gap-5 text-sm font-bold leading-relaxed text-white/48">
          <div className="grid gap-x-10 gap-y-2 sm:grid-cols-2">
            <p>QQ群 {mainGroupNumber}</p>
            <p>Bilibili 檐枫动漫社</p>
            <p>公众号 涧桐现视研</p>
            <p>北京邮电大学 ACGN 爱好者的聚集地</p>
          </div>
          <p>部分视觉素材由檐枫动漫社创作组成员提供，感谢各位的创作。</p>
          <div className="h-px bg-white/16"></div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <p>Copyright © YANFENG ACGN FAN CLUB. Site under construction.</p>
            <button type="button" onClick={onBackToPage} className="text-xs font-black tracking-[0.18em] text-white/72 transition hover:text-[#c8322a]">
              BACK TO PAGE
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
