import React from 'react';

const ActivitiesPage: React.FC = () => {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-black/46"></div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.052)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.036)_1px,transparent_1px)] opacity-35 [background-size:160px_160px]"></div>
      <div className="pointer-events-none absolute left-0 top-24 h-px w-full bg-white/10"></div>
      <div className="pointer-events-none absolute bottom-[13%] left-0 h-px w-full bg-white/10"></div>
      <div className="pointer-events-none absolute -bottom-8 left-8 text-[7rem] font-black leading-none tracking-[-0.08em] text-white/[0.026] md:text-[12rem]">
        EVENTS
      </div>

      <div className="relative mx-auto grid h-full max-w-[1600px] grid-rows-[1fr_1fr_1fr_auto] gap-3">
        <div className="grid min-h-0 grid-cols-[0.48fr_1.52fr] gap-3 lg:grid-cols-[0.42fr_1.58fr]">
          <article className="relative overflow-hidden border border-white/12 bg-[#111] p-5 text-white shadow-[6px_6px_0_rgb(0_0_0/0.28)] md:p-6">
            <div className="pointer-events-none absolute right-4 top-4 text-5xl font-black leading-none text-white/12">01</div>
            <p className="text-[10px] font-black tracking-[0.34em] text-[#c8322a]">ENTRY POINT</p>
            <h2 className="mt-3 text-2xl font-black leading-none tracking-[-0.04em] md:text-4xl xl:text-5xl">百团大战</h2>
            <p className="mt-4 max-w-md text-sm font-bold leading-relaxed text-white/64">
              开学季，第一次和檐枫面对面。摊位，抽奖和精彩节目。
            </p>
          </article>
          <figure className="relative min-h-0 overflow-hidden border border-white/12 bg-black shadow-[6px_6px_0_rgb(0_0_0/0.28)]">
            <img src="/image/activity-baifest.jpg" alt="百团大战活动现场" className="h-full min-h-[96px] w-full object-cover md:min-h-[160px]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.46),transparent_42%,rgba(200,50,42,0.1))]"></div>
            <span className="absolute bottom-4 right-4 border border-white/18 bg-black/55 px-3 py-2 text-xs font-black tracking-[0.18em] text-white/75">
              迎新 / 摊位 / 交流
            </span>
          </figure>
        </div>

        <div className="grid min-h-0 grid-cols-[1.28fr_0.72fr] gap-3 lg:grid-cols-[1.26fr_0.74fr]">
          <figure className="relative min-h-0 overflow-hidden border border-white/12 bg-black shadow-[6px_6px_0_rgb(0_0_0/0.28)]">
            <img src="/image/activity-winter.jpeg" alt="冬日盛典合影" className="h-full min-h-[96px] w-full object-cover md:min-h-[160px]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.2),transparent_50%,rgba(0,0,0,0.55))]"></div>
          </figure>
          <article className="relative overflow-hidden border border-[#c8322a]/65 bg-[#c8322a] p-5 text-white shadow-[6px_6px_0_rgb(0_0_0/0.28)] md:p-6">
            <div className="pointer-events-none absolute right-4 top-4 text-5xl font-black leading-none text-white/25">02</div>
            <p className="text-[10px] font-black tracking-[0.34em] text-white/65">TERM FINALE</p>
            <h3 className="mt-3 text-2xl font-black leading-none tracking-[-0.04em] md:text-4xl xl:text-5xl">冬日盛典</h3>
            <p className="mt-4 text-sm font-bold leading-relaxed text-white/78">
              第一学期末的大型晚会，和檐枫一起留下第一次对大型晚会的记忆。
            </p>
          </article>
        </div>

        <div className="grid min-h-0 grid-cols-[0.48fr_1.52fr] gap-3 lg:grid-cols-[0.42fr_1.58fr]">
          <article className="relative overflow-hidden border border-white/12 bg-[#111] p-5 text-white shadow-[6px_6px_0_rgb(0_0_0/0.28)] md:p-6">
            <div className="pointer-events-none absolute right-4 top-4 text-5xl font-black leading-none text-white/12">03</div>
            <p className="text-[10px] font-black tracking-[0.34em] text-[#c8322a]">ANNIVERSARY</p>
            <h3 className="mt-3 text-2xl font-black leading-none tracking-[-0.04em] md:text-4xl xl:text-5xl">社庆</h3>
            <p className="mt-4 max-w-md text-sm font-bold leading-relaxed text-white/64">
              第二学期末的周年庆典，社庆结束，回望和檐枫一起经历的一整年。
            </p>
          </article>
          <figure className="relative min-h-0 overflow-hidden border border-white/12 bg-black shadow-[6px_6px_0_rgb(0_0_0/0.28)]">
            <img src="/image/activity-anniversary.jpeg" alt="社庆活动合影" className="h-full min-h-[96px] w-full object-cover md:min-h-[160px]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.45),transparent_48%,rgba(200,50,42,0.1))]"></div>
          </figure>
        </div>

        <div className="relative overflow-hidden border-y border-white/15 bg-black/45 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <span className="text-[10px] font-black tracking-[0.3em] text-[#c8322a]">DAILY EVENTS</span>
            {['放映会', '组活', '轻音 Live', '合宿', '联合观影', '更多日常活动'].map((event) => (
              <span key={event} className="border border-white/14 bg-[#111] px-3 py-1.5 text-xs font-black text-white/72">
                {event}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ActivitiesPage;
