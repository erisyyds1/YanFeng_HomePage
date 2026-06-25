import React from 'react';
import { Settings } from 'lucide-react';
import { NewsItem } from '../types';

interface FileColumnProps {
  notices: NewsItem[];
}

const FileColumn: React.FC<FileColumnProps> = ({ notices }) => {
  return (
    <div className="flex flex-col gap-6 min-h-[640px] lg:h-[1000px]">
      {/* Summary / Archives List (Custom Red Header Card) */}
      <div className="relative group flex-1 min-h-0">
         {/* Shadow Layer */}
         <div className="absolute top-2 left-2 w-full h-full bg-[var(--theme-border)] rounded-lg opacity-20 transition-transform group-hover:translate-x-1 group-hover:translate-y-1"></div>
         
         <div className="relative bg-[var(--theme-secondary)] border-4 border-[var(--theme-border)] rounded-lg overflow-hidden h-full flex flex-col">
            {/* Red Header Section */}
            <div className="bg-[var(--theme-primary)] p-6 pb-8 border-b-4 border-[var(--theme-border)] relative flex-shrink-0">
                <div className="absolute inset-0 border-2 border-dashed border-white/30 m-1 rounded-sm"></div>
                
                {/* Title Box */}
                <div className="relative z-10 bg-[var(--theme-secondary)] border-2 border-[var(--theme-border)] px-6 py-2 rounded shadow-[4px_4px_0px_var(--theme-darkRed)] inline-block transform -rotate-2">
                   <h3 className="text-2xl font-black text-[var(--theme-border)] tracking-widest flex items-center gap-2">
                   檐枫指南
                   </h3>
                </div>
                
                {/* Decorative Faded Text */}
                <h4 className="absolute bottom-2 right-4 text-4xl font-black text-black/10 uppercase tracking-tighter select-none">
                   ARCHIVES
                </h4>
            </div>

            {/* Content List Wrapper */}
            <div className="bg-[var(--theme-secondary)] relative flex-1 min-h-0">
                 {/* Internal Dashed Border (Static Frame) */}
                 <div className="absolute inset-2 border-2 border-dashed border-[var(--theme-primary)] pointer-events-none rounded z-20"></div>
                 
                 {/* Scrollable Content Area 
                     Changed from inset-0 to inset-3 (12px) to ensure it sits INSIDE the inset-2 (8px) border.
                     This creates a clipping mask so content disappears before hitting the border.
                 */}
                 <div className="absolute inset-3 overflow-y-auto overflow-x-hidden custom-scrollbar p-3 z-10">
                     <div className="space-y-4">
                        {notices.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">暂无信息</p>
                        ) : (
                          notices.map((notice) => (
                            <div key={notice.id} className="group/item pb-3 border-b border-dashed border-[var(--theme-primary)] last:border-0 last:pb-0">
                               <div className="flex items-center gap-2 mb-1.5">
                                    {notice.tag && (
                                      <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded shadow-sm
                                        ${notice.tag === '招新' ? 'bg-[#c0392b]' : 
                                          notice.tag === '回顾' ? 'bg-[#e67e22]' : 
                                          notice.tag === '通知' ? 'bg-[#d35400]' : 
                                          'bg-[var(--theme-primary)]'}
                                      `}>
                                        {notice.tag}
                                      </span>
                                    )}
                                    <span className="text-xs text-[var(--theme-brown)]/70 font-mono tracking-tight">{notice.date}</span>
                               </div>
                               <h4 className="font-bold text-[15px] leading-snug text-[var(--theme-border)] group-hover/item:text-[var(--theme-primary)] transition-colors cursor-pointer">
                                  {notice.title}
                               </h4>
                            </div>
                          ))
                        )}
                     </div>
                 </div>
                 
                 {/* Ticket Cutouts */}
                 <div className="absolute top-0 -left-2 w-4 h-8 bg-[var(--theme-primary)] border-r-4 border-[var(--theme-border)] rounded-r-full transform -translate-y-1/2 z-30"></div>
                 <div className="absolute top-0 -right-2 w-4 h-8 bg-[var(--theme-primary)] border-l-4 border-[var(--theme-border)] rounded-l-full transform -translate-y-1/2 z-30"></div>
            </div>
         </div>
      </div>


       {/* About Box */}
       <div className="bg-[var(--theme-accent)] text-[var(--theme-secondary)] p-6 rounded-lg border-4 border-[var(--theme-border)] shadow-[6px_6px_0px_var(--theme-border)] transform rotate-1 hover:rotate-0 transition-transform duration-300 flex-shrink-0">
          <h3 className="text-xl font-retro mb-4 border-b-2 border-dashed border-[var(--theme-primary)]/40 pb-2 flex items-center gap-2">
              <Settings size={20} className="animate-spin-slow" />
              关于风格
          </h3>
          <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 opacity-90 hover:opacity-100"><div className="w-1.5 h-1.5 bg-white rounded-full"></div> 传统美式复古元素特征</li>
              <li className="flex items-center gap-2 opacity-90 hover:opacity-100"><div className="w-1.5 h-1.5 bg-white rounded-full"></div> 檐枫自适应主题配色方案</li>
              <li className="flex items-center gap-2 opacity-90 hover:opacity-100"><div className="w-1.5 h-1.5 bg-white rounded-full"></div> 火山旅梦活动的风格参考</li>
          </ul>
      </div>
    </div>
  );
};

export default FileColumn;
