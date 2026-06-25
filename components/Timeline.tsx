import React from 'react';
import { TimelineEvent } from '../types';

interface TimelineProps {
  events: TimelineEvent[];
}

const getParticleStyle = (eventIndex: number, particleIndex: number): React.CSSProperties => {
  const seededRandom = (salt: number) => {
    const value = Math.sin((eventIndex + 1) * 97 + (particleIndex + 1) * 53 + salt) * 10000;
    return value - Math.floor(value);
  };

  return {
    top: `${seededRandom(1) * 40 - 20}px`,
    left: `${seededRandom(2) * 40 - 20}px`,
    animation: `twinkle-float ${1.5 + seededRandom(3)}s ease-in-out infinite`,
    animationDelay: `${seededRandom(4)}s`
  };
};

const Timeline: React.FC<TimelineProps> = ({ events }) => {

  // Logic to determine active event based on current month
  const getActiveEventIndex = () => {
    const currentMonth = new Date().getMonth() + 1;
    // 9, 10 matches '10月' (Index 0 in default data, but better search by text)
    if (currentMonth === 9 || currentMonth === 10) return events.findIndex(e => e.month.includes('10'));
    // 11, 12 matches '12月'
    if (currentMonth === 11 || currentMonth === 12) return events.findIndex(e => e.month.includes('12'));
    // 1, 2 matches '2月'
    if (currentMonth === 1 || currentMonth === 2) return events.findIndex(e => e.month.includes('2'));
    // 4, 5 matches '5月'
    if (currentMonth === 4 || currentMonth === 5) return events.findIndex(e => e.month.includes('5'));
    
    return -1;
  };

  const activeIndex = getActiveEventIndex();

  return (
    <div className="relative w-full py-12 md:py-24 px-4">
      {/* 
        --------------------------------------------------
        DYNAMIC STYLES & ANIMATIONS 
        --------------------------------------------------
      */}
      <style>{`
        @keyframes growLine {
          0% { width: 0; opacity: 0; }
          10% { opacity: 1; }
          100% { width: calc(100% - 4rem); opacity: 1; }
        }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0) translateY(20px); }
          60% { opacity: 1; transform: scale(1.1) translateY(0); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes appearArrow {
          0% { opacity: 0; transform: translate(-10px, -50%); }
          100% { opacity: 0.8; transform: translate(0, -50%); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0px rgba(231, 76, 60, 0.6); }
          50% { box-shadow: 0 0 0 6px rgba(231, 76, 60, 0.2), 0 0 20px 5px rgba(231, 76, 60, 0.5); }
        }
        @keyframes twinkle-float {
          0%, 100% { opacity: 0; transform: translateY(0) scale(0.5); }
          50% { opacity: 1; transform: translateY(-10px) scale(1.2); }
        }
        ${events.map((_, index) => {
          // Keep the existing floating animation
          return `
            @keyframes float-${index} {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-6px); }
            }
          `;
        }).join('')}
      `}</style>
      
      {/* Desktop Horizontal Line (Animated) */}
      <div 
        className="absolute top-1/2 left-0 h-0 border-t-[3px] border-dashed border-[var(--theme-primary)] -translate-y-[1.5px] hidden md:block z-0"
        style={{
            animation: 'growLine 2s cubic-bezier(0.22, 1, 0.36, 1) forwards',
            width: '0%', // Start invisible
            opacity: 0,
            left: '2rem', // Align start with padding
        }} 
      />
      
      {/* Arrow Head (Animated Delay) */}
       <div 
        className="absolute top-1/2 right-4 -translate-y-1/2 hidden md:block text-[var(--theme-primary)] opacity-0 z-0"
        style={{
            animation: 'appearArrow 0.5s ease-out forwards',
            animationDelay: '1.8s' // Wait for line to mostly finish
        }}
       >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
             <path d="m9 5 7 7-7 7" />
          </svg>
       </div>

      <div className="flex flex-col md:flex-row justify-between items-stretch relative gap-8 md:gap-0 max-w-6xl mx-auto z-10">
        {events.map((event, index) => {
          const isTop = index % 2 === 0;
          const rotationStr = `${(index % 2 === 0 ? 1 : -1) * (1 + index % 3)}deg`;
          
          // Calculate delay: Line takes 2s. Spread events pop-in over that time.
          // Event 0 starts quickly, Event N starts near end of line animation.
          const staggerDelay = `${0.2 + (index * 0.25)}s`;

          const isActive = index === activeIndex;

          return (
            <div 
                key={index} 
                className="relative flex-1 group min-w-0 md:px-2 opacity-0" // Start hidden
                style={{
                    animation: `popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
                    animationDelay: staggerDelay
                }}
            >
               
               {/* ------------------ MOBILE VIEW ------------------ */}
               <div className="flex md:hidden gap-4">
                  <div className="relative flex flex-col items-center">
                     <div className="absolute top-0 bottom-[-32px] w-0.5 border-l-2 border-dashed border-[var(--theme-primary)] opacity-50 z-0 group-last:bottom-auto group-last:h-full"></div>
                     {/* Mobile Pin */}
                     <div className={`w-4 h-4 rounded-full border-2 border-[var(--theme-border)] shadow-[2px_2px_0px_var(--theme-border)] z-10 shrink-0 relative bg-[var(--theme-primary)]
                        ${isActive ? 'scale-125 bg-[var(--theme-accent)] ring-4 ring-[var(--theme-accent)]/20' : ''}
                     `}>
                        <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-white/40 rounded-full"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-[var(--theme-border)] rounded-full"></div>
                     </div>
                  </div>
                  <div className="flex-1 pb-6">
                      <div className={`
                        p-3 rounded border-2 transform -rotate-1 transition-all
                        ${isActive 
                            ? 'bg-[var(--theme-accent)] border-[var(--theme-border)] shadow-[4px_4px_0px_var(--theme-border)] scale-105' 
                            : 'bg-[var(--theme-secondary)] border-[var(--theme-border)] shadow-[3px_3px_0px_var(--theme-border)]'}
                      `}>
                          <span className={`font-bold text-xs block mb-1 ${isActive ? 'text-[var(--theme-secondary)]' : 'text-[var(--theme-primary)]'}`}>
                              {event.month} {isActive && <span className="ml-1 px-1 bg-white/20 rounded">NOW</span>}
                          </span>
                          <h4 className={`font-bold text-base ${isActive ? 'text-white' : 'text-[var(--theme-border)]'}`}>
                              {event.title}
                          </h4>
                      </div>
                  </div>
               </div>

               {/* ------------------ DESKTOP VIEW ------------------ */}
               <div className="hidden md:flex flex-col items-center h-full justify-center relative">
                  
                   {/* Pin Node (Fixed on Line) */}
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                      {/* Floating Particles (Stars) - Only for Active */}
                      {isActive && (
                        <div className="absolute inset-0 pointer-events-none overflow-visible">
                            {[...Array(5)].map((_, i) => (
                                <div 
                                    key={i}
                                    className="absolute w-2 h-2 text-[#f1c40f]"
                                    style={getParticleStyle(index, i)}
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full drop-shadow-sm">
                                        <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
                                    </svg>
                                </div>
                            ))}
                        </div>
                      )}
                      
                      <div className={`
                        relative transition-transform duration-500
                        ${isActive ? 'scale-[1.5] z-30' : 'w-4 h-4 hover:scale-110'}
                      `}>
                          <div className={`
                             w-full h-full rounded-full border-2 border-[var(--theme-border)] shadow-[2px_2px_0px_var(--theme-border)] relative flex items-center justify-center
                             ${isActive ? 'w-6 h-6 bg-[#e74c3c] animate-[pulse-glow_2s_infinite]' : 'bg-[var(--theme-primary)]'}
                          `}>
                              {/* Pin Highlight */}
                              <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-white/40 rounded-full"></div>
                              {/* Pin Center: Force white for active to look like a target */}
                              <div className={`
                                  absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full
                                  ${isActive ? 'w-2 h-2 bg-white' : 'w-1 h-1 bg-[var(--theme-border)]'}
                              `}></div>
                          </div>
                      </div>
                   </div>

                   {/* Connector Line (Vertical) */}
                   <div className={`absolute left-1/2 -translate-x-1/2 w-0.5 z-0 
                        ${isTop ? 'bottom-1/2 mb-2 h-10' : 'top-1/2 mt-2 h-10'}
                        ${isActive ? 'bg-[#e74c3c] h-12 w-1' : 'bg-[var(--theme-primary)]'}
                   `}></div>

                   {/* Floating Card Container */}
                   <div 
                      className={`flex w-full justify-center absolute left-0 right-0 z-30
                        ${isTop ? 'bottom-[calc(50%+40px)]' : 'top-[calc(50%+40px)]'}
                        ${isActive ? (isTop ? 'bottom-[calc(50%+50px)]' : 'top-[calc(50%+50px)]') : ''} 
                      `}
                      style={{
                        animation: `float-${index} 3s ease-in-out infinite`,
                        animationDelay: `${2.5 + index * 0.2}s`, // Start floating AFTER entrance
                      }}
                   >
                      <div 
                          className={`
                            relative p-3 border-2 min-w-[100px] max-w-[160px] text-center transition-all cursor-default
                            ${isActive 
                                ? 'bg-[#e74c3c] border-[var(--theme-border)] shadow-[6px_6px_0px_var(--theme-border)] scale-110' 
                                : 'bg-[var(--theme-secondary)] border-[var(--theme-border)] shadow-[3px_3px_0px_var(--theme-border)] hover:-translate-y-1 hover:shadow-[4px_4px_0px_var(--theme-border)]'}
                          `}
                          style={{ transform: `rotate(${rotationStr})` }}
                      >
                          {/* Triangle Pointer */}
                          {isTop ? (
                              <>
                                <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] z-10 ${isActive ? 'border-t-[#e74c3c]' : 'border-t-[var(--theme-secondary)]'}`} />
                                <div className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-[var(--theme-border)] -z-0" />
                              </>
                          ) : (
                              <>
                                <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] z-10 ${isActive ? 'border-b-[#e74c3c]' : 'border-b-[var(--theme-secondary)]'}`} />
                                <div className="absolute -top-[10px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-[var(--theme-border)] -z-0" />
                              </>
                          )}
                          
                          {/* Content */}
                          <div className={`font-bold text-base mb-1 leading-none ${isActive ? 'text-[var(--theme-secondary)]' : 'text-[var(--theme-primary)]'}`}>
                             {event.month}
                          </div>
                          <h4 className={`font-bold text-xs leading-tight ${isActive ? 'text-white' : 'text-[var(--theme-border)]'}`}>
                             {event.title}
                          </h4>
                      </div>
                   </div>
               </div>
               
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Timeline;
