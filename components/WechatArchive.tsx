import React, { useEffect, useMemo, useState } from 'react';
import {
  Edit3,
  ExternalLink,
  Filter,
  Image as ImageIcon,
  Link as LinkIcon,
  NotebookPen,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  X
} from 'lucide-react';
import type { WechatArticle } from '../types';
import {
  addWechatArticle,
  deleteWechatArticle,
  fetchWechatArticles,
  parseWechatArticleUrl,
  updateWechatArticle
} from '../services/wechatArticleService';
import { uploadImageFile } from '../services/uploadService';
import RetroCard from './RetroCard';

type ArticleCategory = 'all' | 'recruit' | 'events' | 'gma' | 'notice' | 'daily' | 'drafts';

interface WechatArchiveProps {
  isEditMode?: boolean;
}

const ARTICLE_CATEGORIES: { id: ArticleCategory; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'recruit', label: '招新' },
  { id: 'events', label: '活动回顾' },
  { id: 'gma', label: 'GMA' },
  { id: 'notice', label: '通知' },
  { id: 'daily', label: '日常' },
  { id: 'drafts', label: '草稿' }
];

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_UPLOAD_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const today = () => new Date().toISOString().slice(0, 10);

const inferArticleCategory = (item: WechatArticle): ArticleCategory => {
  if (!item.isPublished) return 'drafts';

  const text = `${item.title} ${item.summary}`.toLowerCase();
  if (text.includes('招新') || text.includes('迎新')) return 'recruit';
  if (text.includes('gma') || text.includes('金枫叶')) return 'gma';
  if (text.includes('通知') || text.includes('调整') || text.includes('预告')) return 'notice';
  if (text.includes('回顾') || text.includes('圆满') || text.includes('冬日') || text.includes('社庆')) return 'events';
  return 'daily';
};

const getCategoryLabel = (item: WechatArticle) => {
  const category = inferArticleCategory(item);
  return ARTICLE_CATEGORIES.find((entry) => entry.id === category)?.label || '推文';
};

