import React from 'react';

const SCROLL_GUIDE_DOTS = Array.from({ length: 28 }, (_, index) => index);

const formatGuideNumber = (value: number) => String(value).padStart(2, '0');

interface ScrollGuideProps {
  currentIndex: number;
  total: number;
}

const ScrollGuide: React.FC<ScrollGuideProps> = ({ currentIndex, total }) => {
  return (
    <div className="pointer-events-none absolute bottom-4 left-0 z-40 w-[300px] sm:w-[330px] md:bottom-5 md:w-[430px]">
      <style>{`
        @keyframes scrollGuideArrowLeft {
          0% { transform: translateX(70px); opacity: 0; }
          18% { opacity: 1; }
          76% { opacity: 1; }
          100% { transform: translateX(0); opacity: 0; }
        }

        .scroll-guide-arrow {
          animation: scrollGuideArrowLeft 1.45s cubic-bezier(0.45, 0, 0.22, 1) infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .scroll-guide-arrow {
            animation: none;
          }
        }
      `}</style>

      <div className="relative h-[58px] pl-1 text-white/60 md:h-[64px]">
        <div className="absolute left-0 top-[15px] flex w-[220px] items-center justify-between sm:w-[260px] md:w-[350px]">
          {SCROLL_GUIDE_DOTS.map((dot) => (
            <span key={dot} className="h-1 w-1 rounded-full bg-white/48" />
          ))}
        </div>

        <span className="scroll-guide-arrow absolute left-[100px] top-[3px] sm:left-[116px] md:left-[150px]" aria-hidden="true">
          <span className="block h-0 w-0 border-y-[9px] border-r-[20px] border-y-transparent border-r-[#c8322a] md:border-y-[11px] md:border-r-[24px]" />
        </span>

        <span className="absolute left-[64px] top-9 font-mono text-base font-black tracking-[0.2em] text-white/72 sm:left-[78px] md:left-[96px] md:top-10 md:text-xl">
          {formatGuideNumber(currentIndex + 1)}/{formatGuideNumber(total)}
        </span>

        <span className="absolute left-[245px] top-[5px] text-sm font-black tracking-[0.06em] text-white/75 sm:left-[285px] md:left-[382px] md:text-base">SCROLL</span>
      </div>
    </div>
  );
};

export default ScrollGuide;
