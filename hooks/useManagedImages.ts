import { FormEvent, useEffect, useState } from 'react';
import { ManagedImageCategory, ManagedImageItem } from '../types';
import { addManagedImage, deleteManagedImage, fetchManagedImages, updateManagedImage } from '../services/mediaImageService';

const MANAGED_IMAGES_STORAGE_KEY = 'yanfeng-managed-images';

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
  const [imageFormError, setImageFormError] = useState('');
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [managedImageNotice, setManagedImageNotice] = useState('');
  const [imageDeleteTarget, setImageDeleteTarget] = useState<ManagedImageItem | null>(null);

  useEffect(() => {
    window.localStorage.setItem(MANAGED_IMAGES_STORAGE_KEY, JSON.stringify(managedImages));
  }, [managedImages]);

  useEffect(() => {
    const loadImages = async () => {
      const images = await fetchManagedImages();
      if (images.length > 0) {
        setManagedImages(images);
      }
    };

    void loadImages();
  }, []);

  const resetManagedImageForm = () => {
    setImageFormCategory(null);
    setImageFormTitle('');
    setImageFormUrl('');
    setImageFormError('');
    setEditingImageId(null);
  };

  const openManagedImageForm = (category: ManagedImageCategory) => {
    setImageFormCategory(category);
    setImageFormTitle('');
    setImageFormUrl('');
    setImageFormError('');
    setEditingImageId(null);
    setManagedImageNotice('');
  };

  const openManagedImageEditor = (image: ManagedImageItem) => {
    setImageFormCategory(image.category);
    setImageFormTitle(image.title);
    setImageFormUrl(image.imageUrl);
    setImageFormError('');
    setEditingImageId(image.id);
    setManagedImageNotice('');
  };

  const submitManagedImage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!imageFormCategory) return;

    const cleanImageUrl = imageFormUrl.trim();
    if (!cleanImageUrl) {
      setImageFormError('图片地址不能为空。');
      return;
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
    imageFormError,
    editingImageId,
    managedImageNotice,
    imageDeleteTarget,
    setImageFormTitle,
    setImageFormUrl,
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
