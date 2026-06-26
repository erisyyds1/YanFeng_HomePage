import React, { useEffect, useState } from 'react';
import {
  Archive,
  BookOpen,
  CalendarDays,
  Clapperboard,
  Film,
  Gamepad2,
  Hash,
  HeartHandshake,
  Home,
  Info,
  Megaphone,
  MessageCircle,
  Mic2,
  Music2,
  Newspaper,
  NotebookPen,
  PenTool,
  Radio,
  Send,
  Sparkles,
  Star,
  Theater,
  Ticket,
  Trophy,
  UserPlus,
  Users,
  Video,
  Wand2
} from 'lucide-react';
import { AppTheme, NewsItem } from './types';
import { TIMELINE_DATA, WECHAT_ARTICLES } from './constants';

import ChatAssistant from './components/ChatAssistant';
import EventGallery from './components/EventGallery';
import RetroCard from './components/RetroCard';
import Timeline from './components/Timeline';
import { fetchWeChatArticles } from './services/wechatService';
import logo from './assets/logo.svg';

type AnchorId = 'home' | 'about' | 'groups' | 'activities' | 'videos' | 'rhythm' | 'join';

interface OfficialGroup {
  title: string;
  description: string;
  newcomerNote: string;
  activities: string[];
  icon: React.ElementType;
  accent: string;
  qq: string;
}

interface ActivityItem {
  title: string;
  time: string;
  description: string;
  highlights: string[];
  icon: React.ElementType;
}

interface JoinFact {
  title: string;
  text: string;
  icon: React.ElementType;
}

const NAV_ITEMS: { label: string; target: AnchorId; icon: React.ElementType }[] = [
  { label: '首页', target: 'home', icon: Home },
  { label: '社团介绍', target: 'about', icon: Info },
  { label: '分组介绍', target: 'groups', icon: Users },
  { label: '活动回顾', target: 'activities', icon: CalendarDays },
  { label: '活动录像', target: 'videos', icon: Video },
  { label: '加入我们', target: 'join', icon: UserPlus }
];

const HERO_IMAGE = '/image/yanfeng-hero.jpg';

const OFFICIAL_GROUPS: OfficialGroup[] = [
  {
    title: '事务组',
    description: '负责社团事务、活动组织支持和现场执行，让每一次晚会、摊位和组活顺利发生。',
    newcomerNote: '适合愿意做组织、协调、搬运设备、现场支援和活动执行的同学。',
    activities: ['活动筹备', '现场执行', '设备物料', '社团支持'],
    icon: Megaphone,
    accent: 'Support',
    qq: '1054869730'
  },
  {
    title: '宅舞组',
    description: '一起约舞、练舞、教学、排练节目，也会录制宅舞视频和准备晚会舞台。',
    newcomerNote: '零基础可以来学，每学期会有社舞教学和群舞教学。',
    activities: ['日常约舞', '社舞教学', '群舞教学', '晚会节目'],
    icon: Music2,
    accent: 'Dance',
    qq: '1018528156'
  },
  {
    title: '创作组',
    description: '围绕绘画、手书、视频剪辑、音乐制作、文字和视觉创作，为活动留下可看的记录。',
    newcomerNote: '会画画很好，不会也可以从想法、排版、协作和学习开始。',
    activities: ['绘画创作', '视频剪辑', '手书作品', '看板娘创作'],
    icon: PenTool,
    accent: 'Create',
    qq: '496866658'
  },
  {
    title: '翻唱组',
    description: '进行翻唱相关活动，开学后有新生歌会，日常也会有不定期 KTV 聚会。',
    newcomerNote: '喜欢唱歌、听歌、录音或想在晚会上唱一首 ACG 歌都可以来。',
    activities: ['新生歌会', 'KTV 聚会', '翻唱交流', '晚会节目'],
    icon: Mic2,
    accent: 'Cover',
    qq: '745254525'
  },
  {
    title: '舞台剧组',
    description: '进行舞台剧创作和演出，把故事、角色、台词和舞台调度一起做出来。',
    newcomerNote: '喜欢演戏、写剧本、做道具、上台或幕后协作都能找到位置。',
    activities: ['剧本创作', '舞台排练', '角色演出', '幻电战争系列'],
    icon: Theater,
    accent: 'Stage',
    qq: '912127654'
  },
  {
    title: 'Delta 组',
    description: '提供创作与分享的平台，也协助事务组进行社团活动预热与宣传。',
    newcomerNote: '适合喜欢写文、杂谈、采访、安利作品和用文字表达的人。',
    activities: ['文字创作', '作品安利', '记者采访', '推文放送'],
    icon: NotebookPen,
    accent: 'Words',
    qq: '290772952'
  },
  {
    title: '番剧鉴赏组',
    description: '日常水群讨论喜欢的动画，也负责 GMA 年终动画评选活动。',
    newcomerNote: '不需要阅片量很大，只要愿意聊天、安利、剪辑或参与评选都可以。',
    activities: ['番剧讨论', 'GMA 筹备', '视频剪辑', '直播颁奖'],
    icon: Film,
    accent: 'Anime',
    qq: '924171013'
  },
  {
    title: 'Wota 艺组',
    description: '用应援棒描绘光与影，进行 Wota 艺练习、教学、表演和企划视频录制。',
    newcomerNote: '新人不需要基础，可以从每周三、周六晚上的教学和组活练习开始。',
    activities: ['每周组活', 'Wota 教学', '晚会表演', '企划视频'],
    icon: Clapperboard,
    accent: 'Wota',
    qq: '876209001'
  },
  {
    title: '轻音组',
    description: '面向乐器、乐队和 ACG 音乐爱好者，交流资源、技术讨论，也能合作组队。',
    newcomerNote: '会乐器、想组乐队、想唱歌或只是想认识乐队同好都欢迎。',
    activities: ['组乐队', '专场 live', '歌曲分享', '晚会演出'],
    icon: Radio,
    accent: 'Band',
    qq: '914316313'
  },
  {
    title: 'VOCALOID 组',
    description: '以泛 VOCALOID 创作为中心，也交流 Synthesizer V、CeVIO、UTAU 和更广泛的日系音乐。',
    newcomerNote: '喜欢术力口、歌姬调声、音乐创作或只是想找同好都可以来。',
    activities: ['作品翻调', '原创曲目', '调校教学', '术力口交流'],
    icon: Wand2,
    accent: 'Vocaloid',
    qq: '361980809'
  }
];

