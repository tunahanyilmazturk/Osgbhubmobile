import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo, useSyncExternalStore } from 'react';

import { addMonths, daysFromNow, daysUntil, slugify } from '@/lib/format';

import * as seed from './seed';
import type {
  Assignment,
  Certificate,
  Enrollment,
  ExamKind,
  ExamResult,
  Firm,
  HazardClass,
  KatipLog,
  Lesson,
  Participant,
  Question,
  SignDocument,
  TeamMember,
  Training,
} from './types';

export type State = {
  firms: Firm[];
  team: TeamMember[];
  participants: Participant[];
  trainings: Training[];
  assignments: Assignment[];
  certificates: Certificate[];
  documents: SignDocument[];
  katipLogs: KatipLog[];
  enrollments: Enrollment[];
  katipSyncing: boolean;
};

/** Başlangıç (demo) verisinin bağımsız bir kopyası */
function seedState(): State {
  return JSON.parse(
    JSON.stringify({
      firms: seed.firms,
      team: seed.team,
      participants: seed.participants,
      trainings: seed.trainings,
      assignments: seed.assignments,
      certificates: seed.certificates,
      documents: seed.documents,
      katipLogs: seed.katipLogs,
      enrollments: seed.enrollments,
      katipSyncing: false,
    }),
  );
}

let state: State = seedState();

const listeners = new Set<() => void>();
function setState(updater: (s: State) => Partial<State>) {
  state = { ...state, ...updater(state) };
  listeners.forEach((l) => l());
  schedulePersist();
}

/* ------------------------------------------------------------------ */
/* Cihazda kalıcı saklama (web: localStorage, telefon: AsyncStorage)   */
/* ------------------------------------------------------------------ */

/** Veri yapısı değişince artırılır; eski kayıtlar yok sayılıp demo veriyle başlanır */
const STORAGE_KEY = 'osgbhub:data:v3';
let hydrated = false;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePersist() {
  if (!hydrated) return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    const { katipSyncing: _ignored, ...data } = state;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
  }, 400);
}

/** Uygulama açılışında kayıtlı veriyi yükler */
export async function hydrateStore() {
  if (hydrated) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) state = { ...seedState(), ...JSON.parse(raw), katipSyncing: false };
  } catch {
    // Bozuk kayıt: demo veriyle devam
  }
  hydrated = true;
  listeners.forEach((l) => l());
}

