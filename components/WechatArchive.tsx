import React, { useMemo, useState } from 'react';
import { ExternalLink, Filter, NotebookPen, Search } from 'lucide-react';
import { NewsItem } from '../types';

type ArticleCategory = 'all' | 'recruit' | 'events' | 'gma' | 'notice' | 'daily';

interface WechatArchiveProps {
  articles: NewsItem[];
}

const ARTICLE_CATEGORIES: { id: ArticleCategory; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'recruit', label: '招新' },
  { id: 'events', label: '活动回顾' },
  { id: 'gma', label: 'GMA' },
  { id: 'notice', label: '通知' },
  { id: 'daily', label: '日常' }
];

const inferArticleCategory = (item: NewsItem): ArticleCategory => {
  const text = `${item.title} ${item.summary} ${item.tag || ''}`.toLowerCase();

  if (text.includes('招新') || text.includes('迎新')) return 'recruit';
  if (text.includes('gma') || text.includes('金枫叶')) return 'gma';
  if (text.includes('通知') || text.includes('调整')) return 'notice';
  if (text.includes('回顾') || text.includes('圆满') || text.includes('冬日') || text.includes('社庆') || text.includes('夏日祭')) return 'events';
  return 'daily';
};

const getCategoryLabel = (item: NewsItem) => {
  const category = inferArticleCategory(item);
  return ARTICLE_CATEGORIES.find((entry) => entry.id === category)?.label || '推文';
};

const WechatArchive: React.FC<WechatArchiveProps> = ({ articles }) => {
  const [activeCategory, setActiveCategory] = useState<ArticleCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArticles = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return articles.filter((item) => {
      const articleCategory = inferArticleCategory(item);
      const matchesCategory = activeCategory === 'all' || articleCategory === activeCategory;
      const matchesSearch =
        keyword.length === 0 ||
        item.title.toLowerCase().includes(keyword) ||
        item.summary.toLowerCase().includes(keyword) ||
        item.date.toLowerCase().includes(keyword);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, articles, searchQuery]);

  const renderArticleCard = (item: NewsItem) => {
    const hasLink = Boolean(item.link && item.link !== '#');
    const className =
      'group h-full overflow-hidden border-4 border-[var(--theme-border)] bg-white p-2 shadow-[6px_6px_0px_var(--theme-border)] transition-all hover:-translate-y-1 hover:shadow-[3px_3px_0px_var(--theme-border)]';

    const cardContent = (
      <div className="flex h-full flex-col bg-[#111] text-white">
        <div className="relative aspect-video overflow-hidden border-b-4 border-[var(--theme-border)] bg-black">
          <img
            src={item.coverUrl || '/default_cover.png'}
            alt={item.title}
            onError={(event) => {
              const target = event.target as HTMLImageElement;
              target.onerror = null;
              target.src = '/default_cover.png';
            }}
            className="h-full w-full object-cover opacity-85 transition duration-300 group-hover:scale-105 group-hover:opacity-100"
          />
          <div className="absolute bottom-2 left-2 bg-[#c8322a] px-2 py-1 text-xs font-black tracking-[0.12em] text-white">
            {getCategoryLabel(item)}
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-4">
            <p className="font-mono text-xs font-black tracking-[0.18em] text-[#c8322a]">{item.date}</p>
            {hasLink && <ExternalLink className="h-4 w-4 shrink-0 text-white/45 transition group-hover:text-[#c8322a]" />}
          </div>
          <h3 className="mt-3 text-2xl font-black leading-tight tracking-[-0.03em] text-white">{item.title}</h3>
          <p className="mt-4 line-clamp-3 text-sm font-bold leading-relaxed text-white/60">{item.summary}</p>
          <div className="mt-auto pt-6">
            <span className="inline-flex items-center gap-2 border border-white/18 px-3 py-2 text-xs font-black tracking-[0.14em] text-white/70">
              <NotebookPen className="h-3.5 w-3.5 text-[#c8322a]" />
              涧桐现视研
            </span>
          </div>
        </div>
      </div>
    );

    if (hasLink) {
      return (
        <a key={item.id} href={item.link} target="_blank" rel="noopener noreferrer" className={className}>
          {cardContent}
        </a>
      );
    }

    return (
      <article key={item.id} className={className}>
        {cardContent}
      </article>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col gap-6 border-b-4 border-dashed border-[var(--theme-border)] pb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-4xl font-retro text-[var(--theme-primary)]">公众号推文</h2>
            <p className="mt-2 font-bold text-[var(--theme-accent)]">WECHAT ARCHIVE</p>
          </div>
          <div className="border-4 border-[var(--theme-border)] bg-[var(--theme-primary)] px-5 py-3 text-sm font-black tracking-[0.18em] text-white shadow-[4px_4px_0px_var(--theme-border)]">
            涧桐现视研
          </div>
        </div>

        <div className="mt-4 flex flex-col items-center gap-4 rounded-xl border-4 border-[var(--theme-border)] bg-[var(--theme-secondary)] p-2 shadow-[6px_6px_0px_var(--theme-border)] md:flex-row">
          <div className="flex flex-1 flex-wrap justify-center gap-2 md:justify-start">
            {ARTICLE_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`border-2 px-4 py-2 text-sm font-bold transition-all ${
                  activeCategory === category.id
                    ? 'border-[var(--theme-border)] bg-[var(--theme-primary)] text-white shadow-[2px_2px_0px_var(--theme-border)] -translate-y-0.5'
                    : 'border-transparent bg-white text-[var(--theme-border)] hover:bg-gray-100'
                }`}
              >
                <span className="mr-2 inline-flex align-middle">
                  <Filter size={14} />
                </span>
                {category.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜索推文..."
              className="w-full border-2 border-[var(--theme-border)] bg-white py-2 pl-10 pr-4 text-black outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {filteredArticles.length > 0 ? (
          filteredArticles.map(renderArticleCard)
        ) : (
          <div className="col-span-full py-20 text-center">
            <div className="mb-4 inline-block border-4 border-white/18 bg-white/10 p-6 shadow-[0_0_34px_rgba(255,255,255,0.08)]">
              <NotebookPen size={48} className="text-[var(--theme-primary)]" />
            </div>
            <p className="text-xl font-bold text-white/82">
              {searchQuery ? `未找到与 "${searchQuery}" 相关的推文` : '该分类下暂无推文'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WechatArchive;
