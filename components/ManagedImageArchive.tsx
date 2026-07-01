import React from 'react';
import { Edit3, Image as ImageIcon, Plus, Trash2, UploadCloud, X } from 'lucide-react';
import type { ManagedImageCategory } from '../types';
import type { MediaEntry } from './MediaHub';
import type { ManagedImagesController } from '../hooks/useManagedImages';
import RetroCard from './RetroCard';

interface ManagedImageArchiveProps {
  category: ManagedImageCategory;
  activeMedia: MediaEntry;
  isEditMode: boolean;
  imageManager: ManagedImagesController;
}

const ManagedImageArchive: React.FC<ManagedImageArchiveProps> = ({ category, activeMedia, isEditMode, imageManager }) => {
  const MediaIcon = activeMedia.icon;
  const images = imageManager.managedImages.filter((image) => image.category === category);
  const itemLabel = category === 'album' ? '专辑图片' : '图集图片';
  const emptyText = category === 'album' ? '暂时还没有专辑图片' : '暂时还没有图集图片';
  const imageFormActive = imageManager.imageFormCategory === category;
  const previewUrl = imageManager.imageUploadPreviewUrl || imageManager.imageFormUrl;
  const fileInputId = `managed-image-upload-${category}`;

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    imageManager.selectManagedImageFile(event.dataTransfer.files[0] || null);
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col gap-6 border-b-4 border-dashed border-[var(--theme-border)] pb-8">
        <div className="flex flex-col items-end justify-between gap-4 md:flex-row">
          <div>
            <h2 className="font-retro text-4xl text-[var(--theme-primary)]">{activeMedia.title}</h2>
            <p className="mt-2 font-bold text-[var(--theme-accent)]">{activeMedia.label} ARCHIVE</p>
          </div>

          {isEditMode && (
            <button
              type="button"
              onClick={imageFormActive ? imageManager.resetManagedImageForm : () => imageManager.openManagedImageForm(category)}
              className="flex items-center gap-2 rounded-lg bg-[var(--theme-primary)] px-4 py-3 text-sm font-black text-white shadow-[4px_4px_0px_var(--theme-border)] transition hover:-translate-y-0.5"
            >
              {imageFormActive ? <X size={18} /> : <Plus size={18} />}
              {imageFormActive ? '收起表单' : `添加${itemLabel}`}
            </button>
          )}
        </div>
      </div>

      {imageManager.managedImageNotice && (
        <p className="border border-[#c8322a]/45 bg-[#c8322a]/12 px-4 py-3 text-sm font-bold text-white/72">
          {imageManager.managedImageNotice}
        </p>
      )}

      {isEditMode && imageFormActive && (
        <RetroCard variant="ticket" className="mb-8">
          <form onSubmit={imageManager.submitManagedImage} className="space-y-4">
            <h3 className="mb-4 text-xl font-bold text-[var(--theme-primary)]">
              {imageManager.editingImageId ? `编辑${itemLabel}` : `添加${itemLabel}`}
            </h3>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[var(--theme-border)]">图片标题</label>
                  <div className="flex items-center rounded border-2 border-[var(--theme-border)] bg-white p-2">
                    <Edit3 size={18} className="mr-2 text-gray-400" />
                    <input
                      type="text"
                      value={imageManager.imageFormTitle}
                      onChange={(event) => imageManager.setImageFormTitle(event.target.value)}
                      placeholder={`输入${itemLabel}标题...`}
                      className="w-full bg-transparent text-black outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="block text-sm font-bold text-[var(--theme-border)]">上传图片</span>
                  <input
                    id={fileInputId}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(event) => imageManager.selectManagedImageFile(event.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor={fileInputId}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleDrop}
                    className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-[var(--theme-border)] bg-white/80 p-5 text-center transition hover:bg-white"
                  >
                    <UploadCloud className="h-9 w-9 text-[var(--theme-primary)]" />
                    <span className="mt-3 text-base font-black text-[var(--theme-border)]">
                      拖入图片，或点击选择文件
                    </span>
                    <span className="mt-2 text-xs font-bold text-gray-500">JPG / PNG / WebP，最大 8 MB</span>
                    {imageManager.imageUploadFile && (
                      <span className="mt-3 max-w-full truncate rounded bg-black px-3 py-1 text-xs font-black text-white">
                        {imageManager.imageUploadFile.name}
                      </span>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold text-[var(--theme-border)]">预览</p>
                <div className="grid min-h-[240px] place-items-center overflow-hidden rounded border-2 border-[var(--theme-border)] bg-black">
                  {previewUrl ? (
                    <img src={previewUrl} alt="图片预览" className="h-full max-h-[280px] w-full object-contain" />
                  ) : (
                    <div className="px-5 text-center">
                      <ImageIcon className="mx-auto h-10 w-10 text-white/28" />
                      <p className="mt-3 text-sm font-bold text-white/45">选择图片后这里会显示预览</p>
                    </div>
                  )}
                </div>
                {imageManager.editingImageId && !imageManager.imageUploadFile && (
                  <p className="text-xs text-gray-500">不重新选择文件时，会保留当前图片。</p>
                )}
              </div>
            </div>

            {imageManager.imageFormError && (
              <p className="rounded border-2 border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-600">
                {imageManager.imageFormError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={imageManager.resetManagedImageForm}
                className="border-2 border-[var(--theme-border)] bg-white px-6 py-2 font-bold text-[var(--theme-border)] transition-colors hover:bg-gray-100"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={imageManager.imageUploadBusy}
                className="rounded bg-[var(--theme-accent)] px-6 py-2 font-bold text-white transition-colors hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {imageManager.imageUploadBusy ? '上传中...' : imageManager.editingImageId ? '确认保存' : '确认添加'}
              </button>
            </div>
          </form>
        </RetroCard>
      )}

      {images.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {images.map((image) => (
            <RetroCard key={image.id} variant="paper" className="h-full">
              <div className="flex h-full flex-col rounded border-2 border-[var(--theme-border)] bg-white p-2 shadow-md">
                <div className="aspect-video overflow-hidden rounded bg-black">
                  <img
                    src={image.imageUrl}
                    alt={image.title}
                    className="h-full w-full object-contain opacity-90 transition duration-500 hover:opacity-100"
                  />
                </div>
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <ImageIcon className="shrink-0 text-[var(--theme-primary)]" size={24} />
                    <div>
                      <h4 className="text-lg font-bold leading-tight text-[var(--theme-border)]">{image.title}</h4>
                      <p className="mt-1 text-xs uppercase tracking-wider text-gray-500">Yanfeng Image Archive</p>
                    </div>
                  </div>

                  {isEditMode && (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => imageManager.openManagedImageEditor(image)}
                        className="p-1 text-gray-400 transition-colors hover:text-[var(--theme-primary)]"
                        title="编辑图片"
                      >
                        <Edit3 size={19} />
                      </button>
                      <button
                        type="button"
                        onClick={() => imageManager.requestDeleteManagedImage(image)}
                        className="p-1 text-gray-400 transition-colors hover:text-red-500"
                        title="删除图片"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </RetroCard>
          ))}
        </div>
      ) : (
        <div className="col-span-full py-20 text-center">
          <div className="mb-4 inline-block rounded-full border-4 border-white/18 bg-white/10 p-6 shadow-[0_0_34px_rgba(255,255,255,0.08)]">
            <MediaIcon size={48} className="text-[#c8322a]" />
          </div>
          <p className="text-xl font-bold text-white/82">{emptyText}</p>
          <p className="mt-3 text-sm font-bold text-white/45">
            {isEditMode ? '点击右上角添加第一张图片。' : '内容整理中'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ManagedImageArchive;
