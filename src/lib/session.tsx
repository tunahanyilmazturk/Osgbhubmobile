import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { UserRole } from './auth';

export type User = {
  name: string;
  email: string;
  role: UserRole;
};

type SessionValue = {
  user: User | null;
  setUser: (user: User) => void;
  signOut: () => void;
};

const SessionContext = createContext<SessionValue | null>(null);

/**
 * Bellek içi oturum. Gerçek backend geldiğinde token'ı expo-secure-store'da
 * saklayacak şekilde genişletilecek.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const value = useMemo<SessionValue>(
    () => ({ user, setUser: setUserState, signOut: () => setUserState(null) }),
    [user],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession, SessionProvider içinde kullanılmalı');
  return ctx;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Yönetici',
  specialist: 'İSG Uzmanı',
  physician: 'İşyeri Hekimi',
};

export function displayName(name: string) {
  const first = name.split(/[._\s-]/)[0] || name;
  return first.charAt(0).toLocaleUpperCase('tr-TR') + first.slice(1);
}
