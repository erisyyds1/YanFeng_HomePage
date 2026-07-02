import React, { useState } from 'react';
import { Edit3, Film, Filter, Image as ImageIcon, Link as LinkIcon, Play, Plus, Search, Trash2, UploadCloud, X } from 'lucide-react';
import { AppTheme, VideoCategory, VideoContent } from '../types';
import { addVideo, deleteVideo, fetchVideos, updateVideo } from '../services/videoService';
import { uploadImageFile } from '../services/uploadService';
import RetroCard from './RetroCard';

interface EventGalleryProps {
  currentTheme: AppTheme;
  isEditMode?: boolean;
}

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_UPLOAD_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const CATEGORIES: { id: VideoCategory | 'all'; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'winter', label: '冬日祭' },
  { id: 'anniversary', label: '社庆' },
  { id: 'gma', label: 'GMA' },
  { id: 'daily', label: '日常' },
];

const normalizeBilibiliPlayerUrl = (input: string): string | null => {
  const trimmed = input.trim();
  const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  let cleanUrl = (srcMatch?.[1] || trimmed).trim();

  if (cleanUrl.startsWith('//')) {
    cleanUrl = `https:${cleanUrl}`;
  }

  try {
    const parsed = new URL(cleanUrl);
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'player.bilibili.com') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
};

const appendAutoplay = (url: string): string => {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('autoplay', '1');
    return parsed.toString();
  } catch {
    return url.includes('?') ? `${url}&autoplay=1` : `${url}?autoplay=1`;
  }
};

