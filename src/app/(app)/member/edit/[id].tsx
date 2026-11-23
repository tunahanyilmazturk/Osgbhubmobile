import { useLocalSearchParams } from 'expo-router';

import { MemberForm } from '@/components/forms/MemberForm';

export default function EditMember() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MemberForm key={id} id={id} />;
}
