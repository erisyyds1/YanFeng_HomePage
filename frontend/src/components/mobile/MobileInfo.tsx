import React from 'react';
import { ArrowRight, MessageCircle, Sparkles, Users } from 'lucide-react';
import { INTEREST_GROUPS, OFFICIAL_GROUPS } from '../../data/siteContent';
import type { AnchorId } from '../../types';

interface MobileInfoProps {
  mainGroupNumber: string;
  onNavigate: (target: AnchorId) => void;
}

const MobileInfo: React.FC<MobileInfoProps> = ({ mainGroupNumber, onNavigate }) => {
  const cards = [
    {
      eyebrow: 'START / 01',
      title: 'QQ 大群',
      description: '先进入大群闲聊、了解活动通知和小组信息，再按兴趣加入各个小组，参加活动。',
      meta: mainGroupNumber,
      icon: MessageCircle,
      action: () => onNavigate('join')
    },
    {
      eyebrow: 'OFFICIAL / 02',
      title: '十大官方组',
      description: '稳定组织组活、节目排练和大型活动，是社团日常内容和提供节目的主力结构。',
      meta: `${OFFICIAL_GROUPS.length} GROUPS`,
      icon: Users,
      action: () => onNavigate('groups')
    },
    {
      eyebrow: 'INTEREST / 03',
      title: '兴趣组',
      description: '同好自发聚集起来的小组，有明日方舟、东方、Cos、配音、摄影剪辑等方向。',
      meta: `超多方向`,
      icon: Sparkles
    }
  ];

  return (
    <section id="about" data-mobile-section="about" className="relative overflow-hidden bg-[#090909] px-5 py-20">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.035)_1px,transparent_1px)] opacity-25 [background-size:88px_88px]"></div>
      <div className="pointer-events-none absolute right-0 top-0 h-full w-px bg-[#c8322a]/28"></div>

      <div className="relative z-10">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.38em] text-[#c8322a]">INFORMATION</p>
        <h2 className="mt-3 text-[2.75rem] font-black leading-[0.95] tracking-normal text-white">
          入社情报
          <span className="mt-1 block text-[#c8322a]">结构说明</span>
        </h2>
        <p className="mt-5 text-sm font-bold leading-loose text-white/62">
          先进入大群认识大家，了解小组和活动信息，自由加入官方组或兴趣组。活动自由参加，不需要提前准备复杂手续。
        </p>

        <div className="mt-8 grid gap-4">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <article key={card.title} className="border border-white/12 bg-[#111]/92 p-5 shadow-[6px_6px_0_rgba(0,0,0,0.32)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.28em] text-[#c8322a]">{card.eyebrow}</p>
                    <h3 className="mt-2 text-2xl font-black text-white">{card.title}</h3>
                  </div>
                  <span className="grid h-11 w-11 shrink-0 place-items-center bg-[#c8322a] text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-4 text-sm font-bold leading-relaxed text-white/64">{card.description}</p>
                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="font-mono text-sm font-black tracking-[0.08em] text-white/82">{card.meta}</span>
                  {card.action && (
                    <button type="button" onClick={card.action} className="flex items-center gap-2 text-xs font-black tracking-[0.18em] text-[#c8322a]">
                      VIEW
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MobileInfo;
