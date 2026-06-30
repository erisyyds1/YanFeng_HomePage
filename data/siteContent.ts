import {
  CalendarDays,
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
  ShieldCheck,
  Star,
  Theater,
  Trophy,
  UserPlus,
  Users,
  Video,
  Wand2
} from 'lucide-react';
import type { ActivityItem, AnchorId, NavItem, OfficialGroup } from '../types';

export const HERO_IMAGE = '/image/yanfeng-hero.jpg';
export const SECONDARY_BG_IMAGE = '/image/secondary-page-bg.png';
export const BLACKBOARD_PANEL_IMAGE = '/image/blackboard-panel.png';
export const JOIN_IMAGE = '/image/join-2025-anniversary.png';
export const JOIN_GROUP_NUMBER = '737508445';

export const NAV_ITEMS: NavItem[] = [
  { label: '首页', labelEn: 'INDEX', target: 'home', icon: Home },
  { label: '情报', labelEn: 'INFORMATION', target: 'about', icon: ShieldCheck },
  { label: '小组', labelEn: 'GROUPS', target: 'groups', icon: Users },
  { label: '活动', labelEn: 'ACTIVITIES', target: 'activities', icon: CalendarDays },
  { label: '万象', labelEn: 'MEDIA', target: 'media', icon: Video },
  { label: '加入', labelEn: 'JOIN US', target: 'join', icon: UserPlus }
];

export const SCREEN_IDS: AnchorId[] = ['home', 'about', 'groups', 'activities', 'media', 'join'];

export const OFFICIAL_GROUPS: OfficialGroup[] = [
  {
    title: '番剧鉴赏组',
    label: 'ANIME',
    qq: '924171013',
    description: '围绕动画新番、经典作品和观影交流展开，一起追番、补番、讨论作品，也可以组织放映与安利。每年年末会组织一次大型评奖活动GMA。',
    newcomerNote: '适合喜欢看番、想找人一起讨论剧情演出，或者刚开始接触动画的新朋友。',
    activities: ['新番交流', '作品安利', '放映讨论', '补番推荐', 'GMA'],
    image: '/image/group-anime.jpg',
    icon: Video
  },
  {
    title: '宅舞组',
    label: 'DANCE',
    qq: '1018528156',
    description: '檐枫大型晚会中重要的节目来源。一起约舞、练舞、教学、排练节目，也会录制宅舞视频。',
    newcomerNote: '无论是否有基础，只要对宅舞感兴趣，都欢迎加入。',
    activities: ['日常约舞', '社舞教学', '群舞教学', '视频录制'],
    image: '/image/group-dance.jpeg',
    icon: Music2
  },
  {
    title: '创作组',
    label: 'CREATE',
    qq: '496866658',
    description: '热爱绘画、设计、文字、音乐、后期等同学们的大家庭，涵盖泛 ACGN 文化相关创作。',
    newcomerNote: '可以分享作品，也可以从观摩、学习、协作开始。',
    activities: ['绘画设计', '手书', '视频剪辑', '作品交流', '手书创作'],
    image: '/image/group-create.jpg',
    icon: PenTool
  },
  {
    title: '翻唱组',
    label: 'VOCAL',
    qq: '745254525',
    description: '檐枫大型晚会中重要的节目来源。面向所有热爱 ACGN 相关歌曲、喜欢唱歌并愿意唱歌的同学。',
    newcomerNote: '觉得自己水平还不够也没关系，唱得开心才是最重要的目标。',
    activities: ['新生歌会', 'KTV 聚会', '翻唱交流', '晚会节目'],
    image: '/image/group-vocal.jpg',
    icon: Mic2
  },
  {
    title: '舞台剧组',
    label: 'STAGE',
    qq: '912127654',
    description: '爱好表演、舞台剧、剧本创作和 cos 的大家聚在一起玩的地方。每次大型晚会都会提供一到两台精彩舞台剧',
    newcomerNote: '对表演、剧本、舞台或幕后协作感兴趣都可以来。',
    activities: ['剧本创作', '舞台排练', '角色演出', 'Cos 协作'],
    image: '/image/group-stage.jpg',
    icon: Theater
  },
  {
    title: 'Delta 组',
    label: 'DELTA',
    qq: '290772952',
    description: '提供创作与分享的平台，也协助事务组进行社团活动的预热与宣传。',
    newcomerNote: '适合分享作品、写杂谈、做采访、安利动漫游戏小说等泛 ACGN 内容。',
    activities: ['文字创作', '作品安利', '记者采访', '推文放送'],
    image: '/image/group-delta.jpeg',
    icon: NotebookPen
  },
  {
    title: 'Wota 艺组',
    label: 'WOTA',
    qq: '876209001',
    description: '用光棒描绘光与影，为喜欢的动画、偶像以及歌曲应援。每周组活都会进行教学和练习，也会参与晚会表演和进行各种企划视频录制。',
    newcomerNote: '无需基础，来了就教，包教包会。',
    activities: ['新人友好', '组活练习', '晚会表演', '企划视频'],
    image: '/image/group-wota.jpeg',
    icon: Clapperboard
  },
  {
    title: '轻音组',
    label: 'BAND',
    qq: '914316313',
    description: '面向乐器、乐队和 ACGN 音乐爱好者，用于交流、资源分享、技术讨论和合作组队。参与晚会表演，不定时会有轻音组live专场。',
    newcomerNote: '乐器高手、练习新手，甚至只是想点歌听的纯路人都欢迎。',
    activities: ['琴技交流', '乐队组建', '专场 Live', 'ACGN 音乐讨论'],
    image: '/image/group-band.jpg',
    icon: Radio
  },
  {
    title: 'VOCALOID 组',
    label: 'VOCALOID',
    qq: '361980809',
    description: '以泛 VOCALOID 创作为中心，也交流 Synthesizer V、CeVIO、UTAU 等音声合成内容。',
    newcomerNote: '术术人、创作者、音乐萌新或只是想找到同好，都可以获得独特体验。',
    activities: ['作品翻调', '原创曲目', '调校教学', '作编曲教学'],
    image: '/image/group-vocaloid.png',
    icon: Wand2
  },
  {
    title: '事务组',
    label: 'SUPPORT',
    qq: '1054869730',
    description: '协助举办社团内各类大小活动，是冬日庆典、社庆、百团等活动顺利进行的重要后勤力量。',
    newcomerNote: '适合愿意做组织、协调、设备调试、后勤支持和现场执行的同学。',
    activities: ['设备调试', '后勤支持', '活动协助', '大型活动保障'],
    image: '/image/group-support.jpeg',
    icon: Megaphone
  }
];

export const INTEREST_GROUPS = ['明日方舟组', '东方组', '拉拉组', 'Cos 组', '配音组', '摄影剪辑组', '文艺部', '更多自由方向'];

export const ACTIVITIES: ActivityItem[] = [
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
