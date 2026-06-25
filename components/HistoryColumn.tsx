import React from 'react';
import RetroCard from './RetroCard';
import { HistoryEvent } from '../types';

interface HistoryColumnProps {
  data: HistoryEvent[];
}

const HistoryColumn: React.FC<HistoryColumnProps> = ({ data }) => {
  return (
    <div className="relative group flex flex-col min-h-[640px] lg:h-[1000px]">
       {/* Shadow Layer */}
       <div className="absolute top-2 left-2 w-full h-full bg-[var(--theme-border)] rounded-lg opacity-20 transition-transform group-hover:translate-x-1 group-hover:translate-y-1"></div>
       
       <div className="relative bg-[var(--theme-secondary)] border-4 border-[var(--theme-border)] rounded-lg overflow-hidden h-full flex flex-col">
          {/* Red Header Section */}
          <div className="bg-[var(--theme-primary)] p-6 pb-8 border-b-4 border-[var(--theme-border)] relative flex-shrink-0">
              <div className="absolute inset-0 border-2 border-dashed border-white/30 m-1 rounded-sm"></div>
              
              {/* Title Box */}
              <div className="relative z-10 bg-[var(--theme-secondary)] border-2 border-[var(--theme-border)] px-6 py-2 rounded shadow-[4px_4px_0px_var(--theme-darkRed)] inline-block transform -rotate-2">
                 <h3 className="text-2xl font-black text-[var(--theme-border)] tracking-widest flex items-center gap-2">
                    大事记
                 </h3>
              </div>
              
              {/* Decorative Faded Text */}
              <h4 className="absolute bottom-2 right-4 text-4xl font-black text-black/10 uppercase tracking-tighter select-none">
                 HISTORY
              </h4>
          </div>

          {/* Content List Wrapper */}
          <div className="bg-[var(--theme-secondary)] relative flex-1 min-h-0">
               {/* Internal Dashed Border (Static Frame) */}
               <div className="absolute inset-2 border-2 border-dashed border-[var(--theme-primary)] pointer-events-none rounded z-20"></div>
               
               {/* Scrollable Content Area */}
               <div className="absolute inset-3 overflow-y-auto overflow-x-hidden custom-scrollbar p-3 z-10">
                   <ul className="space-y-6 relative">
                     {/* Vertical Line */}
                     <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-[var(--theme-primary)] border-l-2 border-dashed border-[var(--theme-primary)] opacity-30"></div>
                     {data.map((item, idx) => (
                       <li key={idx} className="relative pl-8 group cursor-default">
                         {/* Dot Node */}
                         <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-[var(--theme-secondary)] border-4 border-[var(--theme-primary)] z-10 group-hover:scale-110 transition-transform shadow-[0_2px_0_rgba(0,0,0,0.1)]"></div>
                         
                         {/* Content (Always visible) */}
                         <div className="">
                           <span className="font-retro text-lg text-[var(--theme-primary)] block leading-none mb-1">{item.year}</span>
                           <h4 className="font-bold text-sm leading-tight text-[var(--theme-accent)]">{item.title}</h4>
                           
                           <div className="mt-2">
                              <p className="text-xs text-[var(--theme-brown)] leading-relaxed border-t border-dashed border-[var(--theme-border)] pt-1 opacity-80">
                               {item.description}
                              </p>
                           </div>
                         </div>
                       </li>
                     ))}
                   </ul>
               </div>
               
               {/* Ticket Cutouts */}
               <div className="absolute top-0 -left-2 w-4 h-8 bg-[var(--theme-primary)] border-r-4 border-[var(--theme-border)] rounded-r-full transform -translate-y-1/2 z-20"></div>
               <div className="absolute top-0 -right-2 w-4 h-8 bg-[var(--theme-primary)] border-l-4 border-[var(--theme-border)] rounded-l-full transform -translate-y-1/2 z-20"></div>
          </div>
       </div>
    </div>
  );
};

export default HistoryColumn;
