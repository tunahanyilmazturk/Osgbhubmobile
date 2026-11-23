import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { UserRole } from './auth';

/** Personel rolleri + online eğitim portalını kullanan katılımcı */
export type SessionRole = UserRole | 'participant';

export type User = {
  name: string;
  email: string;
  role: SessionRole;
  /** Katılımcı oturumlarında ilgili kayıt */
  participantId?: string;
};

type SessionValue = {
  user: User | null;
  /** Kayıtlı oturum yüklendi mi */
  ready: boolean;
  setUser: (user: User, remember?: boolean) => void;
  signOut: () => void;
};

const SESSION_KEY = 'osgbhub:session:v1';
const SessionContext = createContext<SessionValue | null>(null);

/**
 * Oturum. "Beni hatırla" seçiliyse cihazda saklanır (web: localStorage).
 * Gerçek sistemde burada sunucudan alınan token saklanacak.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY)
      .then((raw) => {
        if (raw) setUserState(JSON.parse(raw));
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      user,
      ready,
      setUser: (u, remember = true) => {
        setUserState(u);
        if (remember) AsyncStorage.setItem(SESSION_KEY, JSON.stringify(u)).catch(() => {});
        else AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
      },
      signOut: () => {
        setUserState(null);
        AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
      },
    }),
    [user, ready],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession, SessionProvider içinde kullanılmalı');
  return ctx;
}

export const ROLE_LABELS: Record<SessionRole, string> = {
  admin: 'Yönetici',
  specialist: 'İSG Uzmanı',
  physician: 'İşyeri Hekimi',
  participant: 'Katılımcı',
};

export function displayName(name: string) {
  const first = name.split(/[._\s-]/)[0] || name;
  return first.charAt(0).toLocaleUpperCase('tr-TR') + first.slice(1);
}
