import { useLocalSearchParams } from 'expo-router';

import { ParticipantForm } from '@/components/forms/ParticipantForm';

export default function NewParticipant() {
  const { firmId } = useLocalSearchParams<{ firmId?: string }>();
  return <ParticipantForm firmId={firmId} />;
}
