import { useMemo } from 'react';

import { useAppState } from '@/data/store';
import { useSession } from '@/lib/session';

/** Giriş yapan katılımcının kaydı, firması, eğitimleri ve sertifikaları */
export function useParticipant() {
  const { user } = useSession();
  const s = useAppState();
  return useMemo(() => {
    const participant = s.participants.find((p) => p.id === user?.participantId);
    const firm = s.firms.find((f) => f.id === participant?.firmId);
    const enrollments = s.enrollments
      .filter((e) => e.participantId === participant?.id)
      .map((e) => ({
        e,
        training: s.trainings.find((t) => t.id === e.trainingId)!,
        assignment: s.assignments.find((a) => a.id === e.assignmentId)!,
        certificate: s.certificates.find((c) => c.enrollmentId === e.id && c.status !== 'rejected'),
      }))
      .filter((x) => x.training && x.assignment);
    const certificates = s.certificates
      .filter((c) => c.participantId === participant?.id && c.status !== 'rejected')
      .sort((a, b) => b.issueDate.localeCompare(a.issueDate));
    return { participant, firm, enrollments, certificates, state: s };
  }, [s, user?.participantId]);
}
