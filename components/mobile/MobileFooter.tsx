import React from 'react';
import { MOBILE_LOGO_IMAGE } from '../../data/mobileImages';

interface MobileFooterProps {
  mainGroupNumber: string;
}

const MobileFooter: React.FC<MobileFooterProps> = ({ mainGroupNumber }) => {
  return (
    <footer className="bg-[#151815] px-5 py-8 text-white">
      <div className="border-t border-white/14 pt-6">
        <img src={MOBILE_LOGO_IMAGE} alt="檐枫动漫社" loading="lazy" className="h-12 w-auto object-contain" />
        <div className="mt-5 flex w-fit items-center gap-3 bg-black/24 px-4 py-3">
          <img
            src="/image/向日葵.png"
            alt="向日葵"
            loading="lazy"
            draggable={false}
            className="h-12 w-12 select-none object-cover"
          />
          <span>
            <span className="block font-mono text-[10px] font-black uppercase tracking-[0.22em] text-[#c8322a]">SITE BUILDER</span>
            <span className="mt-1 block text-base font-black tracking-[0.08em] text-white">向日葵</span>
          </span>
        </div>
        <div className="mt-5 grid gap-2 text-xs font-bold leading-relaxed text-white/50">
          <p>QQ群 {mainGroupNumber}</p>
          <p>Bilibili 檐枫动漫社</p>
          <p>公众号 涧桐现视研</p>
        </div>
        <div className="mt-5 h-px bg-white/12"></div>
        <p className="mt-4 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-white/34">
          YANFENG ACGN FAN CLUB
        </p>
      </div>
    </footer>
  );
};

export default MobileFooter;
