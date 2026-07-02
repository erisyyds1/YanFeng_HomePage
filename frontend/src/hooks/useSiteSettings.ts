import { FormEvent, useEffect, useState } from 'react';
import { JOIN_GROUP_NUMBER } from '../data/siteContent';
import { fetchSiteSettings, updateSiteSettings } from '../services/siteSettingsService';
import { copyText } from '../utils/clipboard';

const MAIN_GROUP_STORAGE_KEY = 'yanfeng-main-group-number';

export const useSiteSettings = () => {
  const [mainGroupNumber, setMainGroupNumber] = useState(() => window.localStorage.getItem(MAIN_GROUP_STORAGE_KEY) || JOIN_GROUP_NUMBER);
  const [joinGroupCopied, setJoinGroupCopied] = useState(false);
  const [groupEditorOpen, setGroupEditorOpen] = useState(false);
  const [groupEditorValue, setGroupEditorValue] = useState(mainGroupNumber);
  const [groupEditorError, setGroupEditorError] = useState('');
  const [groupEditorNotice, setGroupEditorNotice] = useState('');

  useEffect(() => {
    window.localStorage.setItem(MAIN_GROUP_STORAGE_KEY, mainGroupNumber);
  }, [mainGroupNumber]);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await fetchSiteSettings();
      if (settings?.mainGroupNumber) {
        setMainGroupNumber(settings.mainGroupNumber);
      }
    };

    void loadSettings();
  }, []);

  const copyJoinGroupNumber = async () => {
    try {
      await copyText(mainGroupNumber);
      setJoinGroupCopied(true);
      window.setTimeout(() => setJoinGroupCopied(false), 1600);
    } catch (error) {
      console.error('Failed to copy join group number:', error);
    }
  };

  const openGroupEditor = () => {
    setGroupEditorValue(mainGroupNumber);
    setGroupEditorError('');
    setGroupEditorNotice('');
    setGroupEditorOpen(true);
  };

  const submitGroupNumber = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanGroupNumber = groupEditorValue.trim();
    if (!cleanGroupNumber) {
      setGroupEditorError('群号不能为空。');
      return;
    }

    setGroupEditorError('');
    setGroupEditorNotice('');
    setMainGroupNumber(cleanGroupNumber);
    const savedSettings = await updateSiteSettings({ mainGroupNumber: cleanGroupNumber });
    if (savedSettings?.mainGroupNumber) {
      setMainGroupNumber(savedSettings.mainGroupNumber);
      setGroupEditorOpen(false);
      return;
    }

    setGroupEditorNotice('API 暂时没有保存成功，已先保存在当前浏览器。');
  };

  return {
    mainGroupNumber,
    joinGroupCopied,
    groupEditorOpen,
    groupEditorValue,
    groupEditorError,
    groupEditorNotice,
    setGroupEditorOpen,
    setGroupEditorValue,
    setGroupEditorError,
    setGroupEditorNotice,
    copyJoinGroupNumber,
    openGroupEditor,
    submitGroupNumber
  };
};
