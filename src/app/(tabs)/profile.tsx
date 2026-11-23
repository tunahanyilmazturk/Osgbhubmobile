import { View } from 'react-native';

import { ComingSoon } from '@/components/ComingSoon';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/lib/session';

export default function Profile() {
  const { user, signOut } = useSession();
  return (
    <ComingSoon
      title="Profil"
      icon="person"
      description={`${user?.email ?? ''}\nHesap ayarları ve bildirim tercihleri yakında burada.`}
    >
      <View style={{ width: '100%', maxWidth: 300, marginTop: 12 }}>
        <Button title="Çıkış yap" variant="outline" icon="log-out-outline" onPress={signOut} />
      </View>
    </ComingSoon>
  );
}
