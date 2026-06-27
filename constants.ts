import { NewsItem } from './types';

// RAG Knowledge Base: This text is injected into the Gemini System Instruction
export const YANFENG_KNOWLEDGE_BASE = `
关于檐枫动漫社 (Yanfeng Anime Club):
1. **定位**: 檐枫动漫社是北邮 ACG 爱好者的聚集地，是一个活动丰富、自由、新人友好的 ACG 综合社团。
2. **基本信息**:
    - 正式名称：北京邮电大学檐枫动漫社。
    - 成立时间：2004 年。
    - 规模：QQ 大群接近 1000 人，活跃成员近百人，核心管理层十几人。
    - 口号：大好きだよ、みんな！含义是“最喜欢了，大家！”
    - 社团形象：看板娘“檐枫娘”，Delta 组组娘“檐羽”。
3. **新人友好**:
    - 没有入社门槛，不需要会画画、会跳舞、很懂动漫或二次元浓度很高。
    - 不强制参加活动，不强制选择唯一分组，不收社费，随时欢迎加入。
    - 可以只看番、跳宅舞、打 Wota 艺、绘画创作、唱歌、舞台剧、文字创作、喜欢术力口、组二次元乐队，或者只是想认识朋友。
4. **官方组**:
    - 事务组、宅舞组、创作组、翻唱组、舞台剧组、Delta 组、Wota 艺组、轻音组、VOCALOID 组。
5. **兴趣组**:
    - 番剧鉴赏组、明日方舟组、东方组、术力口组、Cos 组、配音组、摄影剪辑组、文艺部等，兴趣组比较自由，可以后续补充。
6. **主要活动**:
    - 百团大战/迎新、放映会、社团大会、冬日庆典、社庆、合宿、各组组活、GMA、宅舞教学、Wota 艺每周组活、轻音组专场、不定期联动、女仆咖啡厅等。
    - 最能代表檐枫的是冬日庆典和社庆。
    - GMA 是年终动画评选活动，包含动画评选、视频剪辑、奖项设计、活动筹备和直播颁奖。
7. **加入方式**: 加 QQ 群即可；也有公众号和 Bilibili 账号。不需要展示负责人个人联系方式。
`;


export const WECHAT_ARTICLES: NewsItem[] = [
  {
    id: '1',
    title: '【招新】2024秋季招新正式启动！',
    date: '2024-09-01',
    summary: '没有门槛，不收社费，九个官方组和许多兴趣方向都欢迎新朋友来玩。',
    // tag removed
    // source removed
    link: '#',
    // coverUrl: 'https://picsum.photos/seed/yanfeng1/400/200'
  },
  {
    id: '2',
    title: '【活动回顾】第14届夏日祭圆满落幕',
    date: '2024-07-15',
    summary: '感谢所有staff的辛勤付出，本次活动参与人数创历史新高！现场返图已上传。',
    // tag removed
    // tag removed
    // source removed
    link: '#',
    // coverUrl: 'https://picsum.photos/seed/yanfeng2/400/200'
  },
  {
    id: '3',
    title: '【GMA前瞻】入围名单大公开！',
    date: '2024-10-25',
    summary: '年终动画评选活动正在筹备中，剪辑、奖项设计和直播颁奖都在推进。',
    // tag removed
    // tag removed
    // source removed
    link: '#',
    // coverUrl: 'https://picsum.photos/seed/yanfeng3/400/200'
  },
  {
    id: '4',
    title: '【通知】关于本周五例行活动的调整通知',
    date: '2024-10-20',
    summary: '由于场地原因，原定于活动中心的例会改至3号教学楼201教室。',
    // tag removed
    // tag removed
    // source removed
    link: '#'
  }
];

export const MOCK_NEWS: NewsItem[] = [
  {
    id: 'res-1',
    title: '2024年社团年鉴电子版',
    date: '2024-12-01',
    summary: '记录了这一年所有的美好回忆，点击下载PDF版本。',
    tag: '年鉴',
    link: '#'
  },
  {
    id: 'res-2',
    title: '檐枫Logo矢量图下载',
    date: '2024-09-10',
    summary: '社团官方Logo资源，包含AI、PNG格式，供宣传制作使用。',
    tag: '资源',
    link: '#'
  },
  {
    id: 'res-3',
    title: '官方组介绍',
    date: '2024-03-01',
    summary: '更新后的大学生活动中心场地申请流程，各部门请仔细阅读。',
    tag: '文档',
    link: '#'
  },
  {
    id: 'res-4',
    title: '社团章程（2024修订版）',
    date: '2024-02-15',
    summary: '檐枫动漫社最新版章程，包含会员权利与义务说明。',
    tag: '文档',
    link: '#'
  },
  {
    id: 'res-5',
    title: '活动报销申请表模板',
    date: '2024-01-10',
    summary: '各部门举办活动需填写的报销表格，下载后打印使用。',
    tag: '表格',
    link: '#'
  },
  {
    id: 'res-6',
    title: 'GMA参赛报名表',
    date: '2024-10-01',
    summary: '第十届金枫叶奖参赛报名专用表格。',
    tag: '报名',
    link: '#'
  },
  {
    id: 'res-7',
    title: '社团器材借用管理办法',
    date: '2023-12-05',
    summary: '关于摄影器材、音响设备借用的具体规定及赔偿标准。',
    tag: '规定',
    link: '#'
  },

  {
    id: 'res-8',
    title: '2024春季学期社团值班表',
    date: '2024-03-05',
    summary: '新学期活动室值班安排，请各位干事准时到岗。',
    tag: '公示',
    link: '#'
  },
  {
    id: 'res-9',
    title: '社团活动室使用规范',
    date: '2023-11-20',
    summary: '保持环境整洁，爱护公物，人人有责。',
    tag: '规定',
    link: '#'
  }
];

