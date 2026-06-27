import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clapperboard,
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

import ChatAssistant from './components/ChatAssistant';
import EventGallery from './components/EventGallery';
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

const NAV_ITEMS: { label: string; target: AnchorId; icon: React.ElementType }[] = [
  { label: '首页', target: 'home', icon: Home },
  { label: '檐枫是什么', target: 'about', icon: ShieldCheck },
  { label: '小组', target: 'groups', icon: Users },
  { label: '活动', target: 'activities', icon: CalendarDays },
  { label: '录像', target: 'media', icon: Video },
  { label: '加入', target: 'join', icon: UserPlus }
];

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
    description: '面向所有热爱 ACG 相关歌曲、喜欢唱歌并愿意唱歌的同学。',
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
    description: '面向乐器、乐队和 ACG 音乐爱好者，用于交流、资源分享、技术讨论和合作组队。',
    newcomerNote: '乐器高手、练习新手，甚至只是想点歌听的纯路人都欢迎。',
    activities: ['琴技交流', '乐队组建', '专场 Live', 'ACG 音乐讨论'],
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
  }
];

const INTEREST_GROUPS = ['番剧鉴赏组', '明日方舟组', '东方组', '术力口组', 'Cos 组', '配音组', '摄影剪辑组', '文艺部', '更多自由方向'];

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
  const [activeTab, setActiveTab] = useState<'home' | 'events'>('home');
  const [selectedGroup, setSelectedGroup] = useState(0);

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

  const activeGroup = OFFICIAL_GROUPS[selectedGroup];
  const GroupIcon = activeGroup.icon;
  const latestNews = wechatNews.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#080808] text-[#f6f0dc] font-sans overflow-x-hidden selection:bg-[#c8322a] selection:text-white">
      <div className="fixed inset-0 pointer-events-none opacity-[0.08] checker-bg"></div>

      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/75 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 md:px-8">
          <button type="button" onClick={() => showHomeSection('home')} className="flex items-center gap-3 text-left">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/70 bg-[#c8322a] shadow-[3px_3px_0_#000]">
              <span
                className="h-8 w-8 bg-white"
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
              <span className="block text-lg font-black leading-none tracking-[0.18em] text-white">檐枫</span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.28em] text-white/50">YANFENG ACGN</span>
            </span>
          </button>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const handleClick = () => (item.target === 'media' ? showVideos() : showHomeSection(item.target));
              return (
                <button
                  key={item.target}
                  type="button"
                  onClick={handleClick}
                  className="group flex items-center gap-2 border border-white/10 px-4 py-2 text-xs font-black tracking-[0.16em] text-white/70 transition hover:border-[#c8322a] hover:bg-[#c8322a] hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => showHomeSection('join')}
            className="shrink-0 border border-[#c8322a] bg-[#c8322a] px-4 py-2 text-xs font-black tracking-[0.18em] text-white shadow-[4px_4px_0_#000] transition hover:-translate-y-0.5 md:px-5"
          >
            JOIN
          </button>
        </div>
        <nav className="flex gap-2 overflow-x-auto border-t border-white/10 px-4 py-2 lg:hidden">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const handleClick = () => (item.target === 'media' ? showVideos() : showHomeSection(item.target));
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

      {activeTab === 'home' ? (
        <main>
          <section id="home" className="relative min-h-screen overflow-hidden pt-28 lg:pt-20">
            <img src={HERO_IMAGE} alt="檐枫娘主视觉" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: '66% 42%' }} />
            <div className="absolute inset-0 bg-black/35"></div>
            <div className="absolute inset-y-0 left-0 w-full bg-[linear-gradient(90deg,#080808_0%,rgba(8,8,8,.86)_34%,rgba(8,8,8,.45)_58%,rgba(8,8,8,.08)_100%)]"></div>
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-[linear-gradient(0deg,#080808_0%,rgba(8,8,8,0)_100%)]"></div>

            <div className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1600px] content-center px-5 py-14 md:px-10 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="max-w-3xl">
                <div className="mb-8 flex flex-wrap items-center gap-3">
                  <span className="border border-[#c8322a] bg-[#c8322a] px-3 py-1 text-xs font-black tracking-[0.2em] text-white">BUPT / 2004</span>
                  <span className="border border-white/25 bg-black/40 px-3 py-1 text-xs font-bold tracking-[0.2em] text-white/80">大好きだよ、みんな！</span>
                </div>

                <p className="text-sm font-black tracking-[0.45em] text-[#c8322a] md:text-base">北京邮电大学 ACG 爱好者的聚集地</p>
                <h1 className="mt-4 text-[4.5rem] font-black leading-[0.86] tracking-[-0.06em] text-white md:text-[7rem] xl:text-[9rem]">
                  檐枫
                  <span className="block text-[#c8322a]">动漫社</span>
                </h1>
                <p className="mt-8 max-w-2xl text-xl font-black leading-relaxed text-white md:text-2xl">
                  无论是偶然喜欢看看番的宅宅，还是热爱acgn，对某个领域有更深的领悟无论是拉片儿剪mad，还是调教写V曲，或是画画做手书，或是翻唱打wota艺，亦或是组乐队出cover...或者只是想认识同好，都欢迎加入檐枫动漫社！
                </p>

                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => showHomeSection('groups')}
                    className="group flex items-center justify-center gap-3 bg-[#c8322a] px-7 py-4 text-sm font-black tracking-[0.18em] text-white shadow-[6px_6px_0_#000] transition hover:-translate-y-1"
                  >
                    小组情报
                    <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                  </button>
                  <button
                    type="button"
                    onClick={() => showHomeSection('join')}
                    className="flex items-center justify-center gap-3 border border-white/50 bg-black/55 px-7 py-4 text-sm font-black tracking-[0.18em] text-white shadow-[6px_6px_0_#000] transition hover:-translate-y-1 hover:border-white"
                  >
                    加入 QQ 群
                    <Send className="h-5 w-5 text-[#c8322a]" />
                  </button>
                </div>
              </div>

              <div className="mt-12 flex items-end justify-start lg:mt-0 lg:justify-end">
                <div className="w-full max-w-xl border-l-4 border-[#c8322a] bg-black/55 p-5 backdrop-blur-sm">
                  <div className="grid grid-cols-2 gap-px bg-white/20 text-sm">
                    {[
                      ['正式社团', '校团委管理'],
                      ['成立时间', '2004 年'],
                      ['社团气质', '自由 / 新人友好'],
                      ['加入方式', '加群即可']
                    ].map(([label, value]) => (
                      <div key={label} className="bg-[#111] p-4">
                        <p className="text-[10px] font-black tracking-[0.24em] text-[#c8322a]">{label}</p>
                        <p className="mt-2 text-lg font-black text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-5 text-sm font-bold leading-relaxed text-white/70">
                    这里首先是大家一起开心玩的地方。没有基础，浓度不高都没有关系，都可以来。
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section id="about" className="relative border-y border-white/10 bg-[#101010]">
            <div className="mx-auto grid max-w-[1600px] gap-10 px-5 py-20 md:px-10 lg:grid-cols-[0.75fr_1.25fr]">
              <div>
                <p className="text-xs font-black tracking-[0.45em] text-[#c8322a]">PROFILE / 01</p>
                <h2 className="mt-4 text-5xl font-black tracking-[-0.05em] text-white md:text-7xl">檐枫是什么</h2>
              </div>
              <div className="space-y-8">
                <p className="max-w-4xl text-2xl font-black leading-relaxed text-white md:text-4xl">
                  北京邮电大学檐枫动漫社，是隶属于校团委管理、正式登记在册的 ACG 综合兴趣类社团。
                </p>
                <div className="grid gap-px bg-white/15 md:grid-cols-3">
                  {[
                    ['没有门槛', '不需要会画画、会跳舞、很懂动漫。'],
                    ['自由参加', '不强制活动，也不强制只选一个组。'],
                    ['不收社费', '加入方式很简单，加 QQ 群即可。']
                  ].map(([title, text]) => (
                    <div key={title} className="bg-[#151515] p-6">
                      <p className="text-xl font-black text-[#c8322a]">{title}</p>
                      <p className="mt-3 text-sm font-bold leading-relaxed text-white/65">{text}</p>
                    </div>
                  ))}
                </div>
                <p className="max-w-3xl text-base font-bold leading-relaxed text-white/65">
                  只要加入檐枫社群，你就已经是檐枫的一份子。可以参加大型晚会，也可以只参加轻松日常；可以深入一个方向，也可以同时参与多个小组。
                </p>
              </div>
            </div>
          </section>

          <section id="groups" className="bg-[#080808] px-5 py-20 md:px-10">
            <div className="mx-auto max-w-[1600px]">
              <div className="mb-10 flex flex-col gap-4 border-b border-white/15 pb-8 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-black tracking-[0.45em] text-[#c8322a]">GROUPS / 02</p>
                  <h2 className="mt-3 text-5xl font-black tracking-[-0.05em] text-white md:text-7xl">九个官方组</h2>
                </div>
                <p className="max-w-2xl text-sm font-bold leading-relaxed text-white/60">
                  选择一个方向开始，也可以同时参与多个方向。这里不是报名表，是檐枫的入口地图。
                </p>
              </div>

              <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
                <div className="grid max-h-[680px] gap-2 overflow-y-auto pr-1">
                  {OFFICIAL_GROUPS.map((group, index) => {
                    const Icon = group.icon;
                    const active = index === selectedGroup;
                    return (
                      <button
                        key={group.title}
                        type="button"
                        onClick={() => setSelectedGroup(index)}
                        className={`flex items-center justify-between border px-4 py-4 text-left transition ${
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
                  <div className="relative z-10 max-w-4xl">
                    <div className="mb-8 flex flex-wrap items-center gap-4">
                      <span className="flex h-16 w-16 items-center justify-center bg-[#c8322a] text-white">
                        <GroupIcon className="h-8 w-8" />
                      </span>
                      <div>
                        <p className="text-xs font-black tracking-[0.4em] text-[#c8322a]">{activeGroup.label}</p>
                        <h3 className="text-5xl font-black tracking-[-0.04em] text-white">{activeGroup.title}</h3>
                      </div>
                    </div>
                    <p className="text-2xl font-black leading-relaxed text-white md:text-4xl">{activeGroup.description}</p>
                    <p className="mt-6 max-w-3xl text-base font-bold leading-relaxed text-white/60">{activeGroup.newcomerNote}</p>

                    <div className="mt-10 grid gap-px bg-white/15 md:grid-cols-[220px_1fr]">
                      <div className="bg-black p-5">
                        <p className="text-xs font-black tracking-[0.28em] text-[#c8322a]">QQ GROUP</p>
                        <p className="mt-2 text-2xl font-black text-white">{activeGroup.qq}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 bg-black p-5">
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
                <div className="flex flex-wrap gap-3">
                  {INTEREST_GROUPS.map((group) => (
                    <span key={group} className="bg-white px-4 py-2 text-xs font-black tracking-[0.14em] text-black">
                      {group}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="activities" className="bg-[#101010] px-5 py-20 md:px-10">
            <div className="mx-auto max-w-[1600px]">
              <div className="mb-10 grid gap-6 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
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
                    <article key={activity.title} className={`${index === 1 ? 'bg-[#c8322a] text-white' : 'bg-[#151515] text-white'} min-h-[360px] p-6`}>
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

          <section id="media" className="bg-[#080808] px-5 py-20 md:px-10">
            <div className="mx-auto grid max-w-[1600px] gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="border border-white/10 bg-[#121212] p-8 md:p-10">
                <p className="text-xs font-black tracking-[0.45em] text-[#c8322a]">MEDIA / 04</p>
                <h2 className="mt-4 text-5xl font-black tracking-[-0.05em] text-white md:text-7xl">活动录像</h2>
                <p className="mt-6 text-base font-bold leading-relaxed text-white/65">
                  宅舞、Wota 艺、社庆、冬日庆典、GMA、轻音 live 等 Bilibili 视频先保留轻量展示，后续再补年份分类和管理入口。
                </p>
                <button
                  type="button"
                  onClick={showVideos}
                  className="mt-8 flex items-center gap-3 bg-[#c8322a] px-6 py-4 text-sm font-black tracking-[0.18em] text-white shadow-[6px_6px_0_#000] transition hover:-translate-y-1"
                >
                  打开录像库
                  <Video className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-px bg-white/15">
                {latestNews.length > 0 ? (
                  latestNews.map((item) => (
                    <a key={item.id} href={item.link || '#'} target="_blank" rel="noopener noreferrer" className="grid gap-4 bg-[#121212] p-5 transition hover:bg-[#191919] md:grid-cols-[160px_1fr]">
                      <img src={item.coverUrl || '/default_cover.png'} alt={item.title} className="h-28 w-full object-cover" />
                      <div>
                        <p className="text-xs font-black tracking-[0.24em] text-[#c8322a]">{item.date}</p>
                        <h3 className="mt-2 text-xl font-black leading-snug text-white">{item.title}</h3>
                        <p className="mt-2 line-clamp-2 text-sm font-bold leading-relaxed text-white/55">{item.summary}</p>
                      </div>
                    </a>
                  ))
                ) : (
                  <div className="bg-[#121212] p-8 text-white/60">公众号内容加载中。</div>
                )}
              </div>
            </div>
          </section>

          <section id="join" className="relative overflow-hidden bg-[#c8322a] px-5 py-20 text-white md:px-10">
            <div className="absolute inset-0 opacity-10 checker-bg"></div>
            <div className="relative mx-auto grid max-w-[1600px] gap-10 lg:grid-cols-[1fr_1fr] lg:items-end">
              <div>
                <p className="text-xs font-black tracking-[0.45em] text-white/70">JOIN / 05</p>
                <h2 className="mt-4 text-6xl font-black tracking-[-0.06em] md:text-8xl">加入檐枫</h2>
                <p className="mt-6 max-w-2xl text-xl font-black leading-relaxed">
                  加 QQ 群即可。没有社费，不限制加入时间，不强制参加活动，也不用担心自己不够会。
                </p>
              </div>
              <div className="grid gap-px bg-white/40 md:grid-cols-3">
                {[
                  ['QQ群', '待补充', '主要加入入口'],
                  ['公众号', '涧桐现视研', '推文与活动回顾'],
                  ['Bilibili', '檐枫动漫社', '录像和投稿']
                ].map(([title, value, note]) => (
                  <div key={title} className="bg-[#080808] p-6">
                    <p className="text-xs font-black tracking-[0.25em] text-[#c8322a]">{title}</p>
                    <p className="mt-3 text-3xl font-black text-white">{value}</p>
                    <p className="mt-3 text-sm font-bold text-white/55">{note}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      ) : (
        <main className="mx-auto max-w-[1500px] px-5 pb-20 pt-28 md:px-10">
          <div className="mb-8 flex flex-col gap-4 border-b border-white/15 pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black tracking-[0.45em] text-[#c8322a]">VIDEOS</p>
              <h1 className="mt-2 text-5xl font-black text-white">活动录像</h1>
            </div>
            <button type="button" onClick={() => showHomeSection('home')} className="border border-white/20 px-5 py-3 text-sm font-black text-white hover:border-[#c8322a] hover:bg-[#c8322a]">
              回到首页
            </button>
          </div>
          <EventGallery currentTheme={AppTheme.DEFAULT} />
        </main>
      )}

      <ChatAssistant />
    </div>
  );
};

export default App;
