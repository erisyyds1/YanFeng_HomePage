import React, { useState, useEffect } from 'react';
import { Hash, Video, Menu, Star } from 'lucide-react';
import { AppTheme, NewsItem } from './types';
import { MOCK_NEWS, TIMELINE_DATA, HISTORY_DATA, WECHAT_ARTICLES } from './constants';

import EventGallery from './components/EventGallery';
import ChatAssistant from './components/ChatAssistant';
import Timeline from './components/Timeline';
import HistoryColumn from './components/HistoryColumn';
import WeChatNewsColumn from './components/WeChatNewsColumn';
import FileColumn from './components/FileColumn';
import { fetchWeChatArticles } from './services/wechatService';
import logo from './assets/logo.svg';

const App: React.FC = () => {
  const [theme, setTheme] = useState<AppTheme>(() => {
    const month = new Date().getMonth() + 1;
    // 9-12月: 冬日祭 (Winter)
    if (month >= 9 && month <= 12) return AppTheme.WINTER;
    // 1-2月: GMA金枫叶 (GMA)
    if (month <= 2) return AppTheme.GMA;
    // 其他: 常规
    return AppTheme.DEFAULT;
  });
  const [wechatNews, setWechatNews] = useState<NewsItem[]>(WECHAT_ARTICLES);
  const [activeTab, setActiveTab] = useState<'home' | 'events'>('home');

  // Apply theme to body
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // Fetch WeChat News
  useEffect(() => {
    const loadNews = async () => {
      try {
        const data = await fetchWeChatArticles();
        if (data && data.length > 0) {
            setWechatNews(data);
        } else {
            console.warn('Fetch succeeded but returned empty/null, falling back.');
            setWechatNews(WECHAT_ARTICLES);
        }
      } catch (e) {
        console.error("Failed to load news due to error:", e);
        setWechatNews(WECHAT_ARTICLES);
      }
    };
    loadNews();
  }, []);

  return (
    <div className="min-h-screen font-sans pb-20 relative">
      {/* Decorative Sidebars (Checkerboard) */}
      <div className="fixed left-0 top-0 w-4 md:w-8 h-full checker-bg z-0 border-r-4 border-[var(--theme-border)] hidden md:block"></div>
      <div className="fixed right-0 top-0 w-4 md:w-8 h-full checker-bg z-0 border-l-4 border-[var(--theme-border)] hidden md:block"></div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-4 md:px-12 py-8">

        {/* Header Section */}
        <header className="mb-12 flex flex-col gap-12">
          {/* Top Row: Logo & Controls */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 w-full">
          
          {/* Logo / Brand Section - Redesigned */}
          <div className="group cursor-default flex items-center gap-5 xl:gap-8 transform -rotate-2 hover:rotate-0 transition-transform duration-300 origin-left">
            {/* Badge Icon */}
            <div className="relative w-20 h-20 md:w-24 md:h-24 xl:w-36 xl:h-36 flex-shrink-0">
               <div className="absolute inset-0 bg-[var(--theme-primary)] rounded-full border-[3px] border-[var(--theme-border)] shadow-[4px_4px_0px_var(--theme-border)] flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 border-2 border-dashed border-white/50 rounded-full m-1"></div>
                  <div 
                      className="w-16 h-16 md:w-20 md:h-20 xl:w-[7.5rem] xl:h-[7.5rem] bg-[var(--theme-secondary)]"
                      style={{
                        maskImage: `url(${logo})`,
                        WebkitMaskImage: `url(${logo})`,
                        maskSize: 'contain',
                        WebkitMaskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        WebkitMaskRepeat: 'no-repeat',
                        maskPosition: 'center',
                        WebkitMaskPosition: 'center'
                      }}
                  />
               </div>
               {/* Decorative Star */}
               <div className="absolute -top-2 -right-2 xl:-top-1 xl:-right-1 text-[var(--theme-primary)] bg-[var(--theme-secondary)] rounded-full p-1 border-2 border-[var(--theme-border)]">
                  <Star className="w-3 h-3 xl:w-5 xl:h-5" fill="currentColor" />
               </div>
               {/* Year Tag */}
               <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-[var(--theme-accent)] text-[var(--theme-secondary)] text-[10px] xl:text-xs font-bold px-2 py-0.5 xl:px-3 xl:py-1 rounded border-2 border-[var(--theme-border)] whitespace-nowrap shadow-sm z-10">
                 EST. 2004
               </div>
            </div>

            {/* Text Content */}
            <div className="flex flex-col items-start gap-1">
               {/* Top Label */}
               <div className="flex items-center gap-2 mb-1">
                 <span className="bg-[var(--theme-border)] text-[var(--theme-secondary)] text-[10px] md:text-xs xl:text-sm font-black px-1.5 py-0.5 xl:px-2 xl:py-1 rounded-sm transform -skew-x-12 uppercase tracking-tighter">
                   YANFENG ACGN Fan CLUB
                 </span>
                 <div className="flex gap-0.5 xl:gap-1">
                   <div className="w-1 h-1 xl:w-1.5 xl:h-1.5 rounded-full bg-[var(--theme-border)]"></div>
                   <div className="w-1 h-1 xl:w-1.5 xl:h-1.5 rounded-full bg-[var(--theme-border)] opacity-50"></div>
                   <div className="w-1 h-1 xl:w-1.5 xl:h-1.5 rounded-full bg-[var(--theme-border)] opacity-25"></div>
                 </div>
               </div>
               
               {/* Main Title */}
               <h1 className="text-5xl md:text-6xl xl:text-8xl font-retro text-[var(--theme-primary)] leading-[0.85] tracking-wide" 
                   style={{ 
                     textShadow: '2px 2px 0px var(--theme-secondary), 4px 4px 0px var(--theme-border)',
                     WebkitTextStroke: '1.5px var(--theme-border)'
                   }}>
                 檐枫
               </h1>

               {/* Subtitle with lines */}
               <div className="flex items-center gap-2 mt-2 xl:mt-3 w-full">
                  <div className="h-0.5 bg-[var(--theme-border)] flex-grow rounded-full opacity-30"></div>
                  <p className="text-[var(--theme-primary)] font-bold text-xs md:text-sm xl:text-xl tracking-[0.3em] uppercase">
                    动漫社门户
                  </p>
                  <div className="h-0.5 bg-[var(--theme-border)] flex-grow rounded-full opacity-30"></div>
               </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 xl:gap-6 bg-[var(--theme-secondary)] p-2 xl:p-4 rounded-lg border-4 border-[var(--theme-border)] shadow-[4px_4px_0px_var(--theme-border)] transform transition-transform hover:-translate-y-1">
            <span className="font-bold text-sm xl:text-lg px-2 hidden sm:inline text-[var(--theme-border)]">主题风格：</span>
            <select 
              value={theme}
              onChange={(e) => setTheme(e.target.value as AppTheme)}
              className="bg-white border-2 border-[var(--theme-border)] rounded px-2 py-1 xl:px-4 xl:py-2 font-bold text-sm xl:text-lg focus:outline-none cursor-pointer text-[var(--theme-border)] hover:bg-gray-50 transition-colors"
            >
              <option value={AppTheme.DEFAULT}>常规</option>
              <option value={AppTheme.WINTER}>冬日祭</option>
              <option value={AppTheme.GMA}>GMA金枫叶奖</option>
            </select>
            <div className="w-0.5 h-6 xl:h-10 bg-[var(--theme-border)] opacity-20 mx-1"></div>
            <button 
                onClick={() => setActiveTab('home')}
                className={`p-2 xl:p-3 rounded border-2 transition-all ${activeTab === 'home' ? 'bg-[var(--theme-primary)] border-[var(--theme-border)] text-white shadow-[2px_2px_0px_var(--theme-border)]' : 'border-transparent hover:bg-gray-100 text-gray-500'}`}
                title="首页"
            >
                <Menu className="w-5 h-5 xl:w-7 xl:h-7" />
            </button>
             <button 
                onClick={() => setActiveTab('events')}
                className={`p-2 xl:p-3 rounded border-2 transition-all ${activeTab === 'events' ? 'bg-[var(--theme-primary)] border-[var(--theme-border)] text-white shadow-[2px_2px_0px_var(--theme-border)]' : 'border-transparent hover:bg-gray-100 text-gray-500'}`}
                title="活动相册"
            >
                <Video className="w-5 h-5 xl:w-7 xl:h-7" />
            </button>
          </div>
          </div>
          {activeTab === 'home' && <Timeline events={TIMELINE_DATA} />}
        </header>

        {/* Main Content Area */}
        <main>
            {activeTab === 'home' ? (
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
                    
                    {/* LEFT COLUMN: History (20%) */}
                    <div className="lg:col-span-2 space-y-8">
                        <HistoryColumn data={HISTORY_DATA} />
                    </div>

                    {/* MIDDLE COLUMN: WeChat News (50%) */}
                    <div className="lg:col-span-5 space-y-8">
                        <WeChatNewsColumn news={wechatNews} />
                    </div>

                    {/* RIGHT COLUMN: Notices / About (30%) */}
                    <div className="lg:col-span-3 space-y-8">
                        <FileColumn notices={MOCK_NEWS} />
                    </div>
                </div>

            ) : (
                <EventGallery currentTheme={theme} />
            )}
        </main>

        {/* Footer */}
        <footer className="mt-20 border-t-4 border-[var(--theme-border)] pt-8 pb-8 text-center text-[var(--theme-accent)] bg-white/50 backdrop-blur-sm">
          <div className="flex justify-center items-center gap-4 mb-4 opacity-50">
             <Hash size={16} />
             <div className="w-12 border-b-2 border-dashed border-[var(--theme-accent)] h-0"></div>
             <Star size={16} />
             <div className="w-12 border-b-2 border-dashed border-[var(--theme-accent)] h-0"></div>
             <Hash size={16} />
          </div>
          <p className="font-retro text-2xl tracking-widest text-[var(--theme-primary)] drop-shadow-[1px_1px_0px_var(--theme-border)]">Design by 檐枫技术组</p>
          <p className="text-xs mt-3 font-mono font-bold uppercase">© YANFENG ACGN Fan CLUB. All rights reserved.</p>
        </footer>

        {/* Chat Assistant */}
        <ChatAssistant />
      </div>
    </div>
  );
};

export default App;
