import React from 'react';
import { ArrowRight, Check, ChevronRight } from 'lucide-react';
import { INTEREST_GROUPS, OFFICIAL_GROUPS } from '../data/siteContent';
import type { OfficialGroup } from '../types';

interface GroupsPageProps {
  selectedGroup: number;
  copiedGroupTitle: string | null;
  onSelectGroup: (index: number) => void;
  onCopyGroup: (group: OfficialGroup) => void | Promise<void>;
}

const GroupsPage: React.FC<GroupsPageProps> = ({ selectedGroup, copiedGroupTitle, onSelectGroup, onCopyGroup }) => {
  const activeGroup = OFFICIAL_GROUPS[selectedGroup] || OFFICIAL_GROUPS[0];
  const GroupIcon = activeGroup.icon;
  const activeGroupCanCopy = activeGroup.qq.trim() !== '' && activeGroup.qq !== '待补充';
  const activeGroupCopied = copiedGroupTitle === activeGroup.title;
  const activeGroupNumberLabel = activeGroupCanCopy ? activeGroup.qq : '暂不公开';

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-[1600px] flex-col">
      <div className="mb-4 shrink-0 flex flex-col gap-3 border-b border-white/15 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black tracking-[0.45em] text-[#c8322a]">GROUPS / 02</p>
          <h2 className="mt-2 text-5xl font-black tracking-[-0.05em] text-white md:text-6xl">十大官方组</h2>
        </div>
        <p className="max-w-2xl text-sm font-bold leading-relaxed text-white/60">
          可以同时加入多个组，无加入限制，无强制绑定。
        </p>
      </div>

      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="grid min-h-0 gap-1 overflow-y-auto pr-1">
          {OFFICIAL_GROUPS.map((group, index) => {
            const Icon = group.icon;
            const active = index === selectedGroup;
            return (
              <button
                key={group.title}
                type="button"
                onClick={() => onSelectGroup(index)}
                className={`flex items-center justify-between border px-4 py-3 text-left transition ${
                  active ? 'border-[#c8322a] bg-[#c8322a] text-white' : 'border-white/10 bg-[#121212] text-white/65 hover:border-white/35 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <span>
                    <span className="block text-sm font-black">{group.title}</span>
                    <span className="mt-0.5 block text-[10px] font-bold tracking-[0.22em] opacity-70">{group.label}</span>
                  </span>
                </span>
                <ChevronRight className="h-5 w-5" />
              </button>
            );
          })}
        </div>

        <div className="relative min-h-0 overflow-hidden border border-white/10 bg-[#121212] p-6 md:p-8">
          <div className="absolute right-8 top-8 text-[7rem] font-black leading-none text-white/[0.03] md:text-[12rem]">{activeGroup.label}</div>
          <div className="relative z-10 flex h-full min-h-0 flex-col">
            <div className="shrink-0">
              <div className="flex flex-wrap items-end gap-4">
                <span className="flex h-16 w-16 items-center justify-center bg-[#c8322a] text-white md:h-20 md:w-20">
                  <GroupIcon className="h-8 w-8 md:h-10 md:w-10" />
                </span>
                <div>
                  <p className="text-xs font-black tracking-[0.4em] text-[#c8322a]">{activeGroup.label}</p>
                  <h3 className="text-5xl font-black tracking-[-0.04em] text-white md:text-6xl">{activeGroup.title}</h3>
                </div>

                <div className="flex min-h-[72px] overflow-hidden bg-[#101010] text-white shadow-[4px_4px_0_rgb(0_0_0/0.28)]">
                  <div className="flex flex-col justify-center border-l-4 border-[#c8322a] px-4 py-2">
                    <p className="text-[10px] font-black tracking-[0.26em] text-[#c8322a]">QQ GROUP</p>
                    <p className="mt-1 font-mono text-2xl font-black leading-none text-white/90 md:text-3xl">{activeGroupNumberLabel}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onCopyGroup(activeGroup)}
                    disabled={!activeGroupCanCopy}
                    className={`group flex min-w-[132px] items-center justify-between gap-4 border-l border-black/35 px-4 text-left transition ${
                      activeGroupCanCopy
                        ? 'bg-[#c8322a] text-white hover:bg-white hover:text-[#c8322a]'
                        : 'cursor-not-allowed bg-white/10 text-white/35'
                    }`}
                  >
                    <span>
                      <span className="block text-base font-black leading-none">{activeGroupCopied ? '已复制' : activeGroupCanCopy ? '复制群号' : '暂无群号'}</span>
                      <span className="mt-1 block text-[10px] font-black leading-none tracking-[0.12em]">
                        {activeGroupCopied ? 'COPIED' : activeGroupCanCopy ? 'COPY QQ' : 'NO DATA'}
                      </span>
                    </span>
                    {activeGroupCopied ? (
                      <Check className="h-5 w-5 shrink-0" />
                    ) : (
                      <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
                    )}
                  </button>
                </div>
              </div>
              <div className="mt-6 grid min-h-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,440px)] xl:items-start">
                <div>
                  <p className="text-xl font-black leading-relaxed text-white md:text-3xl">{activeGroup.description}</p>
                  <p className="mt-3 max-w-3xl text-sm font-bold leading-relaxed text-white/60 md:text-base">{activeGroup.newcomerNote}</p>
                </div>

                <figure className="relative flex w-fit max-w-full justify-self-end overflow-hidden border border-white/12 bg-[#050505] p-2 shadow-[8px_8px_0_rgb(0_0_0/0.28)]">
                  <img src={activeGroup.image} alt={`${activeGroup.title}活动照片`} className="block max-h-[270px] max-w-full object-contain xl:max-h-[360px]" />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_74%_22%,rgba(200,50,42,0.16),transparent_34%),linear-gradient(180deg,transparent_54%,rgba(0,0,0,0.66)_100%)]"></div>
                  <figcaption className="absolute bottom-4 left-4 border-l-4 border-[#c8322a] bg-black/58 px-3 py-2 backdrop-blur-sm">
                    <span className="block text-[10px] font-black tracking-[0.22em] text-[#c8322a]">GROUP PHOTO</span>
                    <span className="mt-1 block text-sm font-black text-white">{activeGroup.title}</span>
                  </figcaption>
                </figure>
              </div>
            </div>

            <div className="mt-auto grid shrink-0 gap-3 pt-4">
              <div className="bg-black p-4">
                <p className="mb-3 text-xs font-black tracking-[0.28em] text-[#c8322a]">COMMON ACTIVITIES</p>
                <div className="flex flex-wrap gap-2">
                  {activeGroup.activities.map((activity) => (
                    <span key={activity} className="border border-white/15 px-3 py-2 text-xs font-black tracking-[0.12em] text-white/75">
                      {activity}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 shrink-0 overflow-hidden border-y border-white/15 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-black tracking-[0.18em] text-[#c8322a]">兴趣组：</span>
          {INTEREST_GROUPS.map((group) => (
            <span key={group} className="bg-white px-4 py-2 text-xs font-black tracking-[0.14em] text-black">
              {group}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GroupsPage;
