import { Redirect } from 'expo-router';

import { useSession } from '@/lib/session';

export default function Index() {
  const { user } = useSession();
  if (!user) return <Redirect href="/login" />;
  return <Redirect href={user.role === 'participant' ? '/my-trainings' : '/dashboard'} />;
}