const WechatArchive: React.FC<WechatArchiveProps> = ({ isEditMode = false }) => {
  const [articles, setArticles] = useState<WechatArticle[]>([]);
  const [activeCategory, setActiveCategory] = useState<ArticleCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [wechatUrl, setWechatUrl] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [publishedAt, setPublishedAt] = useState(today());
  const [isPublished, setIsPublished] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [parseBusy, setParseBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);

  const coverInputId = 'wechat-cover-upload';
  const coverPreview = coverPreviewUrl || coverUrl;

  useEffect(() => {
    const loadArticles = async () => {
      const nextArticles = await fetchWechatArticles(isEditMode);
      setArticles(nextArticles);
    };

    void loadArticles();
  }, [isEditMode]);

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
    };
  }, [coverPreviewUrl]);

  const resetCoverUpload = () => {
    setCoverFile(null);
    setCoverPreviewUrl('');
  };

  const resetArticleForm = () => {
    setEditingArticleId(null);
    setWechatUrl('');
    setTitle('');
    setSummary('');
    setCoverUrl('');
    setPublishedAt(today());
    setIsPublished(true);
    setSortOrder(0);
    setFormError('');
    resetCoverUpload();
    setShowForm(false);
  };

  const openAddArticleForm = () => {
    resetArticleForm();
    setShowForm(true);
  };

  const openArticleEditor = (article: WechatArticle) => {
    setEditingArticleId(article.id);
    setWechatUrl(article.wechatUrl);
    setTitle(article.title);
    setSummary(article.summary);
    setCoverUrl(article.coverUrl || '');
    setPublishedAt(article.publishedAt || today());
    setIsPublished(article.isPublished);
    setSortOrder(article.sortOrder || 0);
    setFormError('');
    resetCoverUpload();
    setShowForm(true);
  };

  const selectCoverFile = (file: File | null) => {
    if (!file) return;

    if (!ALLOWED_UPLOAD_TYPES.has(file.type)) {
      setFormError('请上传 JPG、PNG 或 WebP 封面图。');
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setFormError('封面图不能超过 8 MB。');
      return;
    }

    setCoverFile(file);
    setCoverPreviewUrl(URL.createObjectURL(file));
    setFormError('');
  };

  const handleCoverDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    selectCoverFile(event.dataTransfer.files[0] || null);
  };

  const applyParsedArticle = async (overwrite = true) => {
    const cleanWechatUrl = wechatUrl.trim();
    if (!cleanWechatUrl) {
      setFormError('请先粘贴微信公众号文章链接。');
      return null;
    }

    setParseBusy(true);
    const parsed = await parseWechatArticleUrl(cleanWechatUrl);
    setParseBusy(false);

    if (!parsed) {
      setFormError('链接解析失败，可以先手动填写标题、摘要和封面。');
      return null;
    }

    if (overwrite) {
      if (parsed.title) setTitle(parsed.title);
      if (parsed.summary) setSummary(parsed.summary);
      if (parsed.coverUrl) setCoverUrl(parsed.coverUrl);
      if (parsed.publishedAt) setPublishedAt(parsed.publishedAt);
    }
    setFormError('');
    return parsed;
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这篇公众号推文吗？')) return;

    const success = await deleteWechatArticle(id);
    if (success) {
      setArticles((currentArticles) => currentArticles.filter((article) => article.id !== id));
    } else {
      alert('删除失败，请稍后重试。');
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    const cleanWechatUrl = wechatUrl.trim();
    if (!cleanWechatUrl) {
      setFormError('请先粘贴微信公众号文章链接。');
      return;
    }

    setSaveBusy(true);

    let nextTitle = title.trim();
    let nextSummary = summary.trim();
    let nextCoverUrl = coverUrl.trim();
    let nextPublishedAt = publishedAt.trim();

    if (!nextTitle || !nextSummary || (!nextCoverUrl && !coverFile) || !nextPublishedAt) {
      const parsed = await parseWechatArticleUrl(cleanWechatUrl);
      if (parsed) {
        nextTitle = nextTitle || parsed.title?.trim() || '';
        nextSummary = nextSummary || parsed.summary?.trim() || '';
        nextCoverUrl = nextCoverUrl || parsed.coverUrl?.trim() || '';
        nextPublishedAt = nextPublishedAt || parsed.publishedAt?.trim() || '';
      }
    }

    if (coverFile) {
      const uploadedCover = await uploadImageFile(coverFile, 'wechat');
      if (!uploadedCover?.url) {
        setSaveBusy(false);
        setFormError('封面上传失败，请确认 API 和 R2 配置正常。');
        return;
      }
      nextCoverUrl = uploadedCover.url;
    }

    const articleData = {
      title: nextTitle || '未命名公众号推文',
      summary: nextSummary,
      coverUrl: nextCoverUrl,
      wechatUrl: cleanWechatUrl,
      publishedAt: nextPublishedAt || today(),
      isPublished,
      sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0
    };

    const savedArticle = editingArticleId
      ? await updateWechatArticle(editingArticleId, articleData)
      : await addWechatArticle(articleData);

    setSaveBusy(false);

    if (savedArticle) {
      setArticles((currentArticles) =>
        editingArticleId
          ? currentArticles.map((article) => (article.id === editingArticleId ? savedArticle : article))
          : [savedArticle, ...currentArticles]
      );
      resetArticleForm();
    } else {
      setFormError(editingArticleId ? '更新失败，请检查后台接口。' : '保存失败，请检查后台接口。');
    }
  };

  const filteredArticles = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return articles.filter((item) => {
      const articleCategory = inferArticleCategory(item);
      const matchesCategory = activeCategory === 'all' || articleCategory === activeCategory;
      const matchesSearch =
        keyword.length === 0 ||
        item.title.toLowerCase().includes(keyword) ||
        item.summary.toLowerCase().includes(keyword) ||
        item.publishedAt.toLowerCase().includes(keyword);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, articles, searchQuery]);

  const renderArticleCard = (item: WechatArticle) => (
    <a
      key={item.id}
      href={item.wechatUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group h-full overflow-hidden border-4 border-[var(--theme-border)] bg-white p-2 shadow-[6px_6px_0px_var(--theme-border)] transition-all hover:-translate-y-1 hover:shadow-[3px_3px_0px_var(--theme-border)]"
    >
      <div className="flex h-full flex-col bg-[#111] text-white">
        <div className="relative aspect-video overflow-hidden border-b-4 border-[var(--theme-border)] bg-black">
          {item.coverUrl ? (
            <img
              src={item.coverUrl}
              alt={item.title}
              onError={(event) => {
                const target = event.target as HTMLImageElement;
                target.onerror = null;
                target.src = '/default_cover.png';
              }}
              className="h-full w-full object-cover opacity-85 transition duration-300 group-hover:scale-105 group-hover:opacity-100"
            />
          ) : (
            <div className="grid h-full place-items-center bg-[#161616] text-white/35">
              <NotebookPen className="h-14 w-14" />
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-[#c8322a] px-2 py-1 text-xs font-black tracking-[0.12em] text-white">
            {getCategoryLabel(item)}
          </div>
          {!item.isPublished && (
            <div className="absolute right-2 top-2 bg-black/80 px-2 py-1 text-xs font-black tracking-[0.12em] text-white">
              草稿
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-4">
            <p className="font-mono text-xs font-black tracking-[0.18em] text-[#c8322a]">{item.publishedAt}</p>
            <ExternalLink className="h-4 w-4 shrink-0 text-white/45 transition group-hover:text-[#c8322a]" />
          </div>
          <h3 className="mt-3 text-2xl font-black leading-tight tracking-[-0.03em] text-white">{item.title}</h3>
          <p className="mt-4 line-clamp-3 text-sm font-bold leading-relaxed text-white/60">{item.summary}</p>
          <div className="mt-auto flex items-end justify-between gap-3 pt-6">
            <span className="inline-flex items-center gap-2 border border-white/18 px-3 py-2 text-xs font-black tracking-[0.14em] text-white/70">
              <NotebookPen className="h-3.5 w-3.5 text-[#c8322a]" />
              涧桐现视研
            </span>

            {isEditMode && (
              <span className="flex shrink-0 items-center gap-1" onClick={(event) => event.preventDefault()}>
                <button
                  type="button"
                  onClick={() => openArticleEditor(item)}
                  className="p-1 text-white/45 transition-colors hover:text-[#c8322a]"
                  title="编辑推文"
                >
                  <Edit3 size={19} />
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(item.id)}
                  className="p-1 text-white/45 transition-colors hover:text-red-500"
                  title="删除推文"
                >
                  <Trash2 size={20} />
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  );

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col gap-6 border-b-4 border-dashed border-[var(--theme-border)] pb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-4xl font-retro text-[var(--theme-primary)]">公众号推文</h2>
            <p className="mt-2 font-bold text-[var(--theme-accent)]">WECHAT ARCHIVE</p>
          </div>
          {isEditMode ? (
            <button
              type="button"
              onClick={showForm ? resetArticleForm : openAddArticleForm}
              className="flex items-center gap-2 rounded-lg bg-[var(--theme-primary)] px-4 py-3 text-sm font-black text-white shadow-[4px_4px_0px_var(--theme-border)] transition hover:-translate-y-0.5"
            >
              {showForm ? <X size={18} /> : <Plus size={18} />}
              {showForm ? '收起表单' : '添加公众号推文'}
            </button>
          ) : (
            <div className="border-4 border-[var(--theme-border)] bg-[var(--theme-primary)] px-5 py-3 text-sm font-black tracking-[0.18em] text-white shadow-[4px_4px_0px_var(--theme-border)]">
              涧桐现视研
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col items-center gap-4 rounded-xl border-4 border-[var(--theme-border)] bg-[var(--theme-secondary)] p-2 shadow-[6px_6px_0px_var(--theme-border)] md:flex-row">
          <div className="flex flex-1 flex-wrap justify-center gap-2 md:justify-start">
            {ARTICLE_CATEGORIES.filter((category) => isEditMode || category.id !== 'drafts').map((category) => (
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

      {isEditMode && showForm && (
        <RetroCard variant="ticket" className="mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="mb-4 text-xl font-bold text-[var(--theme-primary)]">
              {editingArticleId ? '编辑公众号推文' : '添加公众号推文'}
            </h3>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-bold text-[var(--theme-border)]">微信公众号文章链接</label>
                  <div className="flex flex-col gap-2 rounded border-2 border-[var(--theme-border)] bg-white p-2 md:flex-row">
                    <div className="flex min-w-0 flex-1 items-center">
                      <LinkIcon size={18} className="mr-2 shrink-0 text-gray-400" />
                      <input
                        type="url"
                        value={wechatUrl}
                        onChange={(event) => setWechatUrl(event.target.value)}
                        placeholder="https://mp.weixin.qq.com/s/..."
                        className="w-full bg-transparent text-black outline-none"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => void applyParsedArticle(true)}
                      disabled={parseBusy}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded bg-[#111] px-4 py-2 text-xs font-black text-white transition hover:bg-[var(--theme-primary)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${parseBusy ? 'animate-spin' : ''}`} />
                      {parseBusy ? '解析中' : '解析链接'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">粘贴公众号链接后可先解析，标题、摘要、封面都可以再手动修改。</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[var(--theme-border)]">标题</label>
                  <div className="flex items-center rounded border-2 border-[var(--theme-border)] bg-white p-2">
                    <NotebookPen size={18} className="mr-2 text-gray-400" />
                    <input
                      type="text"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="可由链接解析得到..."
                      className="w-full bg-transparent text-black outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[var(--theme-border)]">发布时间</label>
                  <input
                    type="date"
                    value={publishedAt}
                    onChange={(event) => setPublishedAt(event.target.value)}
                    className="w-full rounded border-2 border-[var(--theme-border)] bg-white p-2 text-black outline-none"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-bold text-[var(--theme-border)]">摘要</label>
                  <textarea
                    value={summary}
                    onChange={(event) => setSummary(event.target.value)}
                    placeholder="可由链接解析得到，也可以自己写一段展示摘要..."
                    rows={4}
                    className="w-full resize-y rounded border-2 border-[var(--theme-border)] bg-white p-3 text-black outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[var(--theme-border)]">排序</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(event) => setSortOrder(Number(event.target.value))}
                    className="w-full rounded border-2 border-[var(--theme-border)] bg-white p-2 text-black outline-none"
                  />
                </div>

                <label className="flex items-center gap-3 self-end rounded border-2 border-[var(--theme-border)] bg-white p-2 text-sm font-black text-[var(--theme-border)]">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(event) => setIsPublished(event.target.checked)}
                    className="h-4 w-4 accent-[var(--theme-primary)]"
                  />
                  前台展示
                </label>

                <div className="space-y-2 md:col-span-2">
                  <span className="block text-sm font-bold text-[var(--theme-border)]">上传封面</span>
                  <input
                    id={coverInputId}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(event) => selectCoverFile(event.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor={coverInputId}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleCoverDrop}
                    className="flex min-h-[132px] cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-[var(--theme-border)] bg-white/80 p-5 text-center transition hover:bg-white"
                  >
                    <UploadCloud className="h-8 w-8 text-[var(--theme-primary)]" />
                    <span className="mt-3 text-base font-black text-[var(--theme-border)]">拖入封面图，或点击选择文件</span>
                    <span className="mt-2 text-xs font-bold text-gray-500">可不上传；JPG / PNG / WebP，最大 8 MB</span>
                    {coverFile && (
                      <span className="mt-3 max-w-full truncate rounded bg-black px-3 py-1 text-xs font-black text-white">
                        {coverFile.name}
                      </span>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold text-[var(--theme-border)]">封面预览</p>
                <div className="grid min-h-[240px] place-items-center overflow-hidden rounded border-2 border-[var(--theme-border)] bg-black">
                  {coverPreview ? (
                    <img src={coverPreview} alt="封面预览" className="h-full max-h-[280px] w-full object-contain" />
                  ) : (
                    <div className="px-5 text-center">
                      <ImageIcon className="mx-auto h-10 w-10 text-white/28" />
                      <p className="mt-3 text-sm font-bold text-white/45">解析或上传封面后这里会显示预览</p>
                    </div>
                  )}
                </div>
                {editingArticleId && !coverFile && (
                  <p className="text-xs text-gray-500">不重新选择文件时，会保留或使用上方解析到的封面。</p>
                )}
              </div>
            </div>

            {formError && (
              <p className="rounded border-2 border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-600">
                {formError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetArticleForm}
                className="border-2 border-[var(--theme-border)] bg-white px-6 py-2 font-bold text-[var(--theme-border)] transition-colors hover:bg-gray-100"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={saveBusy || parseBusy}
                className="rounded bg-[var(--theme-accent)] px-6 py-2 font-bold text-white transition-colors hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saveBusy ? '保存中...' : editingArticleId ? '确认保存' : '解析并保存'}
              </button>
            </div>
          </form>
        </RetroCard>
      )}

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
