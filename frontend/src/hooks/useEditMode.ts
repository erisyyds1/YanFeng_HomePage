import { FormEvent, useEffect, useState } from 'react';
import { clearAdminSession, requestAdminSession } from '../services/adminAuth';

const ADMIN_PASSWORD = '18522';
const EDIT_MODE_STORAGE_KEY = 'yanfeng-edit-mode';

export const useEditMode = () => {
  const [isEditMode, setIsEditMode] = useState(() => window.sessionStorage.getItem(EDIT_MODE_STORAGE_KEY) === 'true');
  const [adminAccessOpen, setAdminAccessOpen] = useState(false);
  const [adminAccessValue, setAdminAccessValue] = useState('');

  useEffect(() => {
    window.sessionStorage.setItem(EDIT_MODE_STORAGE_KEY, String(isEditMode));
  }, [isEditMode]);

  const openAdminAccess = () => {
    setAdminAccessValue('');
    setAdminAccessOpen(true);
  };

  const closeAdminAccess = () => {
    setAdminAccessOpen(false);
    setAdminAccessValue('');
  };

  const submitAdminAccess = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = adminAccessValue.trim();
    closeAdminAccess();

    const result = await requestAdminSession(message);
    const devFallbackAccepted = result === 'unavailable' && import.meta.env.DEV && message === ADMIN_PASSWORD;

    if (result === 'accepted' || devFallbackAccepted) {
      setIsEditMode(true);
    }
  };

  const exitEditMode = () => {
    clearAdminSession();
    setIsEditMode(false);
  };

  return {
    isEditMode,
    adminAccessOpen,
    adminAccessValue,
    setAdminAccessOpen,
    setAdminAccessValue,
    openAdminAccess,
    closeAdminAccess,
    submitAdminAccess,
    exitEditMode
  };
};
