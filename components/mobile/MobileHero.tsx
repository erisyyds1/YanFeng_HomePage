import React from 'react';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { MOBILE_HERO_IMAGE } from '../../data/mobileImages';
import type { AnchorId } from '../../types';

interface MobileHeroProps {
  onNavigate: (target: AnchorId) => void;
}

const MobileHero: React.FC<MobileHeroProps> = ({ onNavigate }) => {
  return (
    <section id="home" data-mobile-section="home" className="relative min-h-[100dvh] overflow-hidden px-5 pb-8 pt-[86px]">
      <img
        src={MOBILE_HERO_IMAGE}
        alt="檐枫动漫社主视觉"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: '64% 42%' }}
      />
      <div className="absolute inset-0 bg-black/54"></div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.88),rgba(0,0,0,0.34)_48%,rgba(0,0,0,0.76))]"></div>
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-[linear-gradient(0deg,#080808,rgba(8,8,8,0))]"></div>

      <div className="relative z-10 flex min-h-[calc(100dvh-118px)] flex-col justify-between">
        <div className="flex items-start">
          <div className="mt-2 max-w-[320px] border-l-2 border-[#c8322a] pl-3">
            <p className="font-mono text-[10px] font-black uppercase leading-relaxed tracking-[0.25em] text-[#c8322a]">YANFENG ACGN</p>
            <h1 className="mt-3 text-[clamp(2.75rem,13vw,4rem)] font-black leading-[0.92] tracking-normal text-white drop-shadow-[0_10px_24px_rgba(0,0,0,0.5)]">
              檐枫动漫社
            </h1>
          </div>
        </div>

        <div className="pb-2">
          <p className="max-w-[330px] text-lg font-black leading-relaxed text-white">
            看番、宅舞、Wota 艺、创作、唱歌、乐队、舞台剧和 cosplay，在这里都能找到同好。
          </p>

          <div className="mt-6 grid gap-3">
            <button
              type="button"
              onClick={() => onNavigate('about')}
              className="flex min-h-[52px] w-full items-center justify-between bg-[#c8322a] px-5 text-sm font-black tracking-[0.16em] text-white"
            >
              查看情报
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('join')}
              className="flex min-h-[52px] w-full items-center justify-between border border-white/28 bg-black/62 px-5 text-sm font-black tracking-[0.16em] text-white backdrop-blur-sm"
            >
              加入 QQ 群
              <MessageCircle className="h-5 w-5 text-[#c8322a]" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MobileHero;
