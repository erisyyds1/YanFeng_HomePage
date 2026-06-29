import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clapperboard,
  Copy,
  Gamepad2,
  HeartHandshake,
  Home,
  Megaphone,
  Mic2,
  Music2,
  NotebookPen,
  PenTool,
  Radio,
  Send,
  ShieldCheck,
  Star,
  Theater,
  Trophy,
  UserPlus,
  Users,
  Video,
  Wand2
} from 'lucide-react';
import { AppTheme, NewsItem } from './types';
import { WECHAT_ARTICLES } from './constants';

import EventGallery from './components/EventGallery';
import MediaHub, { getMediaEntry, MEDIA_ENTRIES, type MediaContentId } from './components/MediaHub';
import WechatArchive from './components/WechatArchive';
import { fetchWeChatArticles } from './services/wechatService';
import logo from './assets/logo.svg';

type AnchorId = 'home' | 'about' | 'groups' | 'activities' | 'media' | 'join';

interface OfficialGroup {
  title: string;
  label: string;
  qq: string;
  description: string;
  newcomerNote: string;
  activities: string[];
  icon: React.ElementType;
}

interface ActivityItem {
  title: string;
  kicker: string;
  description: string;
  details: string[];
  icon: React.ElementType;
}

const HERO_IMAGE = '/image/yanfeng-hero.jpg';

const NAV_ITEMS: { label: string; labelEn: string; target: AnchorId; icon: React.ElementType }[] = [
  { label: '首页', labelEn: 'INDEX', target: 'home', icon: Home },
  { label: '情报', labelEn: 'INFORMATION', target: 'about', icon: ShieldCheck },
  { label: '小组', labelEn: 'GROUPS', target: 'groups', icon: Users },
  { label: '活动', labelEn: 'ACTIVITIES', target: 'activities', icon: CalendarDays },
  { label: '万象', labelEn: 'MEDIA', target: 'media', icon: Video },
  { label: '加入', labelEn: 'JOIN US', target: 'join', icon: UserPlus }
];

const SCREEN_IDS: AnchorId[] = ['home', 'about', 'groups', 'activities', 'media', 'join'];
const PAGE_TRANSITION_MS = 1180;
const PAGE_TRANSITION_EASE = 'cubic-bezier(0.68, 0.02, 0.88, 0.58)';
const SCROLL_GUIDE_DOTS = Array.from({ length: 28 }, (_, index) => index);

const formatGuideNumber = (value: number) => String(value).padStart(2, '0');

