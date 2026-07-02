import React, { useState } from 'react';
import { Image as ImageIcon, Music2, NotebookPen, Video } from 'lucide-react';

export type MediaContentId = 'videos' | 'vocaloid' | 'gallery' | 'wechat';

interface MediaHubProps {
  onOpenEntry: (entry: MediaContentId) => void;
}

export interface MediaEntry {
  id: MediaContentId;
  title: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

export const MEDIA_ENTRIES: MediaEntry[] = [
  {
    id: 'videos',
    title: '视频展示',
    label: 'VIDEOS',
    description: '社庆、冬日庆典、GMA与活动录像。',
    icon: Video
  },
  {
    id: 'vocaloid',
    title: 'V组专辑',
    label: 'VOCALOID',
    description: 'VOCALOID 组原创作品集合。',
    icon: Music2
  },
  {
    id: 'gallery',
    title: '檐枫图集',
    label: 'GALLERY',
    description: '活动返图、舞台瞬间、合照与社团日常。',
    icon: ImageIcon
  },
  {
    id: 'wechat',
    title: '檐枫推文',
    label: 'WECHAT',
    description: '涧桐现视研推文、招新、活动回顾与通知。',
    icon: NotebookPen
  }
];

export const getMediaEntry = (id: MediaContentId) => MEDIA_ENTRIES.find((entry) => entry.id === id);

const MEDIA_HOTSPOTS: {
  id: MediaContentId;
  area: string;
  clipPath: string;
  polygonPoints: string;
}[] = [
  {
    id: 'gallery',
    area: 'left-[2%] top-[17%] h-[47%] w-[31%]',
    clipPath: 'polygon(6% 8%, 84% 0%, 98% 82%, 15% 100%, 0% 34%)',
    polygonPoints: '6,8 84,0 98,82 15,100 0,34'
  },
  {
    id: 'videos',
    area: 'left-[30%] top-[3%] h-[48%] w-[34%]',
    clipPath: 'polygon(18% 13%, 82% 5%, 98% 29%, 93% 86%, 15% 100%, 0% 68%, 4% 26%)',
    polygonPoints: '18,13 82,5 98,29 93,86 15,100 0,68 4,26'
  },
  {
    id: 'vocaloid',
    area: 'right-[7%] top-[22%] h-[43%] w-[36%]',
    clipPath: 'polygon(21% 8%, 72% 4%, 100% 28%, 95% 87%, 35% 98%, 0% 75%, 7% 27%)',
    polygonPoints: '21,8 72,4 100,28 95,87 35,98 0,75 7,27'
  },
  {
    id: 'wechat',
    area: 'left-[23%] top-[40%] h-[38%] w-[39%]',
    clipPath: 'polygon(10% 18%, 42% 2%, 78% 0%, 100% 24%, 88% 78%, 30% 100%, 0% 72%, 4% 38%)',
    polygonPoints: '10,18 42,2 78,0 100,24 88,78 30,100 0,72 4,38'
  }
];

const MediaHub: React.FC<MediaHubProps> = ({ onOpenEntry }) => {
  const [activeHotspot, setActiveHotspot] = useState<MediaContentId | null>(null);

  return (
    <div className="site-media-stage relative h-full overflow-hidden animate-in fade-in zoom-in duration-500">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.035)_1px,transparent_1px)] opacity-35 [background-size:160px_160px]"></div>
      <div className="pointer-events-none absolute left-[7%] top-0 h-full w-px bg-white/10"></div>
      <div className="pointer-events-none absolute right-[12%] top-0 h-full w-px bg-white/10"></div>
      <div className="pointer-events-none absolute bottom-[14%] left-0 h-px w-full bg-white/12"></div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,rgba(200,50,42,0.16),transparent_32%),linear-gradient(90deg,rgba(0,0,0,0.78),rgba(0,0,0,0.2)_36%,rgba(0,0,0,0.12)_72%,rgba(0,0,0,0.58))]"></div>

      <div className="absolute left-[7%] top-[16%] z-20 hidden w-[430px] text-white lg:block">
        <div className="pointer-events-none absolute -inset-x-10 -inset-y-12 bg-[radial-gradient(circle,rgba(255,255,255,0.16)_1px,transparent_1.5px)] opacity-35 [background-size:15px_15px]"></div>
        <div className="pointer-events-none absolute -left-10 top-8 h-px w-[520px] bg-white/14"></div>
        <div className="pointer-events-none absolute -left-10 top-8 h-[300px] w-px bg-white/10"></div>
        <div className="relative">
          <p className="font-mono text-5xl font-black uppercase leading-none tracking-[0.02em] text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)] xl:text-6xl">
            ABOUT MEDIA
          </p>
          <h2 className="mt-3 text-6xl font-black leading-[0.94] tracking-[-0.05em] text-white drop-shadow-[0_5px_16px_rgba(0,0,0,0.55)] xl:text-7xl">
            檐枫万象
          </h2>
          <div className="mt-7 h-2.5 w-[300px] bg-[#c8322a] shadow-[0_0_28px_rgba(200,50,42,0.42)]"></div>

          <div className="mt-14">
            <p className="text-base font-black leading-relaxed text-white/86">请选择您要查看的内容</p>
            <p className="mt-3 font-mono text-base font-black uppercase tracking-[0.03em] text-white/90">
              YANFENG ACGN / MEDIA ARCHIVE
            </p>
            <div className="mt-7 h-px w-[310px] bg-white/48"></div>
          </div>

          <div className="mt-6 grid w-[330px] gap-2">
            {MEDIA_ENTRIES.map((entry) => {
              const Icon = entry.icon;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onOpenEntry(entry.id)}
                  className="group flex items-center justify-between border-l-4 border-white/30 bg-black/24 px-4 py-2.5 text-left text-white/62 backdrop-blur-[2px] transition hover:border-[#c8322a] hover:bg-[#c8322a]/18 hover:text-white"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-[#c8322a] transition group-hover:text-white" strokeWidth={2.8} />
                    <span className="text-sm font-black tracking-[0.12em]">{entry.label}</span>
                  </span>
                  <span className="font-mono text-xs font-black text-white/32 transition group-hover:text-white/72">VIEW</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="absolute right-[-2%] top-1/2 z-10 aspect-[4/3] w-[88vw] max-w-[1260px] -translate-y-[47%] md:right-[1%] md:w-[76vw] lg:right-[7%] lg:w-[70vw]">
        <div className="relative h-full w-full">
          <img
            src="/image/media-scene.webp"
            alt="檐枫万象场景"
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.42),transparent_26%,transparent_74%,rgba(0,0,0,0.34)),linear-gradient(0deg,rgba(0,0,0,0.44),transparent_22%,transparent_78%,rgba(0,0,0,0.22))]"></div>

          {MEDIA_HOTSPOTS.map((spot) => {
            const entry = getMediaEntry(spot.id);
            if (!entry) {
              return null;
            }
            const isActive = activeHotspot === spot.id;

            return (
              <div key={spot.id} className={`absolute z-20 ${spot.area}`}>
                <button
                type="button"
                onClick={() => onOpenEntry(spot.id)}
                aria-label={`打开${entry.title}`}
                onMouseEnter={() => setActiveHotspot(spot.id)}
                onMouseLeave={() => setActiveHotspot((current) => (current === spot.id ? null : current))}
                onFocus={() => setActiveHotspot(spot.id)}
                onBlur={() => setActiveHotspot((current) => (current === spot.id ? null : current))}
                className="absolute inset-0 cursor-pointer bg-transparent focus:outline-none"
                style={{
                  clipPath: spot.clipPath,
                  WebkitClipPath: spot.clipPath
                }}
                />
                <span
                  className={`pointer-events-none absolute inset-[-10%] mix-blend-screen blur-xl transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}
                  style={{
                    clipPath: spot.clipPath,
                    WebkitClipPath: spot.clipPath,
                    background:
                      'radial-gradient(circle at 52% 52%, rgba(255,232,188,0.30) 0%, rgba(255,202,126,0.18) 34%, rgba(255,246,214,0.10) 56%, rgba(255,246,214,0) 74%)'
                  }}
                />
                <svg
                  className={`pointer-events-none absolute inset-0 mix-blend-screen transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <defs>
                    <filter id={`hotspot-edge-glow-${spot.id}`} x="-45%" y="-45%" width="190%" height="190%">
                      <feGaussianBlur stdDeviation="3.4" result="edgeGlow" />
                      <feMerge>
                        <feMergeNode in="edgeGlow" />
                      </feMerge>
                    </filter>
                  </defs>
                  <polygon
                    points={spot.polygonPoints}
                    fill="none"
                    stroke="rgba(255,232,188,0.24)"
                    strokeWidth="5"
                    vectorEffect="non-scaling-stroke"
                    filter={`url(#hotspot-edge-glow-${spot.id})`}
                  />
                </svg>
              </div>
            );
          })}

        </div>
      </div>

      <div className="pointer-events-none absolute bottom-[7%] left-[7%] z-0 hidden text-white/[0.06] lg:block">
        <p className="text-[8rem] font-black leading-none tracking-[-0.08em] xl:text-[10rem]">MEDIA</p>
      </div>

      <div className="absolute inset-x-4 bottom-4 z-30 grid gap-2 sm:grid-cols-4 lg:hidden">
        {MEDIA_ENTRIES.map((entry) => {
          const Icon = entry.icon;
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => onOpenEntry(entry.id)}
              className="flex items-center justify-center gap-2 border border-white/16 bg-black/78 px-3 py-2 text-xs font-black text-white backdrop-blur-sm transition hover:bg-[#c8322a]"
            >
              <Icon className="h-4 w-4" strokeWidth={2.6} />
              {entry.title}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MediaHub;