const EventGallery: React.FC<EventGalleryProps> = ({ currentTheme, isEditMode = false }) => {
  const [videos, setVideos] = useState<VideoContent[]>([]);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<VideoCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [bilibiliLink, setBilibiliLink] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<VideoCategory>('daily');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState('');
  const [thumbnailUploadBusy, setThumbnailUploadBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const thumbnailInputId = 'video-thumbnail-upload';
  const thumbnailPreview = thumbnailPreviewUrl || thumbnailUrl;

  React.useEffect(() => {
    const loadVideos = async () => {
      const nextVideos = await fetchVideos();
      setVideos(nextVideos);
      setPlayingVideoId(null);
    };

    void loadVideos();
  }, []);

  React.useEffect(() => {
    return () => {
      if (thumbnailPreviewUrl) {
        URL.revokeObjectURL(thumbnailPreviewUrl);
      }
    };
  }, [thumbnailPreviewUrl]);

  const resetThumbnailUpload = () => {
    setThumbnailFile(null);
    setThumbnailPreviewUrl('');
    setThumbnailUploadBusy(false);
  };

  const resetVideoForm = () => {
    setBilibiliLink('');
    setVideoTitle('');
    setThumbnailUrl('');
    resetThumbnailUpload();
    setUploadCategory('daily');
    setFormError('');
    setEditingVideoId(null);
    setShowForm(false);
  };

  const openAddVideoForm = () => {
    resetVideoForm();
    setShowForm(true);
  };

  const handleEditVideo = (video: VideoContent) => {
    setEditingVideoId(video.id);
    setVideoTitle(video.title);
    setBilibiliLink(video.url);
    setThumbnailUrl(video.thumbnail || '');
    resetThumbnailUpload();
    setUploadCategory(video.category);
    setFormError('');
    setShowForm(true);
  };

  const selectThumbnailFile = (file: File | null) => {
    if (!file) return;

    if (!ALLOWED_UPLOAD_TYPES.has(file.type)) {
      setFormError('请上传 JPG、PNG 或 WebP 封面图。');
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setFormError('封面图不能超过 8 MB。');
      return;
    }

    setThumbnailFile(file);
    setThumbnailPreviewUrl(URL.createObjectURL(file));
    setFormError('');
  };

  const handleThumbnailDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    selectThumbnailFile(event.dataTransfer.files[0] || null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这个视频吗？')) return;

    const success = await deleteVideo(id);
    if (success) {
      setVideos((currentVideos) => currentVideos.filter((video) => video.id !== id));
    } else {
      alert('删除失败，请稍后重试。');
    }
  };

  const handleBilibiliSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');

    const cleanUrl = normalizeBilibiliPlayerUrl(bilibiliLink);
    if (!videoTitle.trim() || !cleanUrl) {
      setFormError('请填写标题，并粘贴 Bilibili 播放器链接或嵌入代码。');
      return;
    }

    let cleanThumbnailUrl = thumbnailUrl.trim();
    if (thumbnailFile) {
      setThumbnailUploadBusy(true);
      const uploadedThumbnail = await uploadImageFile(thumbnailFile, 'thumbnail');
      setThumbnailUploadBusy(false);

      if (!uploadedThumbnail?.url) {
        setFormError('封面上传失败，请确认 API 服务正在运行。');
        return;
      }

      cleanThumbnailUrl = uploadedThumbnail.url;
    }

    const nextVideoData: Omit<VideoContent, 'id'> = {
      title: videoTitle.trim(),
      url: cleanUrl,
      type: 'bilibili',
      thumbnail: cleanThumbnailUrl,
      category: uploadCategory,
    };

    const savedVideo = editingVideoId
      ? await updateVideo(editingVideoId, nextVideoData)
      : await addVideo(nextVideoData);

    if (savedVideo) {
      setVideos((currentVideos) =>
        editingVideoId
          ? currentVideos.map((video) => (video.id === editingVideoId ? savedVideo : video))
          : [savedVideo, ...currentVideos]
      );
      resetVideoForm();
      setActiveCategory(uploadCategory);
    } else {
      setFormError(editingVideoId ? '更新失败，请检查 API 服务是否启动。' : '添加失败，请检查 API 服务是否启动。');
    }
  };

  const filteredVideos = videos.filter((video) => {
    const matchesCategory = activeCategory === 'all' || video.category === activeCategory;
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col gap-6 border-b-4 border-dashed border-[var(--theme-border)] pb-8">
        <div className="flex flex-col items-end justify-between gap-4 md:flex-row">
          <div>
            <h2 className="font-retro text-4xl text-[var(--theme-primary)]">活动录像</h2>
            <p className={`${currentTheme === AppTheme.GMA ? 'text-black' : 'text-[var(--theme-accent)]'} mt-2 font-bold`}>
              SHOWCASE & MEMORIES
            </p>
          </div>
          {isEditMode && (
            <button
              type="button"
              onClick={showForm ? resetVideoForm : openAddVideoForm}
              className="flex items-center gap-2 rounded-lg bg-[var(--theme-primary)] px-4 py-3 text-sm font-black text-white shadow-[4px_4px_0px_var(--theme-border)] transition hover:-translate-y-0.5"
            >
              {showForm ? <X size={18} /> : <Plus size={18} />}
              {showForm ? '收起表单' : '添加 Bilibili 视频'}
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-col items-center gap-4 rounded-xl border-4 border-[var(--theme-border)] bg-[var(--theme-secondary)] p-2 shadow-[6px_6px_0px_var(--theme-border)] md:flex-row">
          <div className="flex flex-1 flex-wrap justify-center gap-2 md:justify-start">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`rounded-lg border-2 px-4 py-2 text-sm font-bold transition-all ${
                  activeCategory === category.id
                    ? 'border-[var(--theme-border)] bg-[var(--theme-primary)] text-white shadow-[2px_2px_0px_var(--theme-border)] -translate-y-0.5'
                    : 'border-transparent bg-white text-[var(--theme-border)] hover:bg-gray-100'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜索视频..."
              className="w-full rounded-lg border-2 border-[var(--theme-border)] bg-white py-2 pl-10 pr-4 text-black focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20"
            />
          </div>
        </div>
      </div>

      {isEditMode && showForm && (
        <RetroCard variant="ticket" className="mb-8">
          <form onSubmit={handleBilibiliSubmit} className="space-y-4">
            <h3 className="mb-4 text-xl font-bold text-[var(--theme-primary)]">
              {editingVideoId ? '编辑 Bilibili 外链视频' : '添加 Bilibili 外链视频'}
            </h3>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[var(--theme-border)]">视频标题</label>
                  <div className="flex items-center rounded border-2 border-[var(--theme-border)] bg-white p-2">
                    <Film size={18} className="mr-2 text-gray-400" />
                    <input
                      type="text"
                      value={videoTitle}
                      onChange={(event) => setVideoTitle(event.target.value)}
                      placeholder="输入视频标题..."
                      className="w-full bg-transparent text-black outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[var(--theme-border)]">所属分类</label>
                  <div className="relative flex items-center rounded border-2 border-[var(--theme-border)] bg-white p-2">
                    <Filter size={18} className="mr-2 text-gray-400" />
                    <select
                      value={uploadCategory}
                      onChange={(event) => setUploadCategory(event.target.value as VideoCategory)}
                      className="w-full cursor-pointer appearance-none bg-transparent text-black outline-none"
                    >
                      {CATEGORIES.filter((category) => category.id !== 'all').map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-bold text-[var(--theme-border)]">Bilibili 链接或嵌入代码</label>
                  <div className="flex items-center rounded border-2 border-[var(--theme-border)] bg-white p-2">
                    <LinkIcon size={18} className="mr-2 text-gray-400" />
                    <input
                      type="text"
                      value={bilibiliLink}
                      onChange={(event) => setBilibiliLink(event.target.value)}
                      placeholder='例如：<iframe src="//player.bilibili.com/..." ...></iframe>'
                      className="w-full bg-transparent text-black outline-none"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">可以直接粘贴 B 站分享里的嵌入代码，系统会自动提取播放器链接。</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <span className="block text-sm font-bold text-[var(--theme-border)]">上传封面</span>
                  <input
                    id={thumbnailInputId}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(event) => selectThumbnailFile(event.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor={thumbnailInputId}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleThumbnailDrop}
                    className="flex min-h-[132px] cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-[var(--theme-border)] bg-white/80 p-5 text-center transition hover:bg-white"
                  >
                    <UploadCloud className="h-8 w-8 text-[var(--theme-primary)]" />
                    <span className="mt-3 text-base font-black text-[var(--theme-border)]">拖入封面图，或点击选择文件</span>
                    <span className="mt-2 text-xs font-bold text-gray-500">JPG / PNG / WebP，最大 8 MB</span>
                    {thumbnailFile && (
                      <span className="mt-3 max-w-full truncate rounded bg-black px-3 py-1 text-xs font-black text-white">
                        {thumbnailFile.name}
                      </span>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold text-[var(--theme-border)]">封面预览</p>
                <div className="grid min-h-[240px] place-items-center overflow-hidden rounded border-2 border-[var(--theme-border)] bg-black">
                  {thumbnailPreview ? (
                    <img src={thumbnailPreview} alt="封面预览" className="h-full max-h-[280px] w-full object-contain" />
                  ) : (
                    <div className="px-5 text-center">
                      <ImageIcon className="mx-auto h-10 w-10 text-white/28" />
                      <p className="mt-3 text-sm font-bold text-white/45">选择封面后这里会显示预览</p>
                    </div>
                  )}
                </div>
                {editingVideoId && !thumbnailFile && (
                  <p className="text-xs text-gray-500">不重新选择文件时，会保留当前封面。</p>
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
                onClick={resetVideoForm}
                className="border-2 border-[var(--theme-border)] bg-white px-6 py-2 font-bold text-[var(--theme-border)] transition-colors hover:bg-gray-100"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={thumbnailUploadBusy}
                className="rounded bg-[var(--theme-accent)] px-6 py-2 font-bold text-white transition-colors hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {thumbnailUploadBusy ? '上传中...' : editingVideoId ? '确认保存' : '确认添加'}
              </button>
            </div>
          </form>
        </RetroCard>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {filteredVideos.length > 0 ? (
          filteredVideos.map((video) => (
            <RetroCard key={video.id} variant="paper" className="h-full">
              <div className="flex h-full flex-col rounded border-2 border-[var(--theme-border)] bg-white p-2 shadow-md">
                <div className="group relative aspect-video overflow-hidden rounded bg-black">
                  {playingVideoId === video.id ? (
                    <iframe
                      src={appendAutoplay(video.url)}
                      title={video.title}
                      className="h-full w-full"
                      scrolling="no"
                      frameBorder="0"
                      allowFullScreen
                      allow="autoplay; fullscreen"
                    />
                  ) : (
                    <>
                      {video.thumbnail ? (
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center bg-[#101010] text-white/55">
                          <Film size={52} />
                        </div>
                      )}

                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setPlayingVideoId(video.id)}
                          className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-4 border-white bg-[var(--theme-primary)] text-white shadow-lg transition-transform group-hover:scale-110"
                        >
                          <Play fill="white" size={32} className="ml-1" />
                        </button>
                      </div>

                      <div className="absolute bottom-2 left-2 flex gap-2">
                        <div className="rounded border border-white bg-[#fb7299] px-2 py-1 text-xs font-bold text-white">bilibili</div>
                        <div className="rounded bg-black/70 px-2 py-1 font-mono text-xs text-white">
                          {CATEGORIES.find((category) => category.id === video.category)?.label || 'Video'}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Film className="shrink-0 text-[var(--theme-primary)]" size={24} />
                    <div>
                      <h4 className="text-lg font-bold leading-tight text-[var(--theme-border)]">{video.title}</h4>
                      <p className="mt-1 text-xs uppercase tracking-wider text-gray-500">Yanfeng Archive</p>
                    </div>
                  </div>

                  {isEditMode && (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditVideo(video)}
                        className="p-1 text-gray-400 transition-colors hover:text-[var(--theme-primary)]"
                        title="编辑视频"
                      >
                        <Edit3 size={19} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(video.id)}
                        className="p-1 text-gray-400 transition-colors hover:text-red-500"
                        title="删除视频"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </RetroCard>
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <div className="mb-4 inline-block rounded-full border-4 border-white/18 bg-white/10 p-6 shadow-[0_0_34px_rgba(255,255,255,0.08)]">
              <Film size={48} className="text-[#c8322a]" />
            </div>
            <p className="text-xl font-bold text-white/82">
              {searchQuery ? `未找到与 "${searchQuery}" 相关的视频` : '该分类下暂无视频'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventGallery;
