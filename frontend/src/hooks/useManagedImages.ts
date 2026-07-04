import { FormEvent, useEffect, useState } from 'react';
import { ManagedImageCategory, ManagedImageItem } from '../types';
import { addManagedImage, deleteManagedImage, fetchManagedImages, updateManagedImage } from '../services/mediaImageService';
import { uploadImageFile } from '../services/uploadService';

const MANAGED_IMAGES_STORAGE_KEY = 'yanfeng-managed-images';
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_UPLOAD_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const createManagedImageId = () => window.crypto?.randomUUID?.() || `media-${Date.now()}`;

export const useManagedImages = () => {
  const [managedImages, setManagedImages] = useState<ManagedImageItem[]>(() => {
    try {
      return JSON.parse(window.localStorage.getItem(MANAGED_IMAGES_STORAGE_KEY) || '[]') as ManagedImageItem[];
    } catch {
      return [];
    }
  });
  const [imageFormCategory, setImageFormCategory] = useState<ManagedImageCategory | null>(null);
  const [imageFormTitle, setImageFormTitle] = useState('');
  const [imageFormUrl, setImageFormUrl] = useState('');
  const [imageUploadFile, setImageUploadFile] = useState<File | null>(null);
  const [imageUploadPreviewUrl, setImageUploadPreviewUrl] = useState('');
  const [imageUploadBusy, setImageUploadBusy] = useState(false);
  const [imageFormError, setImageFormError] = useState('');
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [managedImageNotice, setManagedImageNotice] = useState('');
  const [imageDeleteTarget, setImageDeleteTarget] = useState<ManagedImageItem | null>(null);

  useEffect(() => {
    window.localStorage.setItem(MANAGED_IMAGES_STORAGE_KEY, JSON.stringify(managedImages));
  }, [managedImages]);

  useEffect(() => {
    return () => {
      if (imageUploadPreviewUrl) {
        URL.revokeObjectURL(imageUploadPreviewUrl);
      }
    };
  }, [imageUploadPreviewUrl]);

  useEffect(() => {
    const loadImages = async () => {
      const images = await fetchManagedImages();
      if (images.length > 0) {
        setManagedImages(images);
      }
    };

    void loadImages();
  }, []);

  const resetUploadState = () => {
    setImageUploadFile(null);
    setImageUploadPreviewUrl('');
    setImageUploadBusy(false);
  };

  const resetManagedImageForm = () => {
    setImageFormCategory(null);
    setImageFormTitle('');
    setImageFormUrl('');
    resetUploadState();
    setImageFormError('');
    setEditingImageId(null);
  };

  const openManagedImageForm = (category: ManagedImageCategory) => {
    setImageFormCategory(category);
    setImageFormTitle('');
    setImageFormUrl('');
    resetUploadState();
    setImageFormError('');
    setEditingImageId(null);
    setManagedImageNotice('');
  };

  const openManagedImageEditor = (image: ManagedImageItem) => {
    setImageFormCategory(image.category);
    setImageFormTitle(image.title);
    setImageFormUrl(image.imageUrl);
    resetUploadState();
    setImageFormError('');
    setEditingImageId(image.id);
    setManagedImageNotice('');
  };

  const selectManagedImageFile = (file: File | null) => {
    if (!file) return;

    if (!ALLOWED_UPLOAD_TYPES.has(file.type)) {
      setImageFormError('请上传 JPG、PNG 或 WebP 图片。');
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setImageFormError('图片不能超过 8 MB。');
      return;
    }

    setImageUploadFile(file);
    setImageUploadPreviewUrl(URL.createObjectURL(file));
    setImageFormError('');

    if (!imageFormTitle.trim()) {
      setImageFormTitle(file.name.replace(/\.[^.]+$/, ''));
    }
  };

  const submitManagedImage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!imageFormCategory) return;

    let cleanImageUrl = imageFormUrl.trim();

    if (!cleanImageUrl && !imageUploadFile) {
      setImageFormError('请先拖入或选择一张图片。');
      return;
    }

    if (imageUploadFile) {
      setImageUploadBusy(true);
      const uploadedImage = await uploadImageFile(imageUploadFile, imageFormCategory);
      setImageUploadBusy(false);

      if (!uploadedImage?.url) {
        setImageFormError('图片上传失败，请确认 API 服务正在运行。');
        return;
      }

      cleanImageUrl = uploadedImage.url;
    }

    const imageData = {
      title: imageFormTitle.trim() || (imageFormCategory === 'album' ? '未命名专辑图片' : '未命名画集图片'),
      imageUrl: cleanImageUrl,
      category: imageFormCategory
    };
    const savedImage = editingImageId
      ? await updateManagedImage(editingImageId, imageData)
      : await addManagedImage(imageData);

    setManagedImages((currentImages) => {
      if (editingImageId) {
        const fallbackImage = { id: editingImageId, ...imageData };
        return currentImages.map((image) => (image.id === editingImageId ? savedImage || fallbackImage : image));
      }

      return [
        savedImage || { id: createManagedImageId(), ...imageData },
        ...currentImages
      ];
    });

    resetManagedImageForm();

    if (!savedImage) {
      setManagedImageNotice(editingImageId ? 'API 暂时没有保存成功，已先在当前浏览器更新。' : 'API 暂时没有保存成功，已先保存在当前浏览器。');
    }
  };

  const requestDeleteManagedImage = (image: ManagedImageItem) => {
    setImageDeleteTarget(image);
  };

  const confirmDeleteManagedImage = async () => {
    if (!imageDeleteTarget) return;
    const image = imageDeleteTarget;

    const success = await deleteManagedImage(image.id);
    setManagedImages((currentImages) => currentImages.filter((item) => item.id !== image.id));
    setImageDeleteTarget(null);

    if (!success) {
      setManagedImageNotice('API 暂时没有删除成功，已先从当前浏览器移除。');
    }
  };

  return {
    managedImages,
    imageFormCategory,
    imageFormTitle,
    imageFormUrl,
    imageUploadFile,
    imageUploadPreviewUrl,
    imageUploadBusy,
    imageFormError,
    editingImageId,
    managedImageNotice,
    imageDeleteTarget,
    setImageFormTitle,
    setImageFormUrl,
    selectManagedImageFile,
    setImageDeleteTarget,
    resetManagedImageForm,
    openManagedImageForm,
    openManagedImageEditor,
    submitManagedImage,
    requestDeleteManagedImage,
    confirmDeleteManagedImage
  };
};

export type ManagedImagesController = ReturnType<typeof useManagedImages>;
