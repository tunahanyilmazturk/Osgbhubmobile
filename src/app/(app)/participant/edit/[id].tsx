import { useLocalSearchParams } from 'expo-router';

import { ParticipantForm } from '@/components/forms/ParticipantForm';

export default function EditParticipant() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ParticipantForm key={id} id={id} />;
}
