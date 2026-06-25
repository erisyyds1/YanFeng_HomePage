import React from 'react';
import { Newspaper, Calendar, Info } from 'lucide-react';
import RetroCard from './RetroCard';
import { NewsItem } from '../types';

interface WeChatNewsColumnProps {
  news: NewsItem[];
}

const WeChatNewsColumn: React.FC<WeChatNewsColumnProps> = ({ news }) => {
  return (
    <div className="flex flex-col gap-6 min-h-[720px] lg:h-[1000px]">
      {/* Header / Title */}
      <div className="bg-[var(--theme-secondary)] border-y-4 border-[var(--theme-border)] py-4 text-center relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-checker-pattern opacity-10"></div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-checker-pattern opacity-10"></div>
          <h2 className="text-3xl font-retro text-[var(--theme-border)] uppercase tracking-widest flex items-center justify-center gap-4">
              <span className="text-[var(--theme-primary)] hidden md:inline">★</span> 
              资讯菜单 
              <span className="text-[var(--theme-primary)] hidden md:inline">★</span>
          </h2>
          <p className="text-[var(--theme-primary)] text-xs font-bold mt-1 tracking-[0.5em] uppercase opacity-70">Latest News & Updates</p>
      </div>


      {/* News List (Scrollable Area) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pr-2 py-2">
        <div className="grid gap-6">
            {news.length === 0 && (
              <RetroCard variant="ticket">
                <div className="py-10 text-center text-[var(--theme-brown)]">
                  <Info size={32} className="mx-auto mb-3 text-[var(--theme-primary)]" />
                  <p className="font-bold">暂时没有可展示的资讯</p>
                </div>
              </RetroCard>
            )}
            {news.map((item) => (
                <RetroCard key={item.id} variant="ticket" className="transform transition-all hover:-translate-y-1 hover:shadow-lg group/card">
                    <div className="flex flex-col h-full">
                        {/* Metadata Header */}
                        <div className="flex items-center gap-3 mb-3">
                            <Newspaper size={20} className="text-[var(--theme-primary)]"/>
                            <span className="text-xs font-mono text-[var(--theme-brown)] opacity-70 flex items-center gap-1">
                                <Calendar size={12} /> {item.date}
                            </span>
                            {item.tag && (
                              <span className="text-[10px] font-bold text-white bg-[var(--theme-primary)] px-2 py-0.5 rounded border border-[var(--theme-border)]">
                                {item.tag}
                              </span>
                            )}
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-black mb-3 text-[var(--theme-darkRed)] leading-snug group-hover/card:text-[var(--theme-primary)] transition-colors cursor-pointer">
                            {item.title}
                        </h3>

                        {/* Cover Image (Printed on Ticket) */}
                        {/* Always render container to keep layout stable */}
                          <div className="mb-4 relative overflow-hidden rounded border-2 border-[var(--theme-border)]">
                            <div className="absolute inset-0 bg-[var(--theme-primary)]/10 z-10 group-hover/card:bg-transparent transition-colors duration-500"></div>
                            <img 
                              src={item.coverUrl || '/default_cover.png'} 
                              alt={item.title} 
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null; // Prevent infinite loop
                                target.src = '/default_cover.png';
                              }}
                              className="w-full h-48 object-cover transform group-hover/card:scale-105 transition-transform duration-700 filter sepia-[.3] group-hover/card:sepia-0"
                            />
                          </div>

                        {/* Dashed Separator */}
                        <div className="w-full border-t-2 border-dashed border-[var(--theme-primary)] my-2"></div>

                        {/* Summary */}
                        <p className="text-sm text-[var(--theme-brown)] mt-2 mb-4 leading-relaxed opacity-90 line-clamp-3">
                            {item.summary}
                        </p>

                        {/* Footer Link */}
                        <div className="mt-auto flex justify-end">
                            <a 
                                href={item.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs font-bold text-[var(--theme-darkRed)] hover:text-[var(--theme-primary)] hover:underline flex items-center gap-1 transition-colors"
                            >
                                阅读更多 &gt;&gt;
                            </a>
                        </div>
                    </div>
                </RetroCard>
            ))}
        </div>
      </div>

      {/* Featured / Sync Status */}
      <div className="p-6 bg-[var(--theme-primary)] border-4 border-[var(--theme-border)] rounded-xl text-white shadow-[8px_8px_0px_rgba(0,0,0,0.2)] relative overflow-hidden group flex-shrink-0">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
          <h3 className="text-2xl font-bold font-retro mb-2 relative z-10 flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.8)]"></div>
              公众号同步中...
          </h3>
          <p className="opacity-90 text-sm relative z-10 leading-relaxed max-w-lg">我们的小爬虫正在努力搬运最新的活动预告和推文，数据来源：涧桐现视研。</p>
      </div>
    </div>
  );
};

export default WeChatNewsColumn;
