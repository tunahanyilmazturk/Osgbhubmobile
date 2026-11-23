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
 * Geçici (mock) giriş servisi.
 * Backend hazır olduğunda bu fonksiyon gerçek API çağrısıyla değiştirilecek.
 */
export async function signIn(input: LoginInput): Promise<{ name: string; role: UserRole }> {
  await new Promise((r) => setTimeout(r, 1200));
  if (input.password === 'hatali123') {
    throw new AuthError('E-posta veya şifre hatalı. Lütfen tekrar deneyin.');
  }
  return { name: input.email.split('@')[0], role: input.role };
}