export function useHydrated() {
  return useSyncExternalStore(subscribe, () => hydrated, () => hydrated);
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/**
 * Store'un tamamını okur. Dönen nesne yalnızca bir aksiyon çalışınca değişir,
 * bu yüzden türetilmiş hesaplamalar `useMemo(() => ..., [s])` ile yapılmalı.
 */
export function useAppState(): State {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
const getSnapshot = () => state;
/** React dışı okuma (ör. giriş kontrolü) */
export const getStateSnapshot = () => state;

/* ------------------------------------------------------------------ */
/* Aksiyonlar — iş akışı:                                              */
/* atama → tamamla → sertifika onayı → e-imza → geçerli sertifika      */
/* ------------------------------------------------------------------ */

let idSeq = 1;
const newId = (p: string) => `${p}${Date.now().toString(36)}${idSeq++}`;
/** Sertifika numarası: kayıtlı en büyük numaradan devam eder (yeniden açılışta çakışmaz) */
function nextCertSeq() {
  return 1 + Math.max(9000, ...state.certificates.map((c) => Number(c.no.split('-').pop()) || 0));
}

function updateEnrollment(id: string, fn: (e: Enrollment) => Partial<Enrollment>) {
  setState((s) => ({ enrollments: s.enrollments.map((e) => (e.id === id ? { ...e, ...fn(e) } : e)) }));
}

function updateContent(trainingId: string, fn: (c: Training['content']) => Partial<Training['content']>) {
  setState((s) => ({
    trainings: s.trainings.map((t) => (t.id === trainingId ? { ...t, content: { ...t.content, ...fn(t.content) } } : t)),
  }));
}

function move<T extends { id: string }>(arr: T[], id: string, dir: -1 | 1) {
  const i = arr.findIndex((x) => x.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= arr.length) return arr;
  const copy = [...arr];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

/** Okunaklı geçici şifre: karışabilecek karakterler (0/O, 1/l) yok */
function tempPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export type AccountResult = { email: string; password: string } | { error: string } | null;

export function suggestEmail(name: string, firmName: string) {
  return `${slugify(name)}@${slugify(firmName.split(' ')[0], '')}.com.tr`;
}

export const actions = {
  createAssignment(input: Omit<Assignment, 'id' | 'status'>) {
    const online = input.delivery === 'online';
    const a: Assignment = { ...input, id: newId('a'), status: online ? 'in_progress' : 'planned' };
    const enrollments: Enrollment[] = online
      ? input.participantIds.map((pid) => ({
          id: newId('e'),
          assignmentId: a.id,
          participantId: pid,
          trainingId: a.trainingId,
          status: 'not_started',
          finalAttempts: [],
          completedLessons: [],
          lessonProgress: {},
          seconds: 0,
          extraAttempts: 0,
        }))
      : [];
    setState((s) => ({ assignments: [a, ...s.assignments], enrollments: [...enrollments, ...s.enrollments] }));
    return a.id;
  },

  /* ---------------- Katılımcı hesapları ---------------- */

  /** Giriş hesabı oluşturur; e-posta verilmezse ad.soyad@firma.com.tr önerilir */
  createAccount(participantId: string, email?: string): AccountResult {
    const p = state.participants.find((x) => x.id === participantId);
    if (!p) return null;
    const firm = state.firms.find((f) => f.id === p.firmId);
    const taken = new Set(state.participants.map((x) => x.account?.email.toLowerCase()).filter(Boolean));
    let mail = (email ?? suggestEmail(p.name, firm?.name ?? 'firma')).trim().toLowerCase();
    if (!email) for (let i = 2; taken.has(mail); i++) mail = mail.replace(/(\d*)@/, `${i}@`);
    else if (taken.has(mail) && p.account?.email.toLowerCase() !== mail) return { error: 'Bu e-posta başka bir katılımcıda kayıtlı.' };
    const account = { email: mail, password: tempPassword(), createdAt: daysFromNow(0), mustChangePassword: true };
    setState((s) => ({ participants: s.participants.map((x) => (x.id === participantId ? { ...x, account } : x)) }));
    return { email: account.email, password: account.password };
  },

  /** Hesabı olmayan katılımcılara toplu hesap oluşturur */
  createAccounts(participantIds: string[]) {
    const created: { participantId: string; email: string; password: string }[] = [];
    for (const id of participantIds) {
      const p = state.participants.find((x) => x.id === id);
      if (!p || p.account) continue;
      const r = actions.createAccount(id);
      if (r && 'password' in r) created.push({ participantId: id, email: r.email, password: r.password });
    }
    return created;
  },

  resetPassword(participantId: string) {
    const password = tempPassword();
    setState((s) => ({
      participants: s.participants.map((x) =>
        x.id === participantId && x.account ? { ...x, account: { ...x.account, password, mustChangePassword: true } } : x,
      ),
    }));
    return password;
  },

  removeAccount(participantId: string) {
    setState((s) => ({
      participants: s.participants.map((x) => (x.id === participantId ? { ...x, account: undefined } : x)),
    }));
  },

  changePassword(participantId: string, password: string) {
    setState((s) => ({
      participants: s.participants.map((x) =>
        x.id === participantId && x.account ? { ...x, account: { ...x.account, password, mustChangePassword: false } } : x,
      ),
    }));
  },

  /** Katılımcı girişi. Demo: şifre cihazda kontrol edilir; gerçek sistemde sunucuda yapılır. */
  participantLogin(email: string, password: string) {
    const mail = email.trim().toLowerCase();
    const p = state.participants.find((x) => x.account?.email.toLowerCase() === mail);
    if (!p || p.account!.password !== password) return null;
    setState((s) => ({
      participants: s.participants.map((x) =>
        x.id === p.id ? { ...x, account: { ...x.account!, lastLogin: new Date().toISOString() } } : x,
      ),
    }));
    return p;
  },

  /* ---------------- Online eğitim ilerlemesi ---------------- */

  /** Slayt/video ilerlemesini kaydeder */
  saveLessonProgress(enrollmentId: string, lessonId: string, progress: { slide?: number; watched?: number }) {
    updateEnrollment(enrollmentId, (e) => {
      const prev = e.lessonProgress[lessonId] ?? {};
      return {
        status: e.status === 'not_started' ? 'in_progress' : e.status,
        startedAt: e.startedAt ?? new Date().toISOString(),
        lessonProgress: {
          ...e.lessonProgress,
          [lessonId]: {
            slide: Math.max(prev.slide ?? 0, progress.slide ?? 0),
            watched: Math.max(prev.watched ?? 0, progress.watched ?? 0),
          },
        },
      };
    });
  },

  completeLesson(enrollmentId: string, lessonId: string) {
    updateEnrollment(enrollmentId, (e) => ({
      status: e.status === 'not_started' ? 'in_progress' : e.status,
      completedLessons: e.completedLessons.includes(lessonId) ? e.completedLessons : [...e.completedLessons, lessonId],
    }));
  },

  addStudyTime(enrollmentId: string, seconds: number) {
    if (seconds < 1) return;
    updateEnrollment(enrollmentId, (e) => ({ seconds: e.seconds + Math.round(seconds) }));
  },

  /**
   * Sınavı puanlar. Final geçilirse kayıt tamamlanır ve sertifika onaya düşer.
   * Demo: puanlama cihazda yapılır; gerçek sistemde cevap anahtarı sunucuda tutulmalıdır.
   */
  submitExam(enrollmentId: string, kind: ExamKind, answers: number[], seconds: number) {
    const e = state.enrollments.find((x) => x.id === enrollmentId);
    if (!e) return null;
    const t = state.trainings.find((x) => x.id === e.trainingId)!;
    const exam = kind === 'pre' ? t.content.preTest : t.content.finalExam;
    const correct = exam.questions.filter((q, i) => answers[i] === q.answer).length;
    const score = exam.questions.length ? Math.round((correct / exam.questions.length) * 100) : 100;
    const passed = kind === 'final' ? score >= t.content.passScore : undefined;
    const r: ExamResult = {
      score,
      answers,
      questionIds: exam.questions.map((q) => q.id),
      at: new Date().toISOString(),
      passed,
      seconds: Math.round(seconds),
    };

    if (kind === 'pre') {
      updateEnrollment(enrollmentId, (x) => ({
        preTest: r,
        status: 'in_progress',
        startedAt: x.startedAt ?? r.at,
        seconds: x.seconds + r.seconds,
      }));
      return { ...r, correct, total: exam.questions.length, attemptsLeft: undefined as number | undefined };
    }

    const attempts = [...e.finalAttempts, r];
    const limit = t.content.maxAttempts + e.extraAttempts;
    const status = passed ? 'completed' : attempts.length >= limit ? 'failed' : 'in_progress';
    updateEnrollment(enrollmentId, (x) => ({
      finalAttempts: attempts,
      status,
      completedAt: passed ? r.at : x.completedAt,
      seconds: x.seconds + r.seconds,
    }));

    if (passed) {
      const a = state.assignments.find((x) => x.id === e.assignmentId)!;
      const issue = daysFromNow(0);
      const cert: Certificate = {
        id: newId('c'),
        no: `OSGB-${issue.slice(0, 4)}-${nextCertSeq()}`,
        participantId: e.participantId,
        trainingId: e.trainingId,
        firmId: a.firmId,
        assignmentId: a.id,
        enrollmentId: e.id,
        trainerId: a.trainerId,
        issueDate: issue,
        expiryDate: addMonths(issue, t.validityMonths),
        status: 'pending',
      };
      setState((s) => ({ certificates: [cert, ...s.certificates] }));
      // Atamadaki herkes bitirdiyse atamayı tamamlandı yap
      const all = state.enrollments.filter((x) => x.assignmentId === a.id);
      if (all.every((x) => x.status === 'completed')) {
        setState((s) => ({ assignments: s.assignments.map((x) => (x.id === a.id ? { ...x, status: 'completed' } : x)) }));
      }
    }
    return { ...r, correct, total: exam.questions.length, attemptsLeft: Math.max(0, limit - attempts.length) };
  },

  /** Yönetici: final sınavı için ek hak tanır */
  grantAttempt(enrollmentId: string) {
    updateEnrollment(enrollmentId, (e) => ({
      extraAttempts: e.extraAttempts + 1,
      status: e.status === 'failed' ? 'in_progress' : e.status,
    }));
  },

  /* ---------------- İçerik editörü ---------------- */

  createTraining() {
    const t: Training = {
      id: newId('tr'),
      title: 'Yeni eğitim',
      category: 'Genel',
      hours: 1,
      mode: 'Online',
      validityMonths: 12,
      icon: 'school',
      topics: [],
      description: '',
      content: {
        lessons: [],
        preTest: { questions: [], timeLimit: 0 },
        finalExam: { questions: [], timeLimit: 10 },
        passScore: 70,
        maxAttempts: 3,
      },
    };
    setState((s) => ({ trainings: [...s.trainings, t] }));
    return t.id;
  },

  updateTraining(id: string, patch: Partial<Omit<Training, 'content'>> & { content?: Partial<Training['content']> }) {
    setState((s) => ({
      trainings: s.trainings.map((t) =>
        t.id === id ? { ...t, ...patch, content: { ...t.content, ...(patch.content ?? {}) } } : t,
      ),
    }));
  },

  addLesson(trainingId: string, type: Lesson['type']) {
    const lesson: Lesson =
      type === 'slides'
        ? { id: newId('l'), title: 'Yeni slayt dersi', type, minutes: 10, slides: [{ id: newId('s'), title: 'Yeni slayt', body: '' }] }
        : { id: newId('l'), title: 'Yeni video dersi', type, minutes: 5, videoUrl: '', description: '' };
    updateContent(trainingId, (c) => ({ lessons: [...c.lessons, lesson] }));
    return lesson.id;
  },

  updateLesson(trainingId: string, lessonId: string, patch: Partial<Lesson>) {
    updateContent(trainingId, (c) => ({
      lessons: c.lessons.map((l) => (l.id === lessonId ? { ...l, ...patch } : l)),
    }));
  },

  deleteLesson(trainingId: string, lessonId: string) {
    updateContent(trainingId, (c) => ({ lessons: c.lessons.filter((l) => l.id !== lessonId) }));
  },

  moveLesson(trainingId: string, lessonId: string, dir: -1 | 1) {
    updateContent(trainingId, (c) => ({ lessons: move(c.lessons, lessonId, dir) }));
  },

  saveQuestion(trainingId: string, kind: ExamKind, q: Question) {
    const key = kind === 'pre' ? 'preTest' : 'finalExam';
    updateContent(trainingId, (c) => {
      const exists = c[key].questions.some((x) => x.id === q.id);
      return {
        [key]: {
          ...c[key],
          questions: exists ? c[key].questions.map((x) => (x.id === q.id ? q : x)) : [...c[key].questions, q],
        },
      };
    });
  },

  deleteQuestion(trainingId: string, kind: ExamKind, questionId: string) {
    const key = kind === 'pre' ? 'preTest' : 'finalExam';
    updateContent(trainingId, (c) => ({
      [key]: { ...c[key], questions: c[key].questions.filter((x) => x.id !== questionId) },
    }));
  },

  newQuestionId: () => newId('q'),
  newSlideId: () => newId('s'),

  /** Tüm verileri demo başlangıç haline döndürür */
  resetDemo() {
    const fresh = seedState();
    setState(() => fresh);
  },

  startAssignment(id: string) {
    setState((s) => ({
      assignments: s.assignments.map((a) => (a.id === id ? { ...a, status: 'in_progress' } : a)),
    }));
  },

  /** Eğitimi tamamlar, katılan herkes için onay bekleyen sertifika üretir. */
  completeAssignment(id: string, attendedIds: string[]) {
    const a = state.assignments.find((x) => x.id === id);
    if (!a) return 0;
    const t = state.trainings.find((x) => x.id === a.trainingId)!;
    const issue = daysFromNow(0);
    const seq = nextCertSeq();
    const certs: Certificate[] = attendedIds.map((pid, i) => ({
      id: newId('c'),
      no: `OSGB-${issue.slice(0, 4)}-${seq + i}`,
      participantId: pid,
      trainingId: a.trainingId,
      firmId: a.firmId,
      assignmentId: a.id,
      trainerId: a.trainerId,
      issueDate: issue,
      expiryDate: addMonths(issue, t.validityMonths),
      status: 'pending',
    }));
    setState((s) => ({
      assignments: s.assignments.map((x) =>
        x.id === id ? { ...x, status: 'completed', participantIds: attendedIds } : x,
      ),
      certificates: [...certs, ...s.certificates],
    }));
    return certs.length;
  },

  approveCertificates(ids: string[], by: string) {
    const set = new Set(ids);
    setState((s) => ({
      certificates: s.certificates.map((c) =>
        set.has(c.id) && c.status === 'pending'
          ? { ...c, status: 'approved', approvedBy: by, approvedAt: daysFromNow(0) }
          : c,
      ),
    }));
  },

  rejectCertificate(id: string, reason: string) {
    setState((s) => ({
      certificates: s.certificates.map((c) =>
        c.id === id ? { ...c, status: 'rejected', rejectReason: reason } : c,
      ),
    }));
  },

  /** E-imza: onaylı sertifikaları ve bekleyen belgeleri imzalar */
  sign(certIds: string[], docIds: string[], by: string) {
    const cs = new Set(certIds);
    const ds = new Set(docIds);
    const today = daysFromNow(0);
    setState((s) => ({
      certificates: s.certificates.map((c) =>
        cs.has(c.id) && c.status === 'approved'
          ? { ...c, status: 'signed', signedBy: by, signedAt: today }
          : c,
      ),
      documents: s.documents.map((d) =>
        ds.has(d.id) ? { ...d, status: 'signed', signedBy: by, signedAt: today } : d,
      ),
    }));
  },

  /** İSG-KATİP senkronizasyonu (simülasyon) */
  async syncKatip() {
    if (state.katipSyncing) return;
    setState(() => ({ katipSyncing: true }));
    await new Promise((r) => setTimeout(r, 1800));
    const now = new Date().toISOString();
    const pending = state.firms.filter((f) => f.katip.status === 'pending');
    const errors = state.firms.filter((f) => f.katip.status === 'error');
    const logs: KatipLog[] = [
      {
        id: newId('l'),
        at: now,
        text: `${state.firms.length - errors.length} sözleşme doğrulandı${pending.length ? `, ${pending.length} bildirim gönderildi` : ''}`,
        tone: 'success',
      },
      ...errors.map<KatipLog>((f) => ({
        id: newId('l'),
        at: now,
        text: `${f.name}: ${f.katip.message ?? 'hata'}`,
        tone: 'danger',
      })),
    ];
    setState((s) => ({
      katipSyncing: false,
      firms: s.firms.map((f) =>
        f.katip.status === 'error'
          ? { ...f, katip: { ...f.katip, lastSync: now } }
          : { ...f, katip: { ...f.katip, status: 'synced', lastSync: now, message: undefined } },
      ),
      katipLogs: [...logs, ...s.katipLogs].slice(0, 12),
    }));
  },

  /** Firmaya yeni uzman atar (İSG-KATİP hatasını gidermek için) */
  reassignSpecialist(firmId: string, specialistId: string) {
    setState((s) => ({
      firms: s.firms.map((f) =>
        f.id === firmId
          ? {
              ...f,
              specialistId,
              katip: { ...f.katip, status: 'pending', message: 'Uzman değişikliği bildirilmeyi bekliyor.' },
            }
          : f,
      ),
    }));
  },
};

/* ------------------------------------------------------------------ */
/* Türetilmiş hesaplamalar                                             */
/* ------------------------------------------------------------------ */

export type CertHealth = 'valid' | 'expiring' | 'expired' | 'pending' | 'approved' | 'rejected';

export const EXPIRING_DAYS = 30;

export function certHealth(c: Certificate): CertHealth {
  if (c.status === 'pending') return 'pending';
  if (c.status === 'approved') return 'approved';
  if (c.status === 'rejected') return 'rejected';
  const d = daysUntil(c.expiryDate);
  if (d < 0) return 'expired';
  if (d <= EXPIRING_DAYS) return 'expiring';
  return 'valid';
}

/** Bir katılımcının her eğitim için yalnızca en güncel sertifikası */
export function latestCertificates(certs: Certificate[]) {
  const map = new Map<string, Certificate>();
  for (const c of certs) {
    if (c.status === 'rejected') continue;
    const key = `${c.participantId}:${c.trainingId}`;
    const prev = map.get(key);
    if (!prev || prev.issueDate < c.issueDate) map.set(key, c);
  }
  return [...map.values()];
}

/** Firma uyum skoru: personelin zorunlu Temel İSG eğitiminin geçerli olma oranı */
export function firmCompliance(s: State, firmId: string) {
  const people = s.participants.filter((p) => p.firmId === firmId);
  if (!people.length) return 0;
  const latest = latestCertificates(s.certificates.filter((c) => c.firmId === firmId && c.trainingId === 'tr1'));
  const ok = people.filter((p) =>
    latest.some((c) => c.participantId === p.id && ['valid', 'expiring'].includes(certHealth(c))),
  ).length;
  return Math.round((ok / people.length) * 100);
}

/** İSG-KATİP: çalışan başına aylık asgari süre (dk) — 6331 sayılı Kanun yönetmelikleri */
const MINUTES: Record<'specialist' | 'physician' | 'dsp', Record<HazardClass, number>> = {
  specialist: { az: 10, tehlikeli: 20, cok: 40 },
  physician: { az: 5, tehlikeli: 10, cok: 15 },
  dsp: { az: 0, tehlikeli: 0, cok: 10 },
};
/** Tam zamanlı aylık çalışma süresi (195 saat) */
export const FULL_TIME_MINUTES = 11_700;

export function requiredMinutes(role: TeamMember['role'], firm: Firm) {
  return MINUTES[role][firm.hazard] * firm.employees;
}

export function memberFirms(s: State, m: TeamMember) {
  return s.firms.filter((f) =>
    m.role === 'specialist' ? f.specialistId === m.id : m.role === 'physician' ? f.physicianId === m.id : f.dspId === m.id,
  );
}

export function memberLoad(s: State, m: TeamMember) {
  const minutes = memberFirms(s, m).reduce((sum, f) => sum + requiredMinutes(m.role, f), 0);
  return { minutes, ratio: minutes / FULL_TIME_MINUTES };
}

/** İSG uzmanı sınıfının tehlike sınıfına uygunluğu */
export function classAllowed(certClass: TeamMember['certClass'], hazard: HazardClass) {
  if (!certClass) return true;
  if (hazard === 'cok') return certClass === 'A';
  if (hazard === 'tehlikeli') return certClass === 'A' || certClass === 'B';
  return true;
}

export const HAZARD_LABEL: Record<HazardClass, string> = {
  az: 'Az tehlikeli',
  tehlikeli: 'Tehlikeli',
  cok: 'Çok tehlikeli',
};

export const ROLE_LABEL: Record<TeamMember['role'], string> = {
  specialist: 'İSG Uzmanı',
  physician: 'İşyeri Hekimi',
  dsp: 'Diğer Sağlık Personeli',
};

export const DOC_LABEL: Record<SignDocument['type'], string> = {
  attendance: 'Katılım tutanağı',
  risk_report: 'Risk raporu',
  annual_plan: 'Yıllık plan',
  emergency_plan: 'Acil durum planı',
};

/** Kimlik → kayıt sözlükleri (render içinde hızlı erişim) */
export function useLookups() {
  const s = useAppState();
  return useMemo(() => {
    const index = <T extends { id: string }>(arr: T[]) => new Map(arr.map((x) => [x.id, x]));
    const firms = index(s.firms);
    const team = index(s.team);
    const participants = index(s.participants);
    const trainings = index(s.trainings);
    return {
      firm: (id: string) => firms.get(id),
      member: (id: string) => team.get(id),
      participant: (id: string) => participants.get(id),
      training: (id: string) => trainings.get(id),
    };
  }, [s]);
}

/* ------------------------------------------------------------------ */
/* Online kurs adımları: ön sınav → dersler (sırayla) → final           */
/* ------------------------------------------------------------------ */

export type CourseStep = {
  key: string;
  kind: 'pre' | 'lesson' | 'final';
  title: string;
  lesson?: Lesson;
  done: boolean;
  locked: boolean;
};

export function courseState(t: Training, e: Enrollment) {
  const c = t.content;
  const preDone = !!e.preTest || c.preTest.questions.length === 0;
  const steps: CourseStep[] = [
    { key: 'pre', kind: 'pre', title: 'Ön sınav', done: preDone, locked: false },
  ];
  let prevDone = preDone;
  for (const l of c.lessons) {
    const done = e.completedLessons.includes(l.id);
    steps.push({ key: l.id, kind: 'lesson', title: l.title, lesson: l, done, locked: !prevDone });
    prevDone = done;
  }
  const passed = e.finalAttempts.some((a) => a.passed);
  const limit = c.maxAttempts + e.extraAttempts;
  const attemptsLeft = Math.max(0, limit - e.finalAttempts.length);
  steps.push({ key: 'final', kind: 'final', title: 'Final sınavı', done: passed, locked: !prevDone });

  const doneCount = steps.filter((x) => x.done).length;
  const best = e.finalAttempts.reduce<number | undefined>((m, a) => (m === undefined || a.score > m ? a.score : m), undefined);
  return {
    steps,
    progress: doneCount / steps.length,
    next: steps.find((x) => !x.done && !x.locked),
    attemptsLeft,
    attemptLimit: limit,
    bestFinal: best,
    passed,
  };
}
