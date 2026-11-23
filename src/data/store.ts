import { useMemo, useSyncExternalStore } from 'react';

import { addMonths, daysFromNow, daysUntil } from '@/lib/format';

import * as seed from './seed';
import type {
  Assignment,
  Certificate,
  Firm,
  HazardClass,
  KatipLog,
  Participant,
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
  katipSyncing: boolean;
};

let state: State = {
  firms: seed.firms,
  team: seed.team,
  participants: seed.participants,
  trainings: seed.trainings,
  assignments: seed.assignments,
  certificates: seed.certificates,
  documents: seed.documents,
  katipLogs: seed.katipLogs,
  katipSyncing: false,
};

const listeners = new Set<() => void>();
function setState(updater: (s: State) => Partial<State>) {
  state = { ...state, ...updater(state) };
  listeners.forEach((l) => l());
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

/* ------------------------------------------------------------------ */
/* Aksiyonlar — iş akışı:                                              */
/* atama → tamamla → sertifika onayı → e-imza → geçerli sertifika      */
/* ------------------------------------------------------------------ */

let idSeq = 1;
const newId = (p: string) => `${p}${Date.now().toString(36)}${idSeq++}`;
let certSeq = 9000;

export const actions = {
  createAssignment(input: Omit<Assignment, 'id' | 'status'>) {
    const a: Assignment = { ...input, id: newId('a'), status: 'planned' };
    setState((s) => ({ assignments: [a, ...s.assignments] }));
    return a.id;
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
    const certs: Certificate[] = attendedIds.map((pid) => ({
      id: newId('c'),
      no: `OSGB-${issue.slice(0, 4)}-${certSeq++}`,
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
