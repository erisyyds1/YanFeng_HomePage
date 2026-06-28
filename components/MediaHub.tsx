import React from 'react';
import { ArrowRight, Image as ImageIcon, Music2, NotebookPen, Video } from 'lucide-react';

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
    description: '社庆、冬日庆典、GMA、组活与舞台录像。',
    icon: Video
  },
  {
    id: 'vocaloid',
    title: 'V组专辑',
    label: 'VOCALOID',
    description: 'VOCALOID 组原创、翻调、合作曲目与作品集合。',
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
  marker: string;
  area: string;
  labelPosition: string;
}[] = [
  {
    id: 'gallery',
    marker: '创作展示',
    area: 'left-[2%] top-[18%] h-[42%] w-[31%]',
    labelPosition: 'bottom-5 left-5'
  },
  {
    id: 'videos',
    marker: '活动录像',
    area: 'left-[36%] top-[18%] h-[36%] w-[31%]',
    labelPosition: 'bottom-5 left-1/2 -translate-x-1/2'
  },
  {
    id: 'vocaloid',
    marker: 'V组专辑',
    area: 'right-[4%] top-[28%] h-[39%] w-[27%]',
    labelPosition: 'bottom-5 right-5'
  },
  {
    id: 'wechat',
    marker: '檐枫推文',
    area: 'left-[31%] bottom-[5%] h-[33%] w-[36%]',
    labelPosition: 'bottom-5 left-1/2 -translate-x-1/2'
  }
];

const MediaHub: React.FC<MediaHubProps> = ({ onOpenEntry }) => {
  return (
    <div className="relative h-full min-h-[calc(100dvh-9rem)] overflow-hidden animate-in fade-in zoom-in duration-500">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.035)_1px,transparent_1px)] opacity-35 [background-size:160px_160px]"></div>
      <div className="pointer-events-none absolute left-[7%] top-0 h-full w-px bg-white/10"></div>
      <div className="pointer-events-none absolute right-[12%] top-0 h-full w-px bg-white/10"></div>
      <div className="pointer-events-none absolute bottom-[14%] left-0 h-px w-full bg-white/12"></div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,rgba(200,50,42,0.16),transparent_32%),linear-gradient(90deg,rgba(0,0,0,0.78),rgba(0,0,0,0.2)_36%,rgba(0,0,0,0.12)_72%,rgba(0,0,0,0.58))]"></div>

      <div className="absolute bottom-[24%] left-[7%] z-20 hidden w-[250px] text-white lg:block">
        <h2 className="text-5xl font-black leading-[0.96] tracking-[-0.04em] xl:text-6xl">
          檐枫
          <span className="block">万象</span>
        </h2>
        <div className="mt-5 h-2 w-40 bg-[#c8322a]"></div>
        <p className="mt-10 text-sm font-black leading-relaxed text-white/78">
          请选择想要查看的内容
        </p>
        <div className="mt-6 h-px w-40 bg-white/45"></div>
      </div>

      <div className="absolute left-[7%] top-[14%] z-20 hidden w-[220px] text-white lg:block">
        <p className="text-2xl font-black tracking-[-0.04em]">MEDIA ARCHIVE</p>
        <div className="mt-5 grid gap-3">
          {MEDIA_ENTRIES.map((entry) => {
            const Icon = entry.icon;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => onOpenEntry(entry.id)}
                className="group flex items-center gap-3 text-left text-white/52 transition hover:text-white"
              >
                <span className="flex h-4 w-4 items-center justify-center border border-white/35 transition group-hover:border-[#c8322a] group-hover:bg-[#c8322a]">
                  <Icon className="h-2.5 w-2.5 opacity-0 transition group-hover:opacity-100" strokeWidth={3} />
                </span>
                <span className="text-sm font-black tracking-[0.08em]">{entry.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="absolute right-[-2%] top-1/2 z-10 aspect-[4/3] w-[88vw] max-w-[1260px] -translate-y-[47%] md:right-[1%] md:w-[76vw] lg:right-[7%] lg:w-[70vw]">
        <div className="relative h-full w-full">
          <img
            src="/image/media-scene.png"
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
            const Icon = entry.icon;

            return (
              <button
                key={spot.id}
                type="button"
                onClick={() => onOpenEntry(spot.id)}
                aria-label={`打开${entry.title}`}
                className={`group absolute z-20 ${spot.area} cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c8322a] focus-visible:ring-offset-2 focus-visible:ring-offset-black`}
              >
                <span className="absolute inset-0 border border-white/0 bg-[#c8322a]/0 transition duration-300 group-hover:border-[#c8322a]/80 group-hover:bg-[#c8322a]/10 group-focus-visible:border-[#c8322a] group-focus-visible:bg-[#c8322a]/12"></span>
                <span
                  className={`absolute ${spot.labelPosition} flex items-center gap-2 border border-white/18 bg-black/72 px-3 py-2 text-left text-white opacity-0 shadow-[4px_4px_0_rgb(0_0_0/0.35)] backdrop-blur-sm transition duration-300 group-hover:opacity-100 group-focus-visible:opacity-100`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-[#c8322a]" strokeWidth={2.7} />
                  <span>
                    <span className="block whitespace-nowrap text-[10px] font-black tracking-[0.22em] text-[#c8322a]">{entry.label}</span>
                    <span className="mt-0.5 block whitespace-nowrap text-sm font-black">{spot.marker}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" />
                </span>
              </button>
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
