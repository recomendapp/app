import { Button } from '../components/ui/Button';
import { Text } from '../components/ui/text';
import { View } from '../components/ui/view';
import { Icons } from '../constants/Icons';
import tw from '../lib/tw';
import { Stack, useRouter } from 'expo-router';
import { useTranslations } from 'use-intl';
import { upperFirst } from 'lodash';
import { useModalHeaderOptions } from '../hooks/useModalHeaderOptions';

const NotificationsScreen = () => {
  const router = useRouter();
  const t = useTranslations();
  const modalHeaderOptions = useModalHeaderOptions({
    forceCross: true,
  });
  return (
    <>
      <Stack.Screen
        options={{
          ...modalHeaderOptions,
          headerRight: () => (
            <View style={[tw`flex-row items-center`]}>
              <Button
                variant="ghost"
                icon={Icons.UserPlus}
                size="icon"
                onPress={() => router.push('/follow-requests')}
              />
            </View>
          ),
          unstable_headerRightItems: (props) => [
            {
              type: 'button',
              label: upperFirst(t('common.messages.follow_requests')),
              onPress: () => router.push('/follow-requests'),
              tintColor: props.tintColor,
              icon: {
                name: 'person.badge.plus',
                type: 'sfSymbol',
              },
            },
          ],
        }}
      />
      <View>
        <Text textColor="muted" style={tw`text-center`}>
          Notifications system is deleted for now
        </Text>
      </View>
    </>
  );
};

export default NotificationsScreen;