const INTEREST_GROUPS = ['明日方舟组', '东方组', '术力口组', 'Cos 组', '配音组', '摄影剪辑组', '文艺部', '更多自由方向'];

const ACTIVITIES: ActivityItem[] = [
  {
    title: '百团大战 / 迎新',
    time: '开学约一个月后',
    description: '新生接触檐枫的重要入口。会有摊位、节目表演、社团介绍、抽奖和现场交流。',
    highlights: ['摊位介绍', '节目表演', '抽奖互动'],
    icon: Megaphone
  },
  {
    title: '冬日庆典',
    time: '12 月左右',
    description: '第一学期末的大型晚会，乐队、宅舞、翻唱、舞台剧、手书、Wota 艺都会在这里出现。',
    highlights: ['大型晚会', '多组节目', '社团代表活动'],
    icon: Star
  },
  {
    title: '社庆',
    time: '5 月左右',
    description: '第二学期末的大型晚会，是节目展示，也是社团回忆和归属感聚在一起的时候。',
    highlights: ['周年纪念', '舞台节目', '社团回忆'],
    icon: HeartHandshake
  },
  {
    title: 'GMA',
    time: '年终动画评选',
    description: '由番剧鉴赏组负责的动画评选活动，包含剪辑、奖项设计、活动筹备和直播颁奖。',
    highlights: ['动画评选', '视频剪辑', '直播颁奖'],
    icon: Trophy
  },
  {
    title: '日常活动',
    time: '平时不定期',
    description: '放映会、各组组活、练舞、Wota 教学、合宿、联合观影、轻音专场和高校联动。',
    highlights: ['轻松日常', '自由参加', '认识朋友'],
    icon: Gamepad2
  }
];

const JOIN_FACTS: JoinFact[] = [
  { title: '没有门槛', text: '不需要会画画、会跳舞、很懂动漫或二次元浓度很高。', icon: Sparkles },
  { title: '自由参加', text: '不强制参加活动，也不强制只选一个组，可以同时参与多个方向。', icon: Ticket },
  { title: '不收社费', text: '加入方式很简单，加 QQ 群即可，随时欢迎。', icon: Send }
];

