import { useLocalSearchParams } from 'expo-router';

import { FirmForm } from '@/components/forms/FirmForm';

export default function EditFirm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <FirmForm key={id} id={id} />;
}
