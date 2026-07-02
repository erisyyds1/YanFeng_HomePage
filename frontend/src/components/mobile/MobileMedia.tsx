import React from 'react';
import { ArrowRight } from 'lucide-react';
import { getMediaEntry, type MediaContentId } from '../MediaHub';

interface MobileMediaProps {
  onOpenEntry: (entry: MediaContentId) => void;
}

const MEDIA_CARDS: {
  id: MediaContentId;
  title: string;
  label: string;
  description: string;
  image: string;
}[] = [
  {
    id: 'videos',
    title: '视频展示',
    label: 'VIDEO',
    description: '社庆、冬日庆典、GMA与活动录像。',
    image: '/image/mobile-activity-winter.webp'
  },
  {
    id: 'gallery',
    title: '檐枫图集',
    label: 'GALLERY',
    description: '创作组原创内容集合。',
    image: '/image/mobile-gallery-yanfeng-character.webp'
  },
  {
    id: 'wechat',
    title: '檐枫推文',
    label: 'WECHAT',
    description: '公众号推文、通知与活动回顾。',
    image: '/image/mobile-group-delta.webp'
  },
  {
    id: 'vocaloid',
    title: 'V组专辑',
    label: 'VOCALOID',
    description: 'VOCALOID 组原创作品集合。',
    image: '/image/mobile-group-vocaloid.webp'
  }
];

const MobileMedia: React.FC<MobileMediaProps> = ({ onOpenEntry }) => {
  return (
    <section id="media" data-mobile-section="media" className="relative overflow-hidden bg-[#0a0a0a] px-5 py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(200,50,42,0.18),transparent_34%),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.03)_1px,transparent_1px)] opacity-80 [background-size:auto,90px_90px,90px_90px]"></div>

      <div className="relative z-10">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.38em] text-[#c8322a]">MORE CONTENT</p>
        <h2 className="mt-3 text-[2.75rem] font-black leading-none tracking-normal text-white">檐枫万象</h2>
        <p className="mt-4 text-sm font-bold leading-relaxed text-white/58">节目录像、图集、推文和 V 组专辑，超多产出，点击即可查看。</p>
      </div>

      <div className="relative z-10 mt-8 grid gap-4">
        {MEDIA_CARDS.map((card, index) => {
          const entry = getMediaEntry(card.id);
          const Icon = entry?.icon;

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onOpenEntry(card.id)}
              className="group relative min-h-[168px] overflow-hidden border border-white/12 bg-[#111] text-left shadow-[6px_6px_0_rgba(0,0,0,0.34)]"
            >
              <img src={card.image} alt={`${card.title}入口`} loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-52" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.88),rgba(0,0,0,0.38)_64%,rgba(200,50,42,0.18))]"></div>
              <div className="relative z-10 flex min-h-[168px] flex-col justify-between p-5">
                <div className="flex items-start justify-between gap-4">
                  <span className="font-mono text-xs font-black text-[#c8322a]">{String(index + 1).padStart(2, '0')}</span>
                  {Icon && (
                    <span className="grid h-11 w-11 place-items-center bg-[#c8322a] text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-[#c8322a]">{card.label}</p>
                  <div className="mt-2 flex items-end justify-between gap-4">
                    <div>
                      <h3 className="text-3xl font-black leading-none text-white">{card.title}</h3>
                      <p className="mt-3 text-sm font-bold leading-relaxed text-white/62">{card.description}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 shrink-0 text-white/76 transition group-active:translate-x-1" />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default MobileMedia;
