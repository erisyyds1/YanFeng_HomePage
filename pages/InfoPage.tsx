import React from 'react';
import { BLACKBOARD_PANEL_IMAGE, INTEREST_GROUPS, OFFICIAL_GROUPS } from '../data/siteContent';

const InfoPage: React.FC = () => {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-black/48"></div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.04)_1px,transparent_1px)] opacity-35 [background-size:160px_160px]"></div>
      <div className="pointer-events-none absolute left-0 top-24 h-px w-full bg-white/10"></div>
      <div className="pointer-events-none absolute bottom-[13%] left-0 h-px w-full bg-white/10"></div>
      <div className="pointer-events-none absolute left-[7%] top-0 h-full w-px bg-white/10"></div>
      <div className="pointer-events-none absolute right-[11%] top-0 h-full w-px bg-[#c8322a]/18"></div>
      <div className="pointer-events-none absolute bottom-[calc(13%+0.75rem)] left-8 text-[6rem] font-black leading-none tracking-[-0.08em] text-white/[0.025] md:text-[9rem]">
        INFORMATION
      </div>
      <div className="pointer-events-none absolute right-10 top-28 h-28 w-28 border-r-2 border-t-2 border-[#c8322a]/35"></div>

      <div className="relative mx-auto grid h-full max-w-[1600px] gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-center xl:gap-10">
        <div className="relative z-20 flex min-h-0 flex-col justify-center">
          <p className="text-xs font-black tracking-[0.45em] text-[#c8322a]">INFORMATION / 01</p>
          <h2 className="mt-4 text-[4.15rem] font-black leading-[0.92] tracking-[-0.04em] text-white md:text-[6rem] xl:text-[8rem]">
            社团结构
            <span className="block text-[#c8322a]">入社指南</span>
          </h2>
          <p className="mt-6 max-w-xl text-base font-black leading-loose text-white/72 md:text-lg">
            入群即入社，按兴趣自由加入官方组或兴趣组。看番、宅舞、创作、唱歌、乐队、舞台剧和 cos，都能在这里找到同伴。
          </p>
          <div className="mt-8 grid max-w-xl grid-cols-3 gap-px bg-white/16">
            {[
              ['ENTRY', 'QQ 群入口'],
              ['GROUPS', '官方组 / 兴趣组'],
              ['STYLE', '自由参加']
            ].map(([label, value]) => (
              <div key={label} className="bg-[#111] px-4 py-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.02)]">
                <p className="text-[10px] font-black tracking-[0.22em] text-[#c8322a]">{label}</p>
                <p className="mt-2 text-sm font-black text-white md:text-base">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 min-h-[540px] lg:min-h-[600px]">
          <a
            href="https://zh.moegirl.org.cn/%E6%AA%90%E6%9E%AB%E5%A8%98"
            target="_blank"
            rel="noreferrer"
            aria-label="檐枫娘萌娘百科"
            className="absolute -left-16 bottom-0 z-30 hidden w-[170px] drop-shadow-[0_18px_28px_rgb(0_0_0/0.62)] transition hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c8322a] md:block xl:-left-24 xl:w-[215px]"
          >
            <img src="/image/yanfeng-chibi.webp" alt="Q版檐枫娘" className="w-full" />
          </a>
          <a
            href="https://mzh.moegirl.org.cn/%E6%AA%90%E7%BE%BD"
            target="_blank"
            rel="noreferrer"
            aria-label="檐羽萌娘百科"
            className="absolute -right-12 bottom-3 z-30 hidden w-[155px] drop-shadow-[0_18px_28px_rgb(0_0_0/0.62)] transition hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c8322a] md:block xl:-right-20 xl:w-[195px]"
          >
            <img src="/image/yanyu-chibi.webp" alt="Q版檐羽" className="w-full" />
          </a>

          <div
            className="relative z-20 flex h-full min-h-[540px] flex-col overflow-hidden bg-transparent px-7 py-9 shadow-[14px_14px_0_rgb(0_0_0/0.35)] md:px-12 md:py-14 lg:min-h-[600px]"
            style={{
              backgroundImage: `url(${BLACKBOARD_PANEL_IMAGE})`,
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '100% 100%'
            }}
          >
            <div className="relative z-10 flex flex-1 flex-col justify-center px-4 py-4 md:px-8 md:py-8">
              <div className="mx-auto w-full max-w-3xl">
                <div className="mx-auto max-w-[380px] border border-[#c8322a]/75 bg-[#c8322a] px-6 py-5 text-center shadow-[6px_6px_0_rgb(0_0_0/0.35)]">
                  <p className="text-[10px] font-black tracking-[0.3em] text-white/70">START / 01</p>
                  <h4 className="mt-1 text-4xl font-black tracking-[-0.04em] text-white md:text-5xl">QQ 大群</h4>
                  <p className="mt-2 text-xs font-bold text-white/76">水群、交友、了解动漫社，接收活动消息</p>
                </div>

                <div className="relative mx-auto h-20 max-w-[520px]">
                  <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/24"></div>
                  <div className="absolute left-[24%] right-[24%] top-[62%] h-px bg-white/24"></div>
                  <div className="absolute left-[24%] top-[62%] h-[38%] w-px bg-white/24"></div>
                  <div className="absolute right-[24%] top-[62%] h-[38%] w-px bg-white/24"></div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <article className="relative min-h-[190px] overflow-hidden border border-[#7b3a2d]/50 bg-black/24 p-5 shadow-[6px_6px_0_rgb(0_0_0/0.28)] md:p-6">
                    <p className="text-[10px] font-black tracking-[0.28em] text-[#c8322a]">OFFICIAL</p>
                    <h4 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">十大官方组</h4>
                    <p className="mt-3 text-sm font-bold leading-relaxed text-white/62">稳定组活、节目排练和大型晚会的主力。</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {OFFICIAL_GROUPS.slice(0, 6).map((group) => (
                        <span key={group.title} className="border border-[#7b3a2d]/60 bg-black/35 px-2.5 py-1.5 text-[11px] font-black text-white/72">
                          {group.title}
                        </span>
                      ))}
                    </div>
                  </article>

                  <article className="relative min-h-[190px] overflow-hidden border border-[#7b3a2d]/50 bg-black/24 p-5 shadow-[6px_6px_0_rgb(0_0_0/0.28)] md:p-6">
                    <p className="text-[10px] font-black tracking-[0.28em] text-[#c8322a]">INTEREST</p>
                    <h4 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">兴趣组</h4>
                    <p className="mt-3 text-sm font-bold leading-relaxed text-white/62">自由生长的同好空间。</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {INTEREST_GROUPS.slice(0, 6).map((group) => (
                        <span key={group} className="border border-[#7b3a2d]/60 bg-black/35 px-2.5 py-1.5 text-[11px] font-black text-white/72">
                          {group}
                        </span>
                      ))}
                    </div>
                  </article>
                </div>

                <div className="mt-5 border-l-4 border-[#c8322a] bg-black/42 px-4 py-3">
                  <p className="text-sm font-black leading-relaxed text-white/75">
                    入群即入社，是先坐下来认识大家。想活跃、想上台、想潜水看消息，都可以。
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-center gap-2 md:hidden">
                <a href="https://zh.moegirl.org.cn/%E6%AA%90%E6%9E%AB%E5%A8%98" target="_blank" rel="noreferrer" aria-label="檐枫娘萌娘百科">
                  <img src="/image/yanfeng-chibi.webp" alt="Q版檐枫娘" className="h-24 w-20 object-cover object-top" />
                </a>
                <a href="https://mzh.moegirl.org.cn/%E6%AA%90%E7%BE%BD" target="_blank" rel="noreferrer" aria-label="檐羽萌娘百科">
                  <img src="/image/yanyu-chibi.webp" alt="Q版檐羽" className="h-24 w-20 object-cover object-top" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InfoPage;
