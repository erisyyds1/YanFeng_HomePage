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

const MediaHub: React.FC<MediaHubProps> = ({ onOpenEntry }) => {
  return (
    <div className="grid min-h-[calc(100dvh-9rem)] gap-8 animate-in fade-in zoom-in duration-500 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
      <div>
        <p className="text-xs font-black tracking-[0.45em] text-[#c8322a]">MEDIA</p>
        <h2 className="mt-4 text-6xl font-black leading-[0.9] tracking-[-0.06em] text-white md:text-8xl">
          檐枫
          <span className="block text-[#c8322a]">万象</span>
        </h2>
        <p className="mt-7 max-w-xl text-lg font-black leading-relaxed text-white/68">
          把檐枫的舞台、作品、照片和推文都放在这里。想看什么，就从一个入口进去。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {MEDIA_ENTRIES.map((entry, index) => {
          const Icon = entry.icon;
          const featured = index === 0;

          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => onOpenEntry(entry.id)}
              className={`group relative min-h-[220px] overflow-hidden border-4 border-[var(--theme-border)] bg-white p-2 text-left shadow-[6px_6px_0px_var(--theme-border)] transition-all hover:-translate-y-1 hover:shadow-[3px_3px_0px_var(--theme-border)] ${
                featured ? 'md:col-span-2 md:min-h-[260px]' : ''
              }`}
            >
              <div className={`relative flex h-full flex-col justify-between overflow-hidden p-6 ${featured ? 'bg-[#c8322a] text-white' : 'bg-[#111] text-white'}`}>
                <div className="absolute -right-8 -top-8 h-32 w-32 rotate-12 border-[22px] border-white/10"></div>
                <div className="relative z-10 flex items-start justify-between gap-6">
                  <div>
                    <p className={`text-xs font-black tracking-[0.32em] ${featured ? 'text-white/70' : 'text-[#c8322a]'}`}>{entry.label}</p>
                    <h3 className="mt-3 text-4xl font-black tracking-[-0.05em] md:text-5xl">{entry.title}</h3>
                  </div>
                  <span className={`flex h-14 w-14 shrink-0 items-center justify-center border-2 ${featured ? 'border-white/50 bg-black/25' : 'border-[#c8322a] bg-black'}`}>
                    <Icon className={`h-7 w-7 ${featured ? 'text-white' : 'text-[#c8322a]'}`} />
                  </span>
                </div>
                <div className="relative z-10 mt-8 flex items-end justify-between gap-4">
                  <p className="max-w-md text-sm font-bold leading-relaxed text-white/68">{entry.description}</p>
                  <ArrowRight className="h-6 w-6 shrink-0 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MediaHub;
