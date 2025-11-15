import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import AdminPanel from './AdminPanel';

const AdminPanelContext = createContext(null);

async function hashString(value) {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function AdminPanelProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const pinHash = process.env.REACT_APP_ADMIN_PIN_HASH
    ? process.env.REACT_APP_ADMIN_PIN_HASH.trim().toLowerCase()
    : null;

  const closePanel = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setIsVerified(false), 200);
  }, []);

  const requestOpen = useCallback(async () => {
    const code = window.prompt('Введите код организатора');
    if (!code) {
      return;
    }

    try {
      if (!pinHash) {
        window.alert(
          'Админ-панель не настроена: переменная окружения REACT_APP_ADMIN_PIN_HASH не задана.'
        );
        return;
      }

      const hashedInput = (await hashString(code.trim())).toLowerCase();
      if (hashedInput !== pinHash) {
        window.alert('Неверный код.');
        return;
      }

      setIsVerified(true);
      setIsOpen(true);
    } catch (error) {
      console.error('Не удалось проверить код:', error);
      window.alert('Не удалось проверить код. Проверьте поддержку crypto.subtle в браузере.');
    }
  }, [pinHash]);

  const contextValue = useMemo(
    () => ({
      requestOpen,
      closePanel,
    }),
    [requestOpen, closePanel]
  );

  return (
    <AdminPanelContext.Provider value={contextValue}>
      {children}
      <AdminPanel isOpen={isOpen && isVerified} onClose={closePanel} />
    </AdminPanelContext.Provider>
  );
}

export function useAdminPanel() {
  const context = useContext(AdminPanelContext);
  if (!context) {
    throw new Error('useAdminPanel должен использоваться внутри AdminPanelProvider');
  }
  return context;
}

