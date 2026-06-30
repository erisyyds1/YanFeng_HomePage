import React, { useState } from 'react';
import { Play, Film, Link as LinkIcon, Image as ImageIcon, Trash2, Search, Filter } from 'lucide-react';
import { VideoContent, AppTheme, VideoCategory } from '../types';
import RetroCard from './RetroCard';

interface EventGalleryProps {
  currentTheme: AppTheme;
}

import { fetchVideos, addVideo, deleteVideo } from '../services/videoService';

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

const EventGallery: React.FC<EventGalleryProps> = ({ currentTheme }) => {
  const [videos, setVideos] = useState<VideoContent[]>([]);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  // Filter State
  const [activeCategory, setActiveCategory] = useState<VideoCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [bilibiliLink, setBilibiliLink] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<VideoCategory>('daily'); // Default upload category
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [formError, setFormError] = useState('');
  
  const [showForm, setShowForm] = useState(false);

  // Fetch videos from backend on mount
  React.useEffect(() => {
    const loadVideos = async () => {
        const data = await fetchVideos();
        setVideos(data);
    };
    loadVideos();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('确定要删除这个视频吗？')) {
      const success = await deleteVideo(id);
      if (success) {
          setVideos(videos.filter(v => v.id !== id));
      } else {
          alert('删除失败，请稍后重试');
      }
    }
  };

  const handleBilibiliSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanUrl = normalizeBilibiliPlayerUrl(bilibiliLink);
    if (!videoTitle.trim() || !cleanUrl) {
      setFormError('请填写标题，并粘贴 Bilibili 播放器链接或嵌入代码。');
      return;
    }

    const cleanThumbnailUrl = thumbnailUrl.trim();
    if (cleanThumbnailUrl) {
      try {
        new URL(cleanThumbnailUrl);
      } catch {
        setFormError('封面图片需要是完整 URL，例如 https://example.com/cover.jpg');
        return;
      }
    }

    const newVideoData: Omit<VideoContent, 'id'> = {
      title: videoTitle.trim(),
      url: cleanUrl,
      type: 'bilibili',
      thumbnail: cleanThumbnailUrl,
      category: uploadCategory
    };

    const savedVideo = await addVideo(newVideoData);

    if (savedVideo) {
        setVideos([savedVideo, ...videos]);
        setBilibiliLink('');
        setVideoTitle('');
        setThumbnailUrl('');
        setShowForm(false);
        setActiveCategory(uploadCategory); 
    } else {
        setFormError('添加失败，请检查 API 服务是否启动。');
    }
  };

  // Filter the videos
  const filteredVideos = videos.filter(video => {
    const matchesCategory = activeCategory === 'all' || video.category === activeCategory;
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const CATEGORIES: { id: VideoCategory | 'all', label: string, icon?: string }[] = [
    { id: 'all', label: '全部', icon: '🔴' },
    { id: 'winter', label: '冬日祭', icon: '❄️' },
    { id: 'anniversary', label: '社庆', icon: '🎉' },
    { id: 'gma', label: 'GMA', icon: '🏆' },
    { id: 'daily', label: '日常', icon: '📹' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      
      {/* Header Area */}
      <div className="flex flex-col gap-6 border-b-4 border-dashed border-[var(--theme-border)] pb-8">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
           <div>
              <h2 className="text-4xl font-retro text-[var(--theme-primary)]">活动录像</h2>
              <p className={`${currentTheme === AppTheme.GMA ? 'text-black' : 'text-[var(--theme-accent)]'} mt-2 font-bold`}>SHOWCASE & MEMORIES</p>
           </div>
        </div>

        {/* Navigation & Search Bar Container */}
        <div className="mt-4 bg-[var(--theme-secondary)] border-4 border-[var(--theme-border)] rounded-xl p-2 shadow-[6px_6px_0px_var(--theme-border)] flex flex-col md:flex-row gap-4 items-center">
             
             {/* Category Tabs (Pills) */}
             <div className="flex flex-wrap gap-2 flex-1 justify-center md:justify-start">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`
                      px-4 py-2 rounded-lg font-bold text-sm transition-all border-2
                      ${activeCategory === cat.id 
                        ? 'bg-[var(--theme-primary)] text-white border-[var(--theme-border)] shadow-[2px_2px_0px_var(--theme-border)] -translate-y-0.5' 
                        : 'bg-white text-[var(--theme-border)] border-transparent hover:bg-gray-100'}
                    `}
                  >
                     <span className="mr-2">{cat.icon}</span>
                     {cat.label}
                  </button>
                ))}
             </div>

             {/* Search Input */}
             <div className="relative w-full md:w-64">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                   <Search size={18} />
                </div>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索视频..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border-2 border-[var(--theme-border)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]/20 bg-white text-black"
                />
             </div>
        </div>
      </div>

      {/* Add Video Form */}
      {showForm && (
        <RetroCard variant="ticket" className="mb-8">
          <form onSubmit={handleBilibiliSubmit} className="space-y-4">
            <h3 className="text-xl font-bold text-[var(--theme-primary)] mb-4">添加 Bilibili 外链视频</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[var(--theme-border)]">视频标题</label>
                <div className="flex items-center border-2 border-[var(--theme-border)] rounded bg-white p-2">
                  <Film size={18} className="text-gray-400 mr-2" />
                  <input 
                    type="text" 
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="输入视频标题..."
                    className="w-full outline-none bg-transparent text-black"
                    required
                  />
                </div>
              </div>

               <div className="space-y-2">
                <label className="block text-sm font-bold text-[var(--theme-border)]">所属分类</label>
                <div className="flex items-center border-2 border-[var(--theme-border)] rounded bg-white p-2 relative">
                  <Filter size={18} className="text-gray-400 mr-2" />
                  <select 
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as VideoCategory)}
                    className="w-full outline-none bg-transparent appearance-none cursor-pointer text-black"
                  >
                    {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-[var(--theme-border)]">Bilibili 链接 (Embed URL)</label>
                <div className="flex items-center border-2 border-[var(--theme-border)] rounded bg-white p-2">
                  <LinkIcon size={18} className="text-gray-400 mr-2" />
                  <input 
                    type="text" 
                    value={bilibiliLink}
                    onChange={(e) => setBilibiliLink(e.target.value)}
                    placeholder='例如：<iframe src="//player.bilibili.com/..." ...></iframe>'
                    className="w-full outline-none bg-transparent text-black"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">提示：直接粘贴 B站分享中的"嵌入代码"即可，系统会自动提取链接</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-[var(--theme-border)]">封面图片 URL（可选）</label>
                <div className="flex items-center border-2 border-[var(--theme-border)] rounded bg-white p-2">
                  <ImageIcon size={18} className="text-gray-400 mr-2" />
                  <input 
                    type="url" 
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://example.com/cover.jpg"
                    className="w-full outline-none bg-transparent text-black"
                  />
                </div>
                {thumbnailUrl && (
                  <div className="mt-2 text-xs text-gray-500">
                    <p className="mb-1">预览：</p>
                    <img src={thumbnailUrl} alt="Cover Preview" className="h-24 rounded border border-gray-200 object-cover" />
                  </div>
                )}
              </div>
            </div>

            {formError && (
              <p className="text-sm font-bold text-red-600 bg-red-50 border-2 border-red-200 rounded px-3 py-2">
                {formError}
              </p>
            )}

            <div className="flex justify-end pt-2">
              <button 
                type="submit"
                className="bg-[var(--theme-accent)] text-white px-6 py-2 rounded font-bold hover:bg-opacity-90 transition-colors"
              >
                确认添加
              </button>
            </div>
          </form>
        </RetroCard>
      )}

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredVideos.length > 0 ? (
          filteredVideos.map((video) => (
            <RetroCard key={video.id} variant="paper" className="h-full">
              <div className="bg-white p-2 border-2 border-[var(--theme-border)] rounded shadow-md h-full flex flex-col">
                  {/* ... same video card content ... */}
                  <div className="relative aspect-video bg-black rounded overflow-hidden group">
                      {playingVideoId === video.id ? (
                            <iframe 
                              src={appendAutoplay(video.url)} 
                              title={video.title}
                              className="w-full h-full" 
                              scrolling="no" 
                              frameBorder="0" 
                              allowFullScreen 
                              allow="autoplay; fullscreen"
                            ></iframe>
                      ) : (
                          <>
                              {/* Thumbnail Overlay */}
                              <img 
                                src={video.thumbnail || '/default_cover.png'} 
                                alt={video.title} 
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = '/default_cover.png';
                                }}
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                              />
                              
                              {/* Play Button */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                  <button 
                                      onClick={() => setPlayingVideoId(video.id)}
                                      className="w-16 h-16 bg-[var(--theme-primary)] rounded-full flex items-center justify-center border-4 border-white text-white shadow-lg transform group-hover:scale-110 transition-transform cursor-pointer"
                                  >
                                      <Play fill="white" size={32} className="ml-1" />
                                  </button>
                              </div>
                              
                              {/* Badges */}
                              <div className="absolute bottom-2 left-2 flex gap-2">
                                  <div className="bg-[#fb7299] text-white px-2 py-1 text-xs rounded font-bold border border-white">
                                    bilibili
                                  </div>
                                <div className="bg-black/70 text-white px-2 py-1 text-xs rounded font-mono">
                                  {CATEGORIES.find(c => c.id === video.category)?.label || 'Video'}
                                </div>
                              </div>
                          </>
                      )}
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Film className="text-[var(--theme-primary)] flex-shrink-0" size={24} />
                        <div>
                            <h4 className="font-bold text-lg leading-tight text-[var(--theme-border)]">{video.title}</h4>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Yanfeng Archive</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleDelete(video.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="删除视频"
                      >
                        <Trash2 size={20} />
                      </button>
                  </div>
              </div>
            </RetroCard>
          ))
        ) : (
          <div className="col-span-full py-20 text-center opacity-50">
             <div className="inline-block p-6 rounded-full bg-[var(--theme-secondary)] border-4 border-[var(--theme-border)] mb-4">
               <Film size={48} className="text-[var(--theme-primary)]" />
             </div>
             <p className="font-bold text-xl text-[var(--theme-border)]">
               {searchQuery ? `未找到与 "${searchQuery}" 相关的视频` : '该分类下暂无视频'}
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventGallery;
