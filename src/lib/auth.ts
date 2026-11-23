import { actions, getStateSnapshot } from '@/data/store';

export type UserRole = 'admin' | 'specialist' | 'physician';

export type LoginInput = {
  email: string;
  password: string;
  role: UserRole;
  remember: boolean;
};

export class AuthError extends Error {}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateLogin({ email, password }: Pick<LoginInput, 'email' | 'password'>) {
  const errors: { email?: string; password?: string } = {};
  if (!email.trim()) errors.email = 'E-posta adresi gerekli';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Geçerli bir e-posta adresi girin';
  if (!password) errors.password = 'Şifre gerekli';
  else if (password.length < 6) errors.password = 'Şifre en az 6 karakter olmalı';
  return errors;
}

/**
 * Personel girişi (demo: e-posta/şifre formatı doğruysa kabul edilir).
 * Backend hazır olduğunda gerçek API çağrısıyla değiştirilecek.
 */
export async function signIn(input: LoginInput): Promise<{ name: string; role: UserRole }> {
  await new Promise((r) => setTimeout(r, 900));
  const mail = input.email.trim().toLowerCase();
  if (getStateSnapshot().participants.some((p) => p.account?.email.toLowerCase() === mail)) {
    throw new AuthError('Bu e-posta bir katılımcı hesabına ait. Üstten "Katılımcı" girişini seçin.');
  }
  if (input.password === 'hatali123') {
    throw new AuthError('E-posta veya şifre hatalı. Lütfen tekrar deneyin.');
  }
  return { name: input.email.split('@')[0], role: input.role };
}

/** Katılımcı girişi: yöneticinin oluşturduğu hesapla */
export async function signInParticipant(email: string, password: string) {
  await new Promise((r) => setTimeout(r, 700));
  const p = actions.participantLogin(email, password);
  if (!p) throw new AuthError('E-posta veya şifre hatalı. Hesap bilgilerinizi eğitim sorumlunuzdan alabilirsiniz.');
  return p;
}