const ScrollGuide: React.FC<{ currentIndex: number; total: number }> = ({ currentIndex, total }) => {
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

const OFFICIAL_GROUPS: OfficialGroup[] = [
  {
    title: '事务组',
    label: 'SUPPORT',
    qq: '1054869730',
    description: '协助举办社团内各类大小活动，是冬日庆典、社庆、百团等活动顺利进行的重要后勤力量。',
    newcomerNote: '适合愿意做组织、协调、设备调试、后勤支持和现场执行的同学。',
    activities: ['设备调试', '后勤支持', '活动协助', '大型活动保障'],
    icon: Megaphone
  },
  {
    title: '宅舞组',
    label: 'DANCE',
    qq: '1018528156',
    description: '檐枫大型晚会中重要的节目来源。一起约舞、练舞、教学、排练节目，也会录制宅舞视频。',
    newcomerNote: '无论是否有基础，只要对宅舞感兴趣，都欢迎加入。',
    activities: ['日常约舞', '社舞教学', '群舞教学', '视频录制'],
    icon: Music2
  },
  {
    title: '创作组',
    label: 'CREATE',
    qq: '496866658',
    description: '热爱绘画、设计、文字、音乐、后期等同学们的大家庭，涵盖泛 ACGN 文化相关创作。',
    newcomerNote: '可以分享作品，也可以从观摩、学习、协作开始。',
    activities: ['绘画设计', '手书', '视频剪辑', '作品交流'],
    icon: PenTool
  },
  {
    title: '翻唱组',
    label: 'VOCAL',
    qq: '745254525',
    description: '面向所有热爱 ACGN 相关歌曲、喜欢唱歌并愿意唱歌的同学。',
    newcomerNote: '觉得自己水平还不够也没关系，唱得开心才是最重要的目标。',
    activities: ['新生歌会', 'KTV 聚会', '翻唱交流', '晚会节目'],
    icon: Mic2
  },
  {
    title: '舞台剧组',
    label: 'STAGE',
    qq: '912127654',
    description: '爱好表演、舞台剧、剧本创作和 cos 的大家聚在一起玩的地方。',
    newcomerNote: '对表演、剧本、舞台或幕后协作感兴趣都可以来。',
    activities: ['剧本创作', '舞台排练', '角色演出', 'Cos 协作'],
    icon: Theater
  },
  {
    title: 'Delta 组',
    label: 'DELTA',
    qq: '290772952',
    description: '提供创作与分享的平台，也协助事务组进行社团活动的预热与宣传。',
    newcomerNote: '适合分享作品、写杂谈、做采访、安利动漫游戏小说等泛 ACGN 内容。',
    activities: ['文字创作', '作品安利', '记者采访', '推文放送'],
    icon: NotebookPen
  },
  {
    title: 'Wota 艺组',
    label: 'WOTA',
    qq: '876209001',
    description: '用应援棒描绘光与影。每周常有教学和练习，也会进行表演和企划视频录制。',
    newcomerNote: '新人不需要基础，可以从周三、周六晚上的组活练习开始。',
    activities: ['Wota 教学', '组活练习', '晚会表演', '企划视频'],
    icon: Clapperboard
  },
  {
    title: '轻音组',
    label: 'BAND',
    qq: '914316313',
    description: '面向乐器、乐队和 ACGN 音乐爱好者，用于交流、资源分享、技术讨论和合作组队。',
    newcomerNote: '乐器高手、练习新手，甚至只是想点歌听的纯路人都欢迎。',
    activities: ['琴技交流', '乐队组建', '专场 Live', 'ACGN 音乐讨论'],
    icon: Radio
  },
  {
    title: 'VOCALOID 组',
    label: 'VOCALOID',
    qq: '361980809',
    description: '以泛 VOCALOID 创作为中心，也交流 Synthesizer V、CeVIO、UTAU 等音声合成内容。',
    newcomerNote: '术术人、创作者、音乐萌新或只是想找到同好，都可以获得独特体验。',
    activities: ['作品翻调', '原创曲目', '调校教学', '作编曲教学'],
    icon: Wand2
  },
  {
    title: '番剧鉴赏组',
    label: 'ANIME',
    qq: '924171013',
    description: '围绕动画新番、经典作品和观影交流展开，一起追番、补番、讨论作品，也可以组织放映与安利。',
    newcomerNote: '适合喜欢看番、想找人一起讨论剧情演出，或者刚开始接触动画的新朋友。',
    activities: ['新番交流', '作品安利', '放映讨论', '补番推荐'],
    icon: Video
  }
];

const INTEREST_GROUPS = ['明日方舟组', '东方组', '拉拉组', 'Cos 组', '配音组', '摄影剪辑组', '文艺部', '更多自由方向'];

const ACTIVITIES: ActivityItem[] = [
  {
    title: '百团大战 / 迎新',
    kicker: 'ENTRY POINT',
    description: '新生接触檐枫的重要入口。摊位、节目表演、社团介绍、抽奖和现场交流都会在这里发生。',
    details: ['开学约一个月后', '摊位介绍', '节目表演'],
    icon: Megaphone
  },
  {
    title: '冬日庆典',
    kicker: '1ST TERM FINALE',
    description: '第一学期末的大型晚会。乐队、宅舞、翻唱、舞台剧、创作组手书、Wota 艺都会在这里出现。',
    details: ['12 月左右', '大型晚会', '多组节目'],
    icon: Star
  },
  {
    title: '社庆',
    kicker: 'ANNIVERSARY',
    description: '第二学期末的大型晚会。不只是节目展示，也承载着社团回忆、成员情感和归属感。',
    details: ['5 月左右', '周年纪念', '舞台节目'],
    icon: HeartHandshake
  },
  {
    title: 'GMA',
    kicker: 'ANIME AWARDS',
    description: '檐枫的年终动画评选活动，包含动画评选、视频剪辑、奖项设计、活动筹备和直播颁奖。',
    details: ['年终评选', '视频制作', '直播颁奖'],
    icon: Trophy
  },
  {
    title: '日常活动',
    kicker: 'DAILY LIFE',
    description: '放映会、各组组活、练舞、Wota 教学、合宿、联合观影、轻音专场和高校联动。',
    details: ['不定期', '自由参加', '认识朋友'],
    icon: Gamepad2
  }
];

const App: React.FC = () => {
  const [wechatNews, setWechatNews] = useState<NewsItem[]>(WECHAT_ARTICLES);
  const [selectedGroup, setSelectedGroup] = useState(0);
  const [copiedGroupTitle, setCopiedGroupTitle] = useState<string | null>(null);
  const [activeScreen, setActiveScreen] = useState<AnchorId>('home');
  const [activeMediaEntry, setActiveMediaEntry] = useState<MediaContentId | null>(null);
  const [outgoingScreen, setOutgoingScreen] = useState<AnchorId | null>(null);
  const [transitionDirection, setTransitionDirection] = useState(0);
  const activeScreenRef = useRef<AnchorId>('home');
  const activeMediaEntryRef = useRef<MediaContentId | null>(null);
  const mediaPageRef = useRef<HTMLElement | null>(null);
  const radioAudioRef = useRef<HTMLAudioElement | null>(null);
  const radioAutoPlayCleanupRef = useRef<(() => void) | null>(null);
  const radioHasStartedRef = useRef(false);
  const radioPlayAttemptRef = useRef(false);
  const outgoingTimerRef = useRef<number | null>(null);
  const transitionLockRef = useRef(false);
  const wheelLockRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    document.body.setAttribute('data-theme', AppTheme.DEFAULT);
  }, []);

  useEffect(() => {
    activeScreenRef.current = activeScreen;
  }, [activeScreen]);

  useEffect(() => {
    activeMediaEntryRef.current = activeMediaEntry;
    if (activeMediaEntry && mediaPageRef.current) {
      mediaPageRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [activeMediaEntry]);

  useEffect(() => {
    return () => {
      if (outgoingTimerRef.current) window.clearTimeout(outgoingTimerRef.current);
    };
  }, []);

  const removeRadioAutoPlayListeners = () => {
    if (!radioAutoPlayCleanupRef.current) return;
    radioAutoPlayCleanupRef.current();
    radioAutoPlayCleanupRef.current = null;
  };

  const playRadio = async () => {
    const audio = radioAudioRef.current;
    if (!audio || radioPlayAttemptRef.current) return false;

    radioPlayAttemptRef.current = true;
    audio.volume = 0.35;
    audio.loop = true;

    try {
      await audio.play();
      radioHasStartedRef.current = true;
      removeRadioAutoPlayListeners();
      return true;
    } catch (error) {
      console.warn('YANFENG RADIO playback was blocked:', error);
      return false;
    } finally {
      radioPlayAttemptRef.current = false;
    }
  };

  useEffect(() => {
    const audio = radioAudioRef.current;
    if (!audio) return;

    audio.volume = 0.35;
    audio.loop = true;

    const handleFirstClick = () => {
      if (radioHasStartedRef.current) {
        removeRadioAutoPlayListeners();
        return;
      }
      void playRadio();
    };
    const clickAutoPlayOptions: AddEventListenerOptions = { capture: true };

    const cleanup = () => {
      window.removeEventListener('click', handleFirstClick, clickAutoPlayOptions);
    };

    radioAutoPlayCleanupRef.current = cleanup;
    window.addEventListener('click', handleFirstClick, clickAutoPlayOptions);

    return cleanup;
  }, []);

  useEffect(() => {
    const loadNews = async () => {
      try {
        const data = await fetchWeChatArticles();
        setWechatNews(data && data.length > 0 ? data : WECHAT_ARTICLES);
      } catch (e) {
        console.error('Failed to load news due to error:', e);
        setWechatNews(WECHAT_ARTICLES);
      }
    };
    loadNews();
  }, []);

  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const goToScreen = (target: AnchorId) => {
    const current = activeScreenRef.current;
    if (current === target) return;
    if (transitionLockRef.current) return;

    const currentIndex = SCREEN_IDS.indexOf(current);
    const targetIndex = SCREEN_IDS.indexOf(target);

    transitionLockRef.current = true;
    setOutgoingScreen(current);
    setTransitionDirection(targetIndex > currentIndex ? 1 : -1);
    setActiveScreen(target);

    if (outgoingTimerRef.current) window.clearTimeout(outgoingTimerRef.current);
    outgoingTimerRef.current = window.setTimeout(() => {
      setOutgoingScreen(null);
      transitionLockRef.current = false;
      outgoingTimerRef.current = null;
    }, prefersReducedMotion() ? 120 : PAGE_TRANSITION_MS + 80);
  };

  const showHomeSection = (target: AnchorId = 'home') => {
    setActiveMediaEntry(null);
    goToScreen(target);
  };

  const copyGroupNumber = async (group: OfficialGroup) => {
    const groupNumber = group.qq.trim();
    if (!groupNumber || groupNumber === '待补充') return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(groupNumber);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = groupNumber;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      setCopiedGroupTitle(group.title);
      window.setTimeout(() => {
        setCopiedGroupTitle((current) => (current === group.title ? null : current));
      }, 1600);
    } catch (error) {
      console.error('Failed to copy group number:', error);
    }
  };

  const openMediaEntry = (entry: MediaContentId) => {
    setActiveMediaEntry(entry);
  };

  const closeMediaEntry = () => {
    setActiveMediaEntry(null);
    if (activeScreenRef.current !== 'media') {
      goToScreen('media');
    }
  };

  const handlePagerWheel = (event: React.WheelEvent<HTMLElement>) => {
    if (activeMediaEntryRef.current) return;

    const wheelIntent = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (Math.abs(wheelIntent) < 24 || wheelLockRef.current || transitionLockRef.current) {
      if (wheelLockRef.current || transitionLockRef.current) event.preventDefault();
      return;
    }

    const currentIndex = SCREEN_IDS.indexOf(activeScreenRef.current);
    const direction = wheelIntent > 0 ? 1 : -1;
    const nextIndex = Math.min(Math.max(currentIndex + direction, 0), SCREEN_IDS.length - 1);

    if (nextIndex === currentIndex) return;

    event.preventDefault();
    wheelLockRef.current = true;
    goToScreen(SCREEN_IDS[nextIndex]);
    window.setTimeout(() => {
      wheelLockRef.current = false;
    }, prefersReducedMotion() ? 120 : PAGE_TRANSITION_MS);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (activeMediaEntryRef.current) {
        if (event.key === 'Escape') closeMediaEntry();
        return;
      }

      const currentIndex = SCREEN_IDS.indexOf(activeScreenRef.current);
      const nextIndex =
        event.key === 'ArrowRight' || event.key === 'PageDown'
          ? Math.min(currentIndex + 1, SCREEN_IDS.length - 1)
          : event.key === 'ArrowLeft' || event.key === 'PageUp'
            ? Math.max(currentIndex - 1, 0)
            : currentIndex;

      if (nextIndex !== currentIndex) {
        event.preventDefault();
        goToScreen(SCREEN_IDS[nextIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    if (activeMediaEntryRef.current) return;
    if (!touchStartRef.current) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY)) return;

    const currentIndex = SCREEN_IDS.indexOf(activeScreenRef.current);
    const nextIndex = deltaX < 0 ? Math.min(currentIndex + 1, SCREEN_IDS.length - 1) : Math.max(currentIndex - 1, 0);
    if (nextIndex !== currentIndex) goToScreen(SCREEN_IDS[nextIndex]);
  };

  const activeGroup = OFFICIAL_GROUPS[selectedGroup];
  const GroupIcon = activeGroup.icon;
  const activeMedia = activeMediaEntry ? getMediaEntry(activeMediaEntry) : null;
  const activeGroupCanCopy = activeGroup.qq.trim() !== '' && activeGroup.qq !== '待补充';
  const activeGroupCopied = copiedGroupTitle === activeGroup.title;
  const activeScreenIndex = SCREEN_IDS.indexOf(activeScreen);

  const getPanelStyle = (index: number): React.CSSProperties => {
    const screen = SCREEN_IDS[index];
    const isActive = activeScreen === screen;
    const isOutgoing = outgoingScreen === screen;
    const concealedFromLeft = 'polygon(-12% 0, -12% 0, 4% 100%, 4% 100%)';
    const concealedFromRight = 'polygon(96% 0, 112% 0, 112% 100%, 96% 100%)';
    const revealed = 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';
    const maskClip = isActive || isOutgoing ? revealed : index < activeScreenIndex ? concealedFromLeft : concealedFromRight;
    const isVisiblePanel = isActive || isOutgoing;
    const coverShadow =
      isActive && outgoingScreen
        ? transitionDirection >= 0
          ? '-34px 0 90px rgb(0 0 0 / 0.56)'
          : '34px 0 90px rgb(0 0 0 / 0.56)'
        : 'none';

    return {
      zIndex: isActive ? 30 : isOutgoing ? 20 : 0,
      clipPath: maskClip,
      WebkitClipPath: maskClip,
      opacity: 1,
      filter: isOutgoing ? 'brightness(0.45) saturate(0.78)' : 'none',
      pointerEvents: isActive ? 'auto' : 'none',
      boxShadow: coverShadow,
      transition: prefersReducedMotion() || !isVisiblePanel
        ? 'none'
        : [
            `clip-path ${PAGE_TRANSITION_MS}ms ${PAGE_TRANSITION_EASE}`,
            `-webkit-clip-path ${PAGE_TRANSITION_MS}ms ${PAGE_TRANSITION_EASE}`,
            `filter ${PAGE_TRANSITION_MS}ms ${PAGE_TRANSITION_EASE}`,
            `box-shadow ${PAGE_TRANSITION_MS}ms ${PAGE_TRANSITION_EASE}`
          ].join(', ')
    };
  };

  const getPanelState = (screen: AnchorId) => {
    if (activeScreen === screen) return 'active';
    if (outgoingScreen === screen) return 'outgoing';
    return 'idle';
  };

  const renderMediaPlaceholder = () => {
    if (!activeMedia) return null;
    const MediaIcon = activeMedia.icon;

    return (
      <div className="grid min-h-[520px] place-items-center bg-white p-2 shadow-[6px_6px_0px_var(--theme-border)]">
        <div className="flex h-full w-full flex-col items-center justify-center bg-[#111] px-6 py-16 text-center text-white">
          <div className="flex h-20 w-20 items-center justify-center border-4 border-[#c8322a] bg-black">
            <MediaIcon className="h-10 w-10 text-[#c8322a]" />
          </div>
          <p className="mt-8 text-sm font-black tracking-[0.35em] text-[#c8322a]">{activeMedia.label}</p>
          <h3 className="mt-3 text-4xl font-black tracking-[-0.04em] md:text-5xl">{activeMedia.title}</h3>
          <p className="mt-5 max-w-xl text-base font-bold leading-relaxed text-white/62">{activeMedia.description}</p>
          <p className="mt-8 border border-white/18 px-4 py-3 text-sm font-black tracking-[0.16em] text-white/65">内容整理中</p>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[100dvh] bg-[#080808] text-[#f6f0dc] font-sans overflow-hidden selection:bg-[#c8322a] selection:text-white">
      <div className="fixed inset-0 pointer-events-none opacity-[0.08] checker-bg"></div>

      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/72 backdrop-blur-md">
        <div className="flex h-[76px] items-stretch justify-between px-4 md:h-[92px] md:px-8 xl:px-12">
          <div className="flex w-[190px] shrink-0 items-center gap-4 text-left md:w-[250px] xl:w-[300px]">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/70 bg-[#c8322a] shadow-[3px_3px_0_#000] md:h-16 md:w-16">
              <span
                className="h-10 w-10 bg-white md:h-12 md:w-12"
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
            </span>
            <span>
              <span className="block text-2xl font-black leading-none tracking-[0.18em] text-white md:text-3xl">檐枫</span>
              <span className="mt-2 block text-[10px] font-bold uppercase tracking-[0.28em] text-white/50 md:text-xs">YANFENG ACGN</span>
            </span>
          </div>

          <nav className="hidden flex-1 items-stretch justify-center lg:flex">
            {NAV_ITEMS.map((item) => {
              const active = item.target === activeScreen;
              const handleClick = () => showHomeSection(item.target);
              return (
                <button
                  key={item.target}
                  type="button"
                  onClick={handleClick}
                  className={`group flex min-w-[92px] flex-col items-center justify-center border-x border-white/[0.03] px-2 text-center transition hover:bg-white/[0.04] xl:min-w-[116px] 2xl:min-w-[136px] ${
                    active ? 'text-[#c8322a]' : 'text-white/82 hover:text-white'
                  }`}
                >
                  <span className="block text-[15px] font-black leading-none tracking-[0.05em] md:text-[18px] xl:text-[21px]">{item.labelEn}</span>
                  <span className="mt-2 block text-[11px] font-black leading-none tracking-[0.1em] md:text-[13px]">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => showHomeSection('join')}
            className="hidden w-[112px] shrink-0 flex-col items-center justify-center border-l border-white/10 bg-white/[0.03] text-white/75 transition hover:bg-[#c8322a] hover:text-white lg:flex xl:w-[136px]"
          >
            <UserPlus className="h-7 w-7 md:h-8 md:w-8" />
            <span className="mt-2 text-[11px] font-black tracking-[0.18em]">JOIN</span>
          </button>
        </div>
        <nav className="flex gap-2 overflow-x-auto border-t border-white/10 px-4 py-2 lg:hidden">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const handleClick = () => showHomeSection(item.target);
            return (
              <button
                key={item.target}
                type="button"
                onClick={handleClick}
                className="flex shrink-0 items-center gap-2 border border-white/10 bg-black/45 px-3 py-2 text-[11px] font-black tracking-[0.12em] text-white/75 transition hover:border-[#c8322a] hover:bg-[#c8322a] hover:text-white"
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {activeMedia ? (
        <main ref={mediaPageRef} className="h-[100dvh] overflow-y-auto px-5 pb-20 pt-28 md:px-10">
          <div className="mx-auto max-w-[1500px]">
            <div className="mb-8 flex flex-col gap-5 border-b border-white/15 pb-6">
              <button
                type="button"
                onClick={closeMediaEntry}
                className="flex w-fit items-center gap-2 border border-white/20 px-5 py-3 text-sm font-black text-white transition hover:border-[#c8322a] hover:bg-[#c8322a]"
              >
                <ArrowLeft className="h-4 w-4" />
                返回檐枫万象
              </button>

              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-black tracking-[0.45em] text-[#c8322a]">{activeMedia.label}</p>
                  <h1 className="mt-2 text-5xl font-black tracking-[-0.05em] text-white md:text-7xl">{activeMedia.title}</h1>
                  <p className="mt-4 max-w-2xl text-base font-bold leading-relaxed text-white/60">{activeMedia.description}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {MEDIA_ENTRIES.map((entry) => {
                    const EntryIcon = entry.icon;
                    const active = entry.id === activeMediaEntry;

                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => openMediaEntry(entry.id)}
                        className={`flex items-center gap-2 border px-3 py-2 text-xs font-black tracking-[0.12em] transition ${
                          active ? 'border-[#c8322a] bg-[#c8322a] text-white' : 'border-white/15 bg-black/35 text-white/65 hover:border-white/35 hover:text-white'
                        }`}
                      >
                        <EntryIcon className="h-3.5 w-3.5" />
                        {entry.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {activeMediaEntry === 'videos' && <EventGallery currentTheme={AppTheme.DEFAULT} />}
            {activeMediaEntry === 'wechat' && <WechatArchive articles={wechatNews} />}
            {(activeMediaEntry === 'vocaloid' || activeMediaEntry === 'gallery') && renderMediaPlaceholder()}
          </div>
        </main>
      ) : (
        <main
          onWheel={handlePagerWheel}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative h-[100dvh] overflow-hidden"
        >
        <div className="relative h-full w-full overflow-hidden">
          <section
            id="home"
            data-active={activeScreen === 'home'}
            data-state={getPanelState('home')}
            style={getPanelStyle(0)}
            className="page-panel absolute inset-0 h-[100dvh] w-full overflow-hidden pt-28 lg:pt-20"
          >
            <img src={HERO_IMAGE} alt="檐枫娘主视觉" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: '66% 42%' }} />
            <div className="absolute inset-0 bg-black/35"></div>
            <div className="absolute inset-y-0 left-0 w-full bg-[linear-gradient(90deg,#080808_0%,rgba(8,8,8,.86)_34%,rgba(8,8,8,.45)_58%,rgba(8,8,8,.08)_100%)]"></div>
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-[linear-gradient(0deg,#080808_0%,rgba(8,8,8,0)_100%)]"></div>

            <div className="relative z-10 mx-auto grid h-full max-w-[1600px] content-center px-5 py-8 md:px-10 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="max-w-3xl">
                <p className="text-sm font-black tracking-[0.45em] text-[#c8322a] md:text-base">北京邮电大学 ACGN 爱好者的聚集地</p>
                <h1 className="mt-4 text-[4.5rem] font-black leading-[0.86] tracking-[-0.06em] text-white md:text-[7rem] xl:text-[9rem]">
                  檐枫
                  <span className="block text-[#c8322a]">动漫社</span>
                </h1>
                <p className="mt-7 max-w-xl text-xl font-black leading-relaxed text-white md:text-2xl">
                  看番、宅舞、wota艺、创作、唱歌、乐队，舞台剧，cosplay，术力口，包罗万象的二次元社团。
                </p>

                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => showHomeSection('about')}
                    className="group flex items-center justify-center gap-3 bg-[#c8322a] px-7 py-4 text-sm font-black tracking-[0.18em] text-white shadow-[6px_6px_0_#000] transition hover:-translate-y-1"
                  >
                    更多情报
                    <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                  </button>
                  <button
                    type="button"
                    onClick={() => showHomeSection('join')}
                    className="flex items-center justify-center gap-3 border border-white/50 bg-black/55 px-7 py-4 text-sm font-black tracking-[0.18em] text-white shadow-[6px_6px_0_#000] transition hover:-translate-y-1 hover:border-white"
                  >
                    加入我们
                    <Send className="h-5 w-5 text-[#c8322a]" />
                  </button>
                </div>
              </div>

              <div className="mt-12 flex items-end justify-start lg:mt-0 lg:justify-end">
                <div className="w-full max-w-xl border-l-4 border-[#c8322a] bg-black/55 p-5 backdrop-blur-sm">
                  <div className="grid grid-cols-2 gap-px bg-white/20 text-sm">
                    {[
                      ['超多活跃成员', '历年动漫社大群接近千人，轻松找到同好'],
                      ['超多精彩活动', '百团大战，GMA，冬日庆典 / 社庆'],
                      ['零门槛加入', '无社费无审核，零门槛加入'],
                      ['自由参加', '自由参加喜欢的活动，无绑定无强制']
                    ].map(([label, value]) => (
                      <div key={label} className="min-h-[118px] bg-[#111] p-5">
                        <p className="text-sm font-black leading-snug tracking-[0.08em] text-[#c8322a] md:text-base">{label}</p>
                        <p className="mt-3 text-lg font-black leading-snug text-white md:text-xl">{value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-5 text-sm font-bold leading-relaxed text-white/70">
                    这里首先是大家一起开心玩的地方。没有基础，浓度不高都没有关系，都欢迎加入。
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section
            id="about"
            data-active={activeScreen === 'about'}
            data-state={getPanelState('about')}
            style={getPanelStyle(1)}
            className="page-panel absolute inset-0 h-[100dvh] w-full overflow-hidden border-y border-white/10 bg-[#090909] px-5 py-24 md:px-10"
          >
            <div className="pointer-events-none absolute inset-0 bg-[#070707]"></div>
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.04)_1px,transparent_1px)] opacity-35 [background-size:160px_160px]"></div>
            <div className="pointer-events-none absolute left-0 top-24 h-px w-full bg-white/10"></div>
            <div className="pointer-events-none absolute bottom-[13%] left-0 h-px w-full bg-white/10"></div>
            <div className="pointer-events-none absolute left-[7%] top-0 h-full w-px bg-white/10"></div>
            <div className="pointer-events-none absolute right-[11%] top-0 h-full w-px bg-[#c8322a]/18"></div>
            <div className="pointer-events-none absolute bottom-[calc(13%+0.75rem)] left-8 text-[7rem] font-black leading-none tracking-[-0.08em] text-white/[0.035] md:text-[11rem]">
              INFORMATION
            </div>
            <div className="pointer-events-none absolute right-10 top-28 h-28 w-28 border-r-2 border-t-2 border-[#c8322a]/35"></div>

            <div className="relative mx-auto grid h-full max-w-[1600px] gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
              <div className="max-w-2xl">
                <p className="text-xs font-black tracking-[0.45em] text-[#c8322a]">INFORMATION / 01</p>
                <h2 className="mt-4 text-5xl font-black leading-[0.94] tracking-[-0.05em] text-white md:text-7xl xl:text-8xl">
                  檐枫
                  <span className="block text-[#c8322a]">社群结构</span>
                </h2>
                <p className="mt-6 max-w-xl text-base font-bold leading-loose text-white/68 md:text-lg">
                  檐枫不是只靠一个部门运转的社团。QQ 大群负责日常入口，官方组承接稳定组活与大型晚会，兴趣组则让同好自由聚在一起。
                </p>
                <div className="mt-8 grid max-w-xl grid-cols-3 gap-px bg-white/18">
                  {[
                    ['ENTRY', 'QQ 大群'],
                    ['OFFICIAL', '十大官方组'],
                    ['FREE', '兴趣组']
                  ].map(([label, value]) => (
                    <div key={label} className="bg-[#111] px-4 py-4">
                      <p className="text-[10px] font-black tracking-[0.22em] text-[#c8322a]">{label}</p>
                      <p className="mt-2 text-sm font-black text-white md:text-base">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative min-h-[520px] overflow-hidden border border-white/12 bg-[#0c0c0c] shadow-[10px_10px_0_rgb(0_0_0/0.28)] md:min-h-[560px]">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.035)_1px,transparent_1px)] opacity-35 [background-size:96px_96px]"></div>
                <div className="pointer-events-none absolute left-0 top-0 h-full w-1.5 bg-[#c8322a]"></div>
                <div className="pointer-events-none absolute right-6 top-6 h-16 w-16 border-r-2 border-t-2 border-[#c8322a]/45"></div>
                <div className="pointer-events-none absolute -right-16 top-8 text-[11rem] font-black leading-none tracking-[-0.08em] text-white/[0.03] md:text-[16rem]">
                  YF
                </div>
                <div className="relative z-10 grid h-full grid-rows-[auto_1fr]">
                  <div className="flex items-center justify-between border-b border-white/12 px-5 py-4 md:px-7">
                    <div>
                      <p className="text-[10px] font-black tracking-[0.34em] text-[#c8322a]">STRUCTURE FILE</p>
                      <h3 className="mt-1 text-2xl font-black text-white md:text-3xl">从入口到小组</h3>
                    </div>
                    <div className="border border-[#c8322a] px-3 py-2 text-xs font-black tracking-[0.22em] text-[#c8322a]">
                      OPEN
                    </div>
                  </div>

                  <div className="grid h-full gap-px bg-white/10 md:grid-cols-[0.86fr_1.14fr]">
                    <article className="flex flex-col justify-between bg-[#111] p-5 md:p-7">
                      <div>
                        <span className="inline-flex h-12 w-12 items-center justify-center bg-[#c8322a] text-lg font-black text-white">01</span>
                        <p className="mt-5 text-xs font-black tracking-[0.3em] text-[#c8322a]">QQ GROUP</p>
                        <h4 className="mt-2 text-4xl font-black tracking-[-0.04em] text-white md:text-5xl">QQ 大群</h4>
                        <p className="mt-5 text-sm font-bold leading-loose text-white/64">
                          檐枫的日常入口。聊天、通知、活动消息、同好交流都从这里开始。
                        </p>
                      </div>
                      <div className="mt-6 border-l-4 border-[#c8322a] bg-black/35 px-4 py-3">
                        <p className="text-sm font-black text-white">加入群聊以后，你就已经是檐枫的一份子。</p>
                      </div>
                    </article>

                    <div className="grid gap-px bg-white/10">
                      <article className="bg-[#151515] p-5 md:p-7">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-black tracking-[0.3em] text-[#c8322a]">OFFICIAL GROUPS / 02</p>
                            <h4 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white md:text-4xl">十大官方组</h4>
                            <p className="mt-3 text-sm font-bold leading-relaxed text-white/60">稳定组活与大型晚会的主力。</p>
                          </div>
                          <ShieldCheck className="h-9 w-9 text-[#c8322a]" strokeWidth={2.4} />
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2">
                          {OFFICIAL_GROUPS.map((group) => (
                            <span key={group.title} className="border border-white/12 bg-black/30 px-2.5 py-1.5 text-xs font-black text-white/75">
                              {group.title}
                            </span>
                          ))}
                        </div>
                      </article>

                      <article className="bg-[#151515] p-5 md:p-7">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-black tracking-[0.3em] text-[#c8322a]">INTEREST GROUPS / 03</p>
                            <h4 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white md:text-4xl">众多兴趣组</h4>
                            <p className="mt-3 text-sm font-bold leading-relaxed text-white/60">自由生长的同好空间，想聊什么就聚成什么方向。</p>
                          </div>
                          <Users className="h-9 w-9 text-[#c8322a]" strokeWidth={2.4} />
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2">
                          {INTEREST_GROUPS.map((group) => (
                            <span key={group} className="border border-white/12 bg-black/30 px-2.5 py-1.5 text-xs font-black text-white/75">
                              {group}
                            </span>
                          ))}
                        </div>
                      </article>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            id="groups"
            data-active={activeScreen === 'groups'}
            data-state={getPanelState('groups')}
            style={getPanelStyle(2)}
            className="page-panel absolute inset-0 h-[100dvh] w-full overflow-hidden bg-[#080808] px-5 py-24 md:px-10"
          >
            <div className="mx-auto flex h-full max-w-[1600px] flex-col justify-center">
              <div className="mb-7 flex flex-col gap-4 border-b border-white/15 pb-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-black tracking-[0.45em] text-[#c8322a]">GROUPS / 02</p>
                  <h2 className="mt-3 text-5xl font-black tracking-[-0.05em] text-white md:text-7xl">十大官方组</h2>
                </div>
                <p className="max-w-2xl text-sm font-bold leading-relaxed text-white/60">
                  可以同时加入多个组，无加入限制，无强制绑定。
                </p>
              </div>

              <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
                <div className="grid gap-1 pr-1">
                  {OFFICIAL_GROUPS.map((group, index) => {
                    const Icon = group.icon;
                    const active = index === selectedGroup;
                    return (
                      <button
                        key={group.title}
                        type="button"
                        onClick={() => setSelectedGroup(index)}
                        className={`flex items-center justify-between border px-4 py-3 text-left transition ${
                          active ? 'border-[#c8322a] bg-[#c8322a] text-white' : 'border-white/10 bg-[#121212] text-white/65 hover:border-white/35 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          <span>
                            <span className="block text-sm font-black">{group.title}</span>
                            <span className="mt-0.5 block text-[10px] font-bold tracking-[0.22em] opacity-70">{group.label}</span>
                          </span>
                        </span>
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    );
                  })}
                </div>

                <div className="relative overflow-hidden border border-white/10 bg-[#121212] p-7 md:p-10">
                  <div className="absolute right-8 top-8 text-[7rem] font-black leading-none text-white/[0.03] md:text-[12rem]">{activeGroup.label}</div>
                  <div className="relative z-10">
                    <div className="mb-8">
                      <div className="flex flex-wrap items-end gap-4">
                        <span className="flex h-16 w-16 items-center justify-center bg-[#c8322a] text-white md:h-20 md:w-20">
                          <GroupIcon className="h-8 w-8 md:h-10 md:w-10" />
                        </span>
                        <div>
                          <p className="text-xs font-black tracking-[0.4em] text-[#c8322a]">{activeGroup.label}</p>
                          <h3 className="text-5xl font-black tracking-[-0.04em] text-white md:text-6xl">{activeGroup.title}</h3>
                        </div>

                        <div className="flex min-h-[72px] overflow-hidden bg-[#101010] text-white shadow-[4px_4px_0_rgb(0_0_0/0.28)]">
                          <div className="flex flex-col justify-center border-l-4 border-[#c8322a] px-4 py-2">
                            <p className="text-[10px] font-black tracking-[0.26em] text-[#c8322a]">QQ GROUP</p>
                            <p className="mt-1 font-mono text-2xl font-black leading-none text-white/90 md:text-3xl">{activeGroup.qq}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyGroupNumber(activeGroup)}
                            disabled={!activeGroupCanCopy}
                            className={`group flex min-w-[132px] items-center justify-between gap-4 border-l border-black/35 px-4 text-left transition ${
                              activeGroupCanCopy
                                ? 'bg-[#c8322a] text-white hover:bg-white hover:text-[#c8322a]'
                                : 'cursor-not-allowed bg-white/10 text-white/35'
                            }`}
                          >
                            <span>
                              <span className="block text-base font-black leading-none">{activeGroupCopied ? '已复制' : activeGroupCanCopy ? '复制群号' : '暂无群号'}</span>
                              <span className="mt-1 block text-[10px] font-black leading-none tracking-[0.12em]">
                                {activeGroupCopied ? 'COPIED' : activeGroupCanCopy ? 'COPY QQ' : 'NO DATA'}
                              </span>
                            </span>
                            {activeGroupCopied ? (
                              <Check className="h-5 w-5 shrink-0" />
                            ) : (
                              <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="text-2xl font-black leading-relaxed text-white md:text-4xl">{activeGroup.description}</p>
                    <p className="mt-6 max-w-3xl text-base font-bold leading-relaxed text-white/60">{activeGroup.newcomerNote}</p>

                    <div className="mt-10 bg-black p-5">
                      <p className="mb-4 text-xs font-black tracking-[0.28em] text-[#c8322a]">COMMON ACTIVITIES</p>
                      <div className="flex flex-wrap gap-2">
                        {activeGroup.activities.map((activity) => (
                          <span key={activity} className="border border-white/15 px-3 py-2 text-xs font-black tracking-[0.12em] text-white/75">
                            {activity}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 overflow-hidden border-y border-white/15 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-black tracking-[0.18em] text-[#c8322a]">兴趣组：</span>
                  {INTEREST_GROUPS.map((group) => (
                    <span key={group} className="bg-white px-4 py-2 text-xs font-black tracking-[0.14em] text-black">
                      {group}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section
            id="activities"
            data-active={activeScreen === 'activities'}
            data-state={getPanelState('activities')}
            style={getPanelStyle(3)}
            className="page-panel absolute inset-0 h-[100dvh] w-full overflow-hidden bg-[#101010] px-5 py-24 md:px-10"
          >
            <div className="mx-auto flex h-full max-w-[1600px] flex-col justify-center">
              <div className="mb-8 grid gap-6 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
                <div>
                  <p className="text-xs font-black tracking-[0.45em] text-[#c8322a]">EVENTS / 03</p>
                  <h2 className="mt-3 text-5xl font-black tracking-[-0.05em] text-white md:text-7xl">活动信号</h2>
                </div>
                <p className="text-xl font-black leading-relaxed text-white/75">
                  檐枫既有每学期的大型晚会，也有放映、组活、练舞、合宿和联合观影这些轻松日常。
                </p>
              </div>

              <div className="grid gap-px bg-white/15 lg:grid-cols-5">
                {ACTIVITIES.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <article key={activity.title} className={`${index === 1 ? 'bg-[#c8322a] text-white' : 'bg-[#151515] text-white'} min-h-[310px] p-5 xl:p-6`}>
                      <div className="flex items-start justify-between">
                        <Icon className="h-9 w-9" />
                        <span className="font-mono text-xs font-black opacity-60">0{index + 1}</span>
                      </div>
                      <p className="mt-8 text-[10px] font-black tracking-[0.28em] opacity-70">{activity.kicker}</p>
                      <h3 className="mt-3 text-3xl font-black tracking-[-0.03em]">{activity.title}</h3>
                      <p className="mt-5 text-sm font-bold leading-relaxed opacity-75">{activity.description}</p>
                      <div className="mt-8 flex flex-wrap gap-2">
                        {activity.details.map((detail) => (
                          <span key={detail} className="border border-white/25 px-2 py-1 text-[10px] font-black">
                            {detail}
                          </span>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          <section
            id="media"
            data-active={activeScreen === 'media'}
            data-state={getPanelState('media')}
            style={getPanelStyle(4)}
            className="page-panel absolute inset-0 h-[100dvh] w-full overflow-hidden bg-[#080808] pb-0 pt-24 md:pt-28"
          >
            <div className="h-full w-full">
              <MediaHub onOpenEntry={openMediaEntry} />
            </div>
          </section>

          <section
            id="join"
            data-active={activeScreen === 'join'}
            data-state={getPanelState('join')}
            style={getPanelStyle(5)}
            className="page-panel absolute inset-0 h-[100dvh] w-full overflow-hidden bg-[#080808] px-5 py-24 text-white md:px-10"
          >
            <div className="pointer-events-none absolute inset-0 bg-[#070707]"></div>
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.052)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.038)_1px,transparent_1px)] opacity-34 [background-size:160px_160px]"></div>
            <div className="pointer-events-none absolute left-[22px] top-0 h-full w-px bg-white/12"></div>
            <div className="pointer-events-none absolute bottom-[14%] left-0 h-px w-full bg-white/12"></div>
            <div className="pointer-events-none absolute right-[12%] top-0 h-full w-px bg-white/10"></div>
            <div className="pointer-events-none absolute -bottom-10 left-8 text-[7rem] font-black leading-none tracking-[-0.08em] text-white/[0.035] md:text-[12rem]">
              JOIN US
            </div>
            <div className="pointer-events-none absolute right-10 top-28 h-28 w-28 border-r-2 border-t-2 border-[#c8322a]/35"></div>

            <div className="relative mx-auto grid h-full max-w-[1600px] gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
              <div className="max-w-4xl pl-3 md:pl-7">
                <p className="text-xs font-black tracking-[0.45em] text-[#c8322a]">JOIN / 05</p>
                <h2 className="mt-4 text-5xl font-black leading-[0.92] tracking-[-0.05em] text-white md:text-7xl xl:text-8xl">
                  加入檐枫以后，
                  <span className="block text-[#c8322a]">你可以怎样度过大学生活？</span>
                </h2>
                <p className="mt-7 max-w-3xl text-base font-black leading-loose text-white/78 md:text-lg xl:text-xl">
                  先从 QQ 大群认识大家，再去感兴趣的小组试试看。你可以参加官方组的组活，也可以加入自由生长的兴趣组；可以上台、创作、应援、唱歌、组乐队，也可以只是看看群聊、参加几次活动、认识一些朋友。
                </p>
                <div className="mt-8 flex max-w-3xl flex-wrap gap-2">
                  {['零基础 OK', '不收社费', '自由参加', '可以加入多个组', '随时加入'].map((tag) => (
                    <span key={tag} className="border border-white/22 bg-black/45 px-3 py-2 text-xs font-black tracking-[0.08em] text-white/82">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="relative overflow-hidden border border-white/12 bg-[#0c0c0c] shadow-[10px_10px_0_rgb(0_0_0/0.28)]">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.035)_1px,transparent_1px)] opacity-35 [background-size:96px_96px]"></div>
                <div className="pointer-events-none absolute left-0 top-0 h-full w-1.5 bg-[#c8322a]"></div>
                <div className="pointer-events-none absolute -bottom-10 -right-4 text-[8rem] font-black leading-none tracking-[-0.08em] text-white/[0.035] md:text-[12rem]">
                  JOIN
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between border-b border-white/12 px-5 py-4 md:px-7">
                    <div>
                      <p className="text-[10px] font-black tracking-[0.34em] text-[#c8322a]">ENTRY GUIDE</p>
                      <h3 className="mt-1 text-2xl font-black text-white md:text-3xl">从这里开始</h3>
                    </div>
                    <UserPlus className="h-8 w-8 text-[#c8322a]" strokeWidth={2.5} />
                  </div>

                  <div className="grid gap-px bg-white/10">
                    <article className="bg-[#121212] p-5 md:p-7">
                      <div className="flex items-start gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#c8322a] text-lg font-black text-white">01</span>
                        <div>
                          <p className="text-xs font-black tracking-[0.28em] text-[#c8322a]">QQ GROUP</p>
                          <h4 className="mt-2 text-4xl font-black tracking-[-0.04em] text-white">加入我们</h4>
                          <p className="mt-3 text-sm font-bold leading-relaxed text-white/62">
                            加 QQ 群即可进入檐枫。群号更新后会在这里放出，也可以先通过公众号或 B 站找到我们。
                          </p>
                        </div>
                      </div>
                      <div className="mt-5 grid gap-px bg-white/14 sm:grid-cols-[1fr_auto]">
                        <div className="bg-black/42 px-4 py-4">
                          <p className="text-[10px] font-black tracking-[0.26em] text-[#c8322a]">MAIN GROUP</p>
                          <p className="mt-1 font-mono text-3xl font-black text-white">737508445</p>
                        </div>
                        <button
                          type="button"
                          className="flex min-h-[76px] items-center justify-center gap-2 bg-[#c8322a] px-6 text-sm font-black tracking-[0.12em] text-white transition hover:bg-white hover:text-[#c8322a]"
                        >
                          <Send className="h-4 w-4" strokeWidth={2.8} />
                          加入我们
                        </button>
                      </div>
                    </article>

                    <article className="bg-[#121212] p-5 md:p-7">
                      <p className="text-xs font-black tracking-[0.28em] text-[#c8322a]">SOCIAL CHANNELS / 02</p>
                      <div className="mt-4 grid gap-px bg-white/14 sm:grid-cols-2">
                        {[
                          ['公众号', '涧桐现视研', '推文与活动回顾'],
                          ['Bilibili', '檐枫动漫社', '录像和投稿']
                        ].map(([title, value, note]) => (
                          <div key={title} className="bg-black/42 p-4">
                            <p className="text-[10px] font-black tracking-[0.24em] text-[#c8322a]">{title}</p>
                            <p className="mt-2 text-2xl font-black text-white">{value}</p>
                            <p className="mt-2 text-xs font-bold leading-relaxed text-white/52">{note}</p>
                          </div>
                        ))}
                      </div>
                    </article>
                  </div>
                </div>

              </div>

              <div className="pointer-events-none absolute bottom-2 right-0 z-20 hidden items-center gap-3 border border-white/16 bg-[#0f0f0f]/92 px-4 py-3 shadow-[6px_6px_0_rgb(0_0_0/0.35)] md:flex">
                <img src="/image/向日葵.jpg" alt="向日葵" className="h-14 w-14 border border-white/18 object-cover" />
                <span>
                  <span className="block text-[10px] font-black tracking-[0.22em] text-[#c8322a]">SITE BUILDER</span>
                  <span className="mt-1 block text-lg font-black tracking-[0.08em] text-white">向日葵</span>
                </span>
              </div>
            </div>
          </section>

          <ScrollGuide currentIndex={activeScreenIndex} total={SCREEN_IDS.length} />
        </div>
      </main>
      )}
      <audio
        ref={radioAudioRef}
        src="/music/bgm.mp3"
        preload="auto"
        loop
      />
    </div>
  );
};

export default App;
