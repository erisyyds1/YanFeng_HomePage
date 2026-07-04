import React from 'react';
import { Check, Copy, MessageCircle } from 'lucide-react';
import { MOBILE_JOIN_IMAGE } from '../../data/mobileImages';

interface MobileJoinProps {
  mainGroupNumber: string;
  joinGroupCopied: boolean;
  onCopyJoinGroupNumber: () => void | Promise<void>;
}

const MobileJoin: React.FC<MobileJoinProps> = ({ mainGroupNumber, joinGroupCopied, onCopyJoinGroupNumber }) => {
  return (
    <section id="join" data-mobile-section="join" className="relative min-h-[92dvh] overflow-hidden px-5 pb-10 pt-[70px]">
      <img
        src={MOBILE_JOIN_IMAGE}
        alt="檐枫动漫社加入视觉"
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: '56% 48%' }}
      />
      <div className="absolute inset-0 bg-black/58"></div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.86),rgba(0,0,0,0.28)_58%,rgba(0,0,0,0.72))]"></div>
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-[linear-gradient(0deg,#080808,rgba(8,8,8,0))]"></div>

      <div className="relative z-10 flex min-h-[calc(92dvh-110px)] flex-col justify-between">
        <div className="-translate-y-8">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.38em] text-white/58">WELCOME TO YANFENG</p>
          <h2 className="mt-4 text-[3.4rem] font-black leading-[0.95] tracking-normal text-white">
            欢迎加入
            <span className="block text-[#c8322a]">檐枫动漫社</span>
          </h2>
        </div>

        <div>
          <p className="max-w-[330px] text-sm font-bold leading-relaxed text-white/68">
            无社费、无审核、无门槛。先加大群，按兴趣自由参加活动。
          </p>

          <div className="mt-8 border border-white/16 bg-black/58 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-[#c8322a]">
              <MessageCircle className="h-4 w-4" />
              <span className="font-mono text-[10px] font-black uppercase tracking-[0.28em]">QQ GROUP</span>
            </div>
            <p className="mt-3 break-all font-mono text-4xl font-black tracking-[0.08em] text-white">{mainGroupNumber}</p>
            <button
              type="button"
              onClick={() => void onCopyJoinGroupNumber()}
              className="mt-5 flex min-h-[52px] w-full items-center justify-between bg-[#c8322a] px-5 text-sm font-black tracking-[0.14em] text-white"
            >
              {joinGroupCopied ? '已复制群号' : '复制群号'}
              {joinGroupCopied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MobileJoin;
