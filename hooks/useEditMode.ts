import { FormEvent, useEffect, useState } from 'react';

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

  const submitAdminAccess = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (adminAccessValue.trim() === ADMIN_PASSWORD) {
      setIsEditMode(true);
    }

    closeAdminAccess();
  };

  const exitEditMode = () => {
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
