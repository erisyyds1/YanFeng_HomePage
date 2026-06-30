import React from 'react';
import { Check, Copy, Edit3 } from 'lucide-react';
import { JOIN_IMAGE } from '../data/siteContent';

interface JoinPageProps {
  mainGroupNumber: string;
  joinGroupCopied: boolean;
  isEditMode: boolean;
  onCopyJoinGroupNumber: () => void | Promise<void>;
  onOpenGroupEditor: () => void;
}

const JoinPage: React.FC<JoinPageProps> = ({
  mainGroupNumber,
  joinGroupCopied,
  isEditMode,
  onCopyJoinGroupNumber,
  onOpenGroupEditor
}) => {
  return (
    <>
      <img src={JOIN_IMAGE} alt="檐枫社庆视觉图" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: '50% 48%' }} />
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.5)_36%,rgba(0,0,0,0.18)_62%,rgba(0,0,0,0.48)_100%)]"></div>
      <div className="absolute bottom-0 left-0 right-0 h-44 bg-[linear-gradient(0deg,#080808_0%,rgba(8,8,8,0)_100%)]"></div>

      <div className="relative z-10 mx-auto flex h-full max-w-[1600px] flex-col justify-center px-8 pb-16 pt-28 md:px-14 xl:px-20">
        <div className="max-w-5xl">
          <p className="font-mono text-sm uppercase tracking-[0.42em] text-white/68 md:text-base">WELCOME TO YANFENG</p>
          <h2 className="mt-7 text-6xl font-black leading-[0.92] tracking-[-0.04em] text-white md:text-8xl xl:text-[9rem]">
            欢迎加入
            <span className="mt-3 block text-[#c8322a]">檐枫动漫社</span>
          </h2>
          <p className="mt-8 font-mono text-2xl tracking-[0.12em] text-white/78 md:text-4xl">
            大好きだよ、みんな！
          </p>
        </div>

        <div className="mt-12 grid max-w-4xl gap-6 md:grid-cols-[auto_1fr] md:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.34em] text-white/56">QQ GROUP</p>
            <p className="mt-2 font-mono text-5xl font-black tracking-[0.08em] text-white md:text-7xl">{mainGroupNumber}</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <button
              type="button"
              onClick={() => void onCopyJoinGroupNumber()}
              className="group flex w-fit min-w-[220px] items-center justify-between gap-5 border border-white/22 bg-white/10 px-5 py-4 text-left text-white backdrop-blur-sm transition hover:border-[#c8322a] hover:bg-[#c8322a]"
            >
              <span>
                <span className="block text-lg font-black leading-none">{joinGroupCopied ? '已复制群号' : '复制群号'}</span>
                <span className="mt-2 block font-mono text-[10px] font-black leading-none tracking-[0.22em] text-white/58 group-hover:text-white/80">
                  {joinGroupCopied ? 'COPIED' : 'COPY QQ GROUP'}
                </span>
              </span>
              {joinGroupCopied ? <Check className="h-5 w-5 shrink-0" /> : <Copy className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" />}
            </button>
            {isEditMode && (
              <button
                type="button"
                onClick={onOpenGroupEditor}
                className="flex items-center gap-2 border border-[#c8322a] bg-black/48 px-4 py-3 text-sm font-black text-white backdrop-blur-sm transition hover:bg-[#c8322a]"
              >
                <Edit3 className="h-4 w-4" />
                修改群号
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default JoinPage;
