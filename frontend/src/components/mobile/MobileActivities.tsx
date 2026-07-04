import React from 'react';
import { CalendarDays } from 'lucide-react';
import { ACTIVITIES } from '../../data/siteContent';
import { MOBILE_ACTIVITY_IMAGES } from '../../data/mobileImages';

const FEATURED_ACTIVITIES = ACTIVITIES.slice(0, 3);

const MobileActivities: React.FC = () => {
  return (
    <section id="activities" data-mobile-section="activities" className="relative overflow-hidden bg-[#090909] px-5 py-20">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.035)_1px,transparent_1px)] opacity-20 [background-size:96px_96px]"></div>

      <div className="relative z-10">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.38em] text-[#c8322a]">ACTIVITIES</p>
        <h2 className="mt-3 text-[2.75rem] font-black leading-none tracking-normal text-white">活动档案</h2>
        <p className="mt-4 text-sm font-bold leading-relaxed text-white/58">从百团迎新到晚会节目，从了解檐枫到爱上檐枫。</p>
      </div>

      <div className="relative z-10 mt-8 grid gap-5">
        {FEATURED_ACTIVITIES.map((activity, index) => {
          const Icon = activity.icon;

          return (
            <article key={activity.title} className="overflow-hidden border border-white/12 bg-[#111] shadow-[6px_6px_0_rgba(0,0,0,0.34)]">
              <div className="relative aspect-[16/9] bg-black">
                <img
                  src={MOBILE_ACTIVITY_IMAGES[index] || MOBILE_ACTIVITY_IMAGES[0]}
                  alt={`${activity.title}活动图`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.78),rgba(0,0,0,0.12)_62%)]"></div>
                <span className="absolute left-4 top-4 bg-[#c8322a] px-3 py-2 font-mono text-xs font-black text-white">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="absolute bottom-4 right-4 grid h-11 w-11 place-items-center bg-black/74 text-[#c8322a] backdrop-blur-sm">
                  <Icon className="h-5 w-5" />
                </span>
              </div>

              <div className="p-5">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.28em] text-[#c8322a]">{activity.kicker}</p>
                <h3 className="mt-2 text-2xl font-black leading-tight text-white">{activity.title}</h3>
                <p className="mt-3 text-sm font-bold leading-relaxed text-white/62">{activity.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {activity.details.map((detail) => (
                    <span key={detail} className="border border-white/14 bg-white/[0.04] px-3 py-2 text-xs font-black text-white/70">
                      {detail}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="relative z-10 mt-7 border-y border-white/12 py-4">
        <div className="flex items-center gap-2 text-[#c8322a]">
          <CalendarDays className="h-4 w-4" />
          <span className="text-xs font-black tracking-[0.18em]">DAILY EVENTS</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {['放映会', '组活', '轻音 Live', '合宿', '联合观影', '更多日常活动'].map((event) => (
            <span key={event} className="bg-white px-3 py-2 text-xs font-black text-black">
              {event}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MobileActivities;
