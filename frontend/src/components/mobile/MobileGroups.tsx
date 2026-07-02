import React from 'react';
import { Check, Copy, Hash } from 'lucide-react';
import { INTEREST_GROUPS, OFFICIAL_GROUPS } from '../../data/siteContent';
import { getMobileGroupImage } from '../../data/mobileImages';
import type { OfficialGroup } from '../../types';

interface MobileGroupsProps {
  selectedGroup: number;
  copiedGroupTitle: string | null;
  onSelectGroup: (index: number) => void;
  onCopyGroup: (group: OfficialGroup) => void | Promise<void>;
}

const MobileGroups: React.FC<MobileGroupsProps> = ({ selectedGroup, copiedGroupTitle, onSelectGroup, onCopyGroup }) => {
  const activeGroup = OFFICIAL_GROUPS[selectedGroup] || OFFICIAL_GROUPS[0];
  const activeGroupImage = getMobileGroupImage(activeGroup.image);
  const GroupIcon = activeGroup.icon;
  const canCopy = activeGroup.qq.trim() !== '' && activeGroup.qq !== '待补充';
  const copied = copiedGroupTitle === activeGroup.title;

  return (
    <section id="groups" data-mobile-section="groups" className="relative overflow-hidden bg-[#0b0b0b] px-5 py-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/12"></div>
      <div className="relative z-10">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.38em] text-[#c8322a]">GROUPS</p>
        <h2 className="mt-3 text-[2.75rem] font-black leading-none tracking-normal text-white">十大官方组</h2>
        <p className="mt-4 text-sm font-bold leading-relaxed text-white/58">可以同时加入多个组，无加入限制，无强制绑定。</p>
      </div>

      <div className="mobile-tab-scroll relative z-10 -mx-5 mt-7 flex gap-2 overflow-x-auto px-5 pb-2">
        {OFFICIAL_GROUPS.map((group, index) => {
          const Icon = group.icon;
          const active = index === selectedGroup;

          return (
            <button
              key={group.title}
              type="button"
              onClick={() => onSelectGroup(index)}
              className={`flex min-h-[50px] shrink-0 items-center gap-2 border px-4 text-left transition ${
                active ? 'border-[#c8322a] bg-[#c8322a] text-white' : 'border-white/12 bg-[#141414] text-white/62'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>
                <span className="block text-sm font-black leading-none">{group.title}</span>
                <span className="mt-1 block font-mono text-[10px] font-black uppercase leading-none tracking-[0.2em] opacity-70">{group.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      <article className="relative z-10 mt-4 overflow-hidden border border-white/12 bg-[#111] shadow-[6px_6px_0_rgba(0,0,0,0.34)]">
        <div className="relative aspect-[4/3] bg-black">
          <img
            key={activeGroupImage}
            src={activeGroupImage}
            alt={`${activeGroup.title}活动照片`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.82),rgba(0,0,0,0.12)_62%)]"></div>
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.28em] text-[#c8322a]">{activeGroup.label}</p>
              <h3 className="mt-1 text-3xl font-black leading-none text-white">{activeGroup.title}</h3>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center bg-[#c8322a] text-white">
              <GroupIcon className="h-6 w-6" />
            </span>
          </div>
        </div>

        <div className="p-5">
          <p className="text-base font-black leading-relaxed text-white">{activeGroup.description}</p>
          <p className="mt-3 text-sm font-bold leading-relaxed text-white/56">{activeGroup.newcomerNote}</p>

          <div className="mt-5 border border-white/12 bg-black/48 p-4">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.26em] text-[#c8322a]">QQ GROUP</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="min-w-0 break-all font-mono text-2xl font-black tracking-[0.08em] text-white">{activeGroup.qq}</span>
              <button
                type="button"
                onClick={() => void onCopyGroup(activeGroup)}
                disabled={!canCopy}
                className={`flex h-11 shrink-0 items-center gap-2 px-4 text-xs font-black tracking-[0.14em] ${
                  canCopy ? 'bg-[#c8322a] text-white' : 'cursor-not-allowed bg-white/10 text-white/34'
                }`}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? '已复制' : '复制'}
              </button>
            </div>
          </div>

          <div className="mt-5">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.28em] text-[#c8322a]">COMMON ACTIVITIES</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {activeGroup.activities.map((activity) => (
                <span key={activity} className="border border-white/14 bg-white/[0.04] px-3 py-2 text-xs font-black text-white/70">
                  {activity}
                </span>
              ))}
            </div>
          </div>
        </div>
      </article>

      <div className="relative z-10 mt-7 border-y border-white/12 py-4">
        <div className="flex items-center gap-2 text-[#c8322a]">
          <Hash className="h-4 w-4" />
          <span className="text-xs font-black tracking-[0.18em]">兴趣组</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {INTEREST_GROUPS.map((group) => (
            <span key={group} className="bg-white px-3 py-2 text-xs font-black text-black">
              {group}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MobileGroups;