const App: React.FC = () => {
  const [wechatNews, setWechatNews] = useState<NewsItem[]>(WECHAT_ARTICLES);
  const [activeTab, setActiveTab] = useState<'home' | 'events'>('home');

  useEffect(() => {
    document.body.setAttribute('data-theme', AppTheme.DEFAULT);
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

  const scrollToSection = (target: AnchorId) => {
    window.setTimeout(() => {
      document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const showHomeSection = (target: AnchorId = 'home') => {
    setActiveTab('home');
    scrollToSection(target);
  };

  const showVideos = () => {
    setActiveTab('events');
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  };

  const latestNews = wechatNews.slice(0, 3);

  return (
    <div className="min-h-screen font-sans pb-20 relative overflow-x-hidden">
      <div className="fixed left-0 top-0 w-4 md:w-8 h-full checker-bg z-0 border-r-4 border-[var(--theme-border)] hidden md:block"></div>
      <div className="fixed right-0 top-0 w-4 md:w-8 h-full checker-bg z-0 border-l-4 border-[var(--theme-border)] hidden md:block"></div>

      <div className="relative z-10 w-full max-w-[1500px] mx-auto px-4 md:px-12 py-6 md:py-8">
        <header className="mb-8 md:mb-12">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <button
              type="button"
              onClick={() => showHomeSection('home')}
              className="group cursor-pointer flex items-center gap-5 xl:gap-8 transform -rotate-2 hover:rotate-0 transition-transform duration-300 origin-left text-left"
            >
              <div className="relative w-20 h-20 md:w-24 md:h-24 xl:w-32 xl:h-32 flex-shrink-0">
                <div className="absolute inset-0 bg-[var(--theme-primary)] rounded-full border-[3px] border-[var(--theme-border)] shadow-[4px_4px_0px_var(--theme-border)] flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 border-2 border-dashed border-white/50 rounded-full m-1"></div>
                  <div
                    className="w-16 h-16 md:w-20 md:h-20 xl:w-28 xl:h-28 bg-[var(--theme-secondary)]"
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
                </div>
                <div className="absolute -top-2 -right-2 text-[var(--theme-primary)] bg-[var(--theme-secondary)] rounded-full p-1 border-2 border-[var(--theme-border)]">
                  <Star className="w-3 h-3 xl:w-5 xl:h-5" fill="currentColor" />
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-[var(--theme-accent)] text-[var(--theme-secondary)] text-[10px] xl:text-xs font-bold px-2 py-0.5 xl:px-3 xl:py-1 rounded border-2 border-[var(--theme-border)] whitespace-nowrap shadow-sm z-10">
                  EST. 2004
                </div>
              </div>

              <div className="flex flex-col items-start gap-1">
                <span className="bg-[var(--theme-border)] text-[var(--theme-secondary)] text-[10px] md:text-xs xl:text-sm font-black px-2 py-1 rounded-sm transform -skew-x-12 uppercase tracking-tighter">
                  YANFENG ACGN FAN CLUB
                </span>
                <h1
                  className="text-5xl md:text-6xl xl:text-7xl font-retro text-[var(--theme-primary)] leading-[0.85] tracking-wide"
                  style={{
                    textShadow: '2px 2px 0px var(--theme-secondary), 4px 4px 0px var(--theme-border)',
                    WebkitTextStroke: '1.5px var(--theme-border)'
                  }}
                >
                  檐枫
                </h1>
                <p className="text-[var(--theme-primary)] font-bold text-xs md:text-sm xl:text-lg tracking-[0.3em]">
                  大好きだよ、みんな！
                </p>
              </div>
            </button>

            <nav className="bg-[var(--theme-secondary)] border-4 border-[var(--theme-border)] rounded-lg shadow-[4px_4px_0px_var(--theme-border)] p-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isVideos = item.target === 'videos';
                  const active = isVideos ? activeTab === 'events' : activeTab === 'home' && item.target === 'home';

                  return (
                    <button
                      key={item.target}
                      type="button"
                      onClick={() => (isVideos ? showVideos() : showHomeSection(item.target))}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded border-2 text-xs font-black transition-all ${
                        active
                          ? 'bg-[var(--theme-primary)] border-[var(--theme-border)] text-white shadow-[2px_2px_0px_var(--theme-border)]'
                          : 'bg-white border-[var(--theme-border)] text-[var(--theme-border)] hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_var(--theme-border)]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
        </header>

        <main>
          {activeTab === 'home' ? (
            <div className="space-y-14 md:space-y-20">
              <section
                id="home"
                className="relative w-full max-w-full bg-[var(--theme-secondary)] border-4 border-[var(--theme-border)] rounded-lg shadow-[8px_8px_0px_var(--theme-border)] overflow-hidden scroll-mt-8"
              >
                <div className="absolute inset-2 border-2 border-dashed border-[var(--theme-primary)] pointer-events-none rounded"></div>
                <div className="grid lg:grid-cols-[1.05fr_0.95fr] min-h-[540px]">
                  <div className="relative p-6 sm:p-8 lg:p-12 flex flex-col justify-center">
                    <div className="inline-flex w-fit items-center gap-2 border-2 border-[var(--theme-border)] bg-white px-3 py-1 rounded shadow-[3px_3px_0px_var(--theme-border)] -rotate-1 mb-6">
                      <HeartHandshake className="w-4 h-4 text-[var(--theme-primary)]" />
                      <span className="text-xs font-black tracking-[0.2em] uppercase text-[var(--theme-border)]">新人友好 / 没有门槛</span>
                    </div>

                    <p className="font-bold text-[var(--theme-primary)] text-lg md:text-2xl mb-3">北京邮电大学 ACG 爱好者的聚集地</p>
                    <h2
                      className="font-retro text-[3.35rem] sm:text-[5.5rem] md:text-[7rem] lg:text-[7rem] leading-none text-[var(--theme-primary)] tracking-wide max-w-full"
                      style={{
                        textShadow: '3px 3px 0px var(--theme-secondary), 6px 6px 0px var(--theme-border)',
                        WebkitTextStroke: '2px var(--theme-border)',
                        overflowWrap: 'anywhere'
                      }}
                    >
                      檐枫动漫社
                    </h2>
                    <figure className="lg:hidden mt-6 border-4 border-[var(--theme-border)] rounded-lg overflow-hidden bg-[var(--theme-border)] shadow-[5px_5px_0px_var(--theme-border)]">
                      <img
                        src={HERO_IMAGE}
                        alt="檐枫娘主视觉"
                        loading="eager"
                        decoding="async"
                        className="h-48 w-full object-cover"
                        style={{ objectPosition: '68% 42%' }}
                      />
                      <figcaption className="bg-[var(--theme-primary)] text-white border-t-4 border-[var(--theme-border)] px-4 py-3">
                        <p className="font-retro text-3xl leading-none">大好きだよ、みんな！</p>
                        <p className="mt-1 text-xs font-bold">一起来和檐枫娘玩儿。</p>
                      </figcaption>
                    </figure>
                    <p className="mt-6 max-w-3xl text-lg md:text-2xl leading-relaxed font-black text-[var(--theme-border)] break-all sm:break-words">
                      想看番、跳宅舞、打 Wota 艺、画画写文、唱歌组乐队、演舞台剧，或者只是想认识同好，都可以来。
                    </p>
                    <p className="mt-4 max-w-2xl text-base md:text-lg leading-relaxed text-[var(--theme-accent)] break-all sm:break-words">
                      檐枫是一个活动很多、氛围自由、像大家庭一样的 ACG 综合社团。不会也没关系，重点是玩得开心、认识朋友、丰富大学生活。
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row gap-4">
                      <button
                        type="button"
                        onClick={() => showHomeSection('groups')}
                        className="inline-flex items-center justify-center gap-2 bg-[var(--theme-primary)] text-white px-6 py-3 rounded border-4 border-[var(--theme-border)] shadow-[4px_4px_0px_var(--theme-border)] font-black hover:translate-y-1 hover:shadow-[2px_2px_0px_var(--theme-border)] transition-all"
                      >
                        <BookOpen className="w-5 h-5" />
                        看看有哪些组
                      </button>
                      <button
                        type="button"
                        onClick={() => showHomeSection('join')}
                        className="inline-flex items-center justify-center gap-2 bg-white text-[var(--theme-border)] px-6 py-3 rounded border-4 border-[var(--theme-border)] shadow-[4px_4px_0px_var(--theme-border)] font-black hover:translate-y-1 hover:shadow-[2px_2px_0px_var(--theme-border)] transition-all"
                      >
                        <Send className="w-5 h-5 text-[var(--theme-primary)]" />
                        加入 QQ 群
                      </button>
                    </div>
                  </div>

                  <div className="relative hidden lg:flex border-t-4 lg:border-t-0 lg:border-l-4 border-[var(--theme-border)] bg-white/70 p-5 sm:p-8 items-center">
                    <div className="absolute inset-0 opacity-[0.08] checker-bg"></div>
                    <div className="relative w-full">
                      <figure className="relative border-4 border-[var(--theme-border)] rounded-lg overflow-hidden bg-[var(--theme-border)] shadow-[8px_8px_0px_var(--theme-border)]">
                        <img
                          src={HERO_IMAGE}
                          alt="檐枫娘主视觉"
                          loading="eager"
                          decoding="async"
                          className="h-[300px] sm:h-[420px] lg:h-[560px] w-full object-cover opacity-95"
                          style={{ objectPosition: '68% 42%' }}
                        />
                        <figcaption className="absolute left-4 right-4 bottom-4 text-white bg-black/45 border-2 border-white/25 rounded p-3">
                          <p className="inline-flex items-center gap-2 bg-white text-[var(--theme-border)] border-2 border-[var(--theme-border)] rounded px-3 py-1 text-xs font-black shadow-[3px_3px_0px_var(--theme-border)] -rotate-1">
                            <Sparkles className="w-4 h-4 text-[var(--theme-primary)]" />
                            看板娘 / 檐枫娘
                          </p>
                          <h3 className="mt-3 font-retro text-4xl sm:text-5xl leading-none drop-shadow-[3px_3px_0px_var(--theme-border)]">
                            大好きだよ、みんな！
                          </h3>
                          <p className="mt-2 max-w-md text-sm sm:text-base font-bold leading-relaxed">
                            一起来和檐枫娘玩儿。不用担心不会，大家一起学就好。
                          </p>
                        </figcaption>
                      </figure>

                      <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                          ['正式社团', '校团委管理'],
                          ['成立时间', '2004 年'],
                          ['QQ 大群', '接近 1000 人'],
                          ['加入方式', '加群即可']
                        ].map(([label, value]) => (
                          <div key={label} className="bg-[var(--theme-secondary)] border-4 border-[var(--theme-border)] rounded-lg p-3 shadow-[3px_3px_0px_var(--theme-border)]">
                            <p className="text-[10px] font-black text-[var(--theme-primary)] tracking-[0.18em] uppercase">{label}</p>
                            <p className="mt-1 font-bold text-sm text-[var(--theme-border)] leading-snug">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section id="about" className="scroll-mt-8">
                <div className="grid lg:grid-cols-[0.88fr_1.12fr] gap-8 items-stretch">
                  <div className="bg-[var(--theme-primary)] text-white border-4 border-[var(--theme-border)] rounded-lg p-6 md:p-8 shadow-[6px_6px_0px_var(--theme-border)] relative overflow-hidden">
                    <div className="absolute -right-8 top-6 hidden md:block text-8xl font-black text-black/10 select-none">WELCOME</div>
                    <p className="font-mono text-xs uppercase tracking-[0.3em] opacity-80">About Yanfeng</p>
                    <h2 className="font-retro text-5xl md:text-6xl mt-3">檐枫是什么</h2>
                    <p className="mt-6 text-lg leading-relaxed">
                      北京邮电大学檐枫动漫社是隶属于校团委管理、正式登记在册的 ACG 综合兴趣类社团。它不是只给“很会的人”准备的社团：你可以只喜欢看番，可以只想认识朋友，也可以想上台、创作、组乐队、做活动。
                    </p>
                    <p className="mt-4 text-base leading-relaxed opacity-95">
                      社团里有正式官方组，也有自由的兴趣组。只要加入檐枫社群，你就已经是檐枫的一份子；可以参加大型晚会，也可以只参加轻松的日常活动。
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-5">
                    {JOIN_FACTS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <RetroCard key={item.title} variant="ticket" className="h-full">
                          <div className="flex h-full flex-col gap-4">
                            <div className="w-12 h-12 rounded border-4 border-[var(--theme-border)] bg-[var(--theme-primary)] text-white flex items-center justify-center shadow-[3px_3px_0px_var(--theme-border)]">
                              <Icon className="w-6 h-6" />
                            </div>
                            <h3 className="font-retro text-3xl text-[var(--theme-primary)]">{item.title}</h3>
                            <p className="text-sm leading-relaxed text-[var(--theme-accent)] font-bold">{item.text}</p>
                          </div>
                        </RetroCard>
                      );
                    })}
                  </div>
                </div>
              </section>

              <section id="groups" className="scroll-mt-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b-4 border-dashed border-[var(--theme-border)] pb-4">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--theme-primary)] font-black">Official Groups</p>
                    <h2 className="font-retro text-5xl text-[var(--theme-border)] mt-2">十个官方组</h2>
                  </div>
                  <p className="max-w-2xl text-[var(--theme-accent)] font-bold leading-relaxed">
                    官方组是檐枫的正式组织结构，每个组都有自己的日常活动或组活，也会为每学期的大型晚会贡献节目和内容。
                  </p>
                </div>

                <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-5">
                  {OFFICIAL_GROUPS.map((group, index) => {
                    const Icon = group.icon;
                    return (
                      <RetroCard key={group.title} variant="ticket" className={`h-full ${index % 2 === 0 ? 'xl:-rotate-1' : 'xl:rotate-1'}`}>
                        <div className="h-full flex flex-col">
                          <div className="flex items-start justify-between gap-3">
                            <div className="w-12 h-12 rounded border-4 border-[var(--theme-border)] bg-[var(--theme-primary)] text-white flex items-center justify-center shadow-[3px_3px_0px_var(--theme-border)] shrink-0">
                              <Icon className="w-6 h-6" />
                            </div>
                            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--theme-primary)] font-black border-2 border-[var(--theme-border)] bg-white px-2 py-1 rounded">
                              {group.accent}
                            </span>
                          </div>
                          <h3 className="mt-5 font-retro text-3xl text-[var(--theme-primary)] leading-none">{group.title}</h3>
                          <div className="mt-3 inline-flex w-fit items-center gap-2 bg-white border-2 border-[var(--theme-border)] rounded px-2 py-1 shadow-[2px_2px_0px_var(--theme-border)]">
                            <MessageCircle className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
                            <span className="font-mono text-xs font-black text-[var(--theme-border)]">QQ群 {group.qq}</span>
                          </div>
                          <p className="mt-4 text-sm leading-relaxed text-[var(--theme-border)] font-bold">{group.description}</p>
                          <div className="mt-5 pt-4 border-t-2 border-dashed border-[var(--theme-primary)]">
                            <p className="text-xs font-black text-[var(--theme-primary)] mb-2">新人可以这样开始</p>
                            <p className="text-xs leading-relaxed text-[var(--theme-accent)]">{group.newcomerNote}</p>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {group.activities.map((activity) => (
                              <span key={activity} className="bg-white border-2 border-[var(--theme-border)] rounded px-2 py-1 text-[11px] font-bold text-[var(--theme-border)]">
                                {activity}
                              </span>
                            ))}
                          </div>
                        </div>
                      </RetroCard>
                    );
                  })}
                </div>

                <div className="mt-8 bg-[var(--theme-secondary)] border-4 border-[var(--theme-border)] rounded-lg p-5 shadow-[5px_5px_0px_var(--theme-border)]">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--theme-primary)] font-black">Interest Corners</p>
                      <h3 className="font-retro text-4xl text-[var(--theme-border)] mt-2">自由兴趣小组</h3>
                      <p className="mt-3 text-sm md:text-base text-[var(--theme-accent)] font-bold leading-relaxed">
                        除了官方组，檐枫也有更自由的兴趣方向。兴趣组不是硬性组织，更像大家自然聚起来一起玩的入口。
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {INTEREST_GROUPS.map((group) => (
                        <span key={group} className="bg-white border-4 border-[var(--theme-border)] rounded px-4 py-2 font-black text-[var(--theme-border)] shadow-[3px_3px_0px_var(--theme-border)]">
                          {group}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section id="activities" className="scroll-mt-8">
                <div className="bg-[var(--theme-secondary)] border-4 border-[var(--theme-border)] rounded-lg p-5 md:p-8 shadow-[6px_6px_0px_var(--theme-border)]">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--theme-primary)] font-black">Events</p>
                      <h2 className="font-retro text-5xl text-[var(--theme-border)] mt-2">檐枫平时做什么</h2>
                    </div>
                    <div className="border-2 border-[var(--theme-border)] bg-white px-4 py-2 rounded shadow-[3px_3px_0px_var(--theme-border)] -rotate-1">
                      <p className="font-black text-[var(--theme-primary)]">大型晚会 + 轻松日常</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-5">
                    {ACTIVITIES.map((activity) => {
                      const Icon = activity.icon;
                      return (
                        <article key={activity.title} className="bg-white border-4 border-[var(--theme-border)] rounded-lg p-4 shadow-[4px_4px_0px_var(--theme-border)] flex flex-col min-h-[300px]">
                          <div className="flex items-center justify-between gap-3">
                            <Icon className="w-8 h-8 text-[var(--theme-primary)]" />
                            <span className="font-mono text-[11px] font-black text-[var(--theme-accent)] border-2 border-dashed border-[var(--theme-primary)] px-2 py-1 rounded">
                              {activity.time}
                            </span>
                          </div>
                          <h3 className="mt-5 font-retro text-3xl text-[var(--theme-primary)] leading-none">{activity.title}</h3>
                          <p className="mt-4 text-sm leading-relaxed text-[var(--theme-border)] font-bold flex-1">{activity.description}</p>
                          <div className="mt-4 pt-4 border-t-2 border-dashed border-[var(--theme-primary)] flex flex-wrap gap-2">
                            {activity.highlights.map((tag) => (
                              <span key={tag} className="text-[11px] bg-[var(--theme-secondary)] border-2 border-[var(--theme-border)] rounded px-2 py-1 font-bold">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </section>

              <section id="videos" className="scroll-mt-8">
                <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-8">
                  <div className="bg-[var(--theme-border)] text-[var(--theme-secondary)] border-4 border-[var(--theme-border)] rounded-lg p-6 md:p-8 shadow-[6px_6px_0px_rgba(0,0,0,0.25)] relative overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-8 bg-[var(--theme-primary)] border-b-4 border-[var(--theme-border)] flex items-center gap-2 px-4">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                      <div className="w-3 h-3 bg-white rounded-full opacity-70"></div>
                      <div className="w-3 h-3 bg-white rounded-full opacity-40"></div>
                    </div>
                    <div className="pt-10">
                      <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--theme-primary)] font-black">Bilibili Archive</p>
                      <h2 className="font-retro text-5xl mt-3 text-white">活动录像</h2>
                      <p className="mt-5 leading-relaxed text-base opacity-90">
                        这里保留活动录像模块，用来展示宅舞、Wota 艺、社庆、冬日庆典、GMA、轻音 live 等 Bilibili 视频。第一版先保持轻量，后续可以继续补年份分类和管理入口。
                      </p>
                      <div className="mt-6 grid grid-cols-2 gap-3">
                        {['冬日庆典', '社庆', 'GMA', '组活 / 日常'].map((item) => (
                          <div key={item} className="border-2 border-dashed border-[var(--theme-primary)] rounded p-3 text-center font-black">
                            {item}
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={showVideos}
                        className="mt-7 inline-flex items-center justify-center gap-2 bg-[var(--theme-primary)] text-white px-6 py-3 rounded border-4 border-white shadow-[4px_4px_0px_rgba(255,255,255,0.25)] font-black hover:translate-y-1 transition-all"
                      >
                        <Video className="w-5 h-5" />
                        打开活动录像
                      </button>
                    </div>
                  </div>

                  <div className="bg-[var(--theme-secondary)] border-4 border-[var(--theme-border)] rounded-lg p-5 md:p-6 shadow-[6px_6px_0px_var(--theme-border)]">
                    <div className="flex items-center justify-between gap-4 pb-4 border-b-4 border-dashed border-[var(--theme-primary)]">
                      <div>
                        <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--theme-primary)] font-black">Official Account</p>
                        <h3 className="font-retro text-4xl text-[var(--theme-border)] mt-1">公众号近况</h3>
                      </div>
                      <Newspaper className="w-10 h-10 text-[var(--theme-primary)]" />
                    </div>
                    <div className="mt-5 grid gap-4">
                      {latestNews.map((item) => (
                        <a
                          key={item.id}
                          href={item.link || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group grid sm:grid-cols-[128px_1fr] gap-4 bg-white border-4 border-[var(--theme-border)] rounded-lg p-3 shadow-[3px_3px_0px_var(--theme-border)] hover:-translate-y-0.5 transition-all"
                        >
                          <div className="aspect-[4/3] sm:aspect-auto sm:h-24 bg-[var(--theme-secondary)] border-2 border-[var(--theme-border)] rounded overflow-hidden">
                            <img
                              src={item.coverUrl || '/default_cover.png'}
                              alt={item.title}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = '/default_cover.png';
                              }}
                              className="w-full h-full object-cover sepia-[.25] group-hover:sepia-0 transition-all"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-mono text-[var(--theme-accent)]">{item.date}</p>
                            <h4 className="mt-1 font-black text-[var(--theme-border)] leading-snug group-hover:text-[var(--theme-primary)] transition-colors">
                              {item.title}
                            </h4>
                            <p className="mt-2 text-sm text-[var(--theme-accent)] leading-relaxed line-clamp-2">{item.summary}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section id="rhythm" className="scroll-mt-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 border-b-4 border-dashed border-[var(--theme-border)] pb-4">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--theme-primary)] font-black">Year Rhythm</p>
                    <h2 className="font-retro text-5xl text-[var(--theme-border)] mt-2">一年里的檐枫</h2>
                  </div>
                  <p className="max-w-2xl text-[var(--theme-accent)] font-bold leading-relaxed">
                    时间线不再放在首屏，只作为补充：让新生大概知道什么时候能遇到百团、冬日庆典、GMA 和社庆。
                  </p>
                </div>

                <div className="bg-[var(--theme-secondary)] border-4 border-[var(--theme-border)] rounded-lg shadow-[6px_6px_0px_var(--theme-border)]">
                  <Timeline events={TIMELINE_DATA} />
                </div>
              </section>

              <section id="join" className="scroll-mt-8">
                <div className="relative bg-[var(--theme-primary)] text-white border-4 border-[var(--theme-border)] rounded-lg overflow-hidden shadow-[8px_8px_0px_var(--theme-border)]">
                  <div className="absolute inset-2 border-2 border-dashed border-white/40 rounded pointer-events-none"></div>
                  <div className="grid lg:grid-cols-[0.82fr_1.18fr] gap-6 p-6 md:p-10">
                    <div className="relative z-10">
                      <p className="font-mono text-xs uppercase tracking-[0.3em] opacity-80">Join Us</p>
                      <h2 className="font-retro text-6xl md:text-7xl mt-3">加入檐枫</h2>
                      <p className="mt-6 text-lg leading-relaxed max-w-xl">
                        加 QQ 群即可。没有社费，不限制加入时间，不强制参加活动，也不用担心“自己不够会”。你可以先潜水看看，也可以直接找感兴趣的组玩。
                      </p>
                      <div className="mt-7 flex flex-wrap gap-3">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 bg-white text-[var(--theme-border)] px-5 py-3 rounded border-4 border-[var(--theme-border)] shadow-[4px_4px_0px_rgba(0,0,0,0.25)] font-black"
                        >
                          <UserPlus className="w-5 h-5 text-[var(--theme-primary)]" />
                          QQ 群二维码待补充
                        </button>
                      </div>
                    </div>

                    <div className="relative z-10 grid md:grid-cols-3 gap-4">
                      {[
                        { title: 'QQ群', value: '待补充', note: '主要加入入口，适合新生咨询和日常交流。', icon: Users },
                        { title: '公众号', value: '涧桐现视研', note: '推文、访谈、活动回顾和正式通知入口。', icon: Newspaper },
                        { title: 'Bilibili', value: '檐枫动漫社', note: '活动录像、舞台节目和社团投稿会放在这里。', icon: Video }
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.title} className="bg-[var(--theme-secondary)] text-[var(--theme-border)] border-4 border-[var(--theme-border)] rounded-lg p-5 shadow-[4px_4px_0px_rgba(0,0,0,0.25)]">
                            <Icon className="w-8 h-8 text-[var(--theme-primary)]" />
                            <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-[var(--theme-primary)]">{item.title}</p>
                            <h3 className="mt-2 font-retro text-3xl leading-none">{item.value}</h3>
                            <p className="mt-3 text-sm leading-relaxed text-[var(--theme-accent)]">{item.note}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <section id="videos" className="scroll-mt-8">
              <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-4 border-dashed border-[var(--theme-border)] pb-5">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--theme-primary)] font-black">Videos</p>
                  <h2 className="font-retro text-5xl text-[var(--theme-border)] mt-2">活动录像</h2>
                </div>
                <button
                  type="button"
                  onClick={() => showHomeSection('home')}
                  className="inline-flex items-center justify-center gap-2 bg-white text-[var(--theme-border)] px-5 py-3 rounded border-4 border-[var(--theme-border)] shadow-[4px_4px_0px_var(--theme-border)] font-black hover:translate-y-1 hover:shadow-[2px_2px_0px_var(--theme-border)] transition-all"
                >
                  <Home className="w-5 h-5 text-[var(--theme-primary)]" />
                  回到首页
                </button>
              </div>
              <EventGallery currentTheme={AppTheme.DEFAULT} />
            </section>
          )}
        </main>

        <footer className="mt-20 border-t-4 border-[var(--theme-border)] pt-8 pb-8 text-center text-[var(--theme-accent)] bg-white/50 backdrop-blur-sm">
          <div className="flex justify-center items-center gap-4 mb-4 opacity-50">
            <Hash size={16} />
            <div className="w-12 border-b-2 border-dashed border-[var(--theme-accent)] h-0"></div>
            <Star size={16} />
            <div className="w-12 border-b-2 border-dashed border-[var(--theme-accent)] h-0"></div>
            <Hash size={16} />
          </div>
          <p className="font-retro text-2xl tracking-widest text-[var(--theme-primary)] drop-shadow-[1px_1px_0px_var(--theme-border)]">大好きだよ、みんな！</p>
          <p className="text-xs mt-3 font-mono font-bold uppercase">© YANFENG ACGN FAN CLUB. All rights reserved.</p>
        </footer>

        <ChatAssistant />
      </div>
    </div>
  );
};

export default App;
