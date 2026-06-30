import React from 'react';
import { ArrowRight, Send } from 'lucide-react';
import { HERO_IMAGE } from '../data/siteContent';
import type { AnchorId } from '../types';

interface HomePageProps {
  onNavigate: (target: AnchorId) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <>
      <img src={HERO_IMAGE} alt="檐枫娘主视觉" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: '66% 42%' }} />
      <div className="absolute inset-0 bg-black/35"></div>
      <div className="absolute inset-y-0 left-0 w-full bg-[linear-gradient(90deg,#080808_0%,rgba(8,8,8,.86)_34%,rgba(8,8,8,.45)_58%,rgba(8,8,8,.08)_100%)]"></div>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-[linear-gradient(0deg,#080808_0%,rgba(8,8,8,0)_100%)]"></div>

      <div className="relative z-10 mx-auto grid h-full max-w-[1600px] content-center px-5 py-8 md:px-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="max-w-3xl">
          <p className="text-sm font-black tracking-[0.45em] text-[#c8322a] md:text-base">北京邮电大学 ACGN 爱好者的聚集地</p>
          <h1 className="mt-4 text-[4.5rem] font-black leading-[0.86] tracking-[-0.06em] text-white md:text-[7rem] xl:text-[9rem]">
            檐枫
            <span className="block text-[#c8322a]">动漫社</span>
          </h1>
          <p className="mt-7 max-w-xl text-xl font-black leading-relaxed text-white md:text-2xl">
            看番、宅舞、wota艺、创作、唱歌、乐队，舞台剧，cosplay，术力口，包罗万象的二次元社团。
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => onNavigate('about')}
              className="group flex items-center justify-center gap-3 bg-[#c8322a] px-7 py-4 text-sm font-black tracking-[0.18em] text-white shadow-[6px_6px_0_#000] transition hover:-translate-y-1"
            >
              更多情报
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('join')}
              className="flex items-center justify-center gap-3 border border-white/50 bg-black/55 px-7 py-4 text-sm font-black tracking-[0.18em] text-white shadow-[6px_6px_0_#000] transition hover:-translate-y-1 hover:border-white"
            >
              加入我们
              <Send className="h-5 w-5 text-[#c8322a]" />
            </button>
          </div>
        </div>

        <div className="mt-12 flex items-end justify-start lg:mt-0 lg:justify-end">
          <div className="w-full max-w-xl border-l-4 border-[#c8322a] bg-black/55 p-5 backdrop-blur-sm">
            <div className="grid grid-cols-2 gap-px bg-white/20 text-sm">
              {[
                ['超多活跃成员', '历年动漫社大群接近千人，轻松找到同好'],
                ['超多精彩活动', '百团大战，GMA，冬日庆典 / 社庆'],
                ['零门槛加入', '无社费无审核，零门槛加入'],
                ['自由参加', '自由参加喜欢的活动，无绑定无强制']
              ].map(([label, value]) => (
                <div key={label} className="min-h-[118px] bg-[#111] p-5">
                  <p className="text-sm font-black leading-snug tracking-[0.08em] text-[#c8322a] md:text-base">{label}</p>
                  <p className="mt-3 text-lg font-black leading-snug text-white md:text-xl">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm font-bold leading-relaxed text-white/70">
              这里首先是大家一起开心玩的地方。没有基础，浓度不高都没有关系，都欢迎加入。
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;
