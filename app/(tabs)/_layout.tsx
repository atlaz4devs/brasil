import { FileAttachmentIcon, MessageSearch01Icon, StarIcon, UserIcon, UserSearch01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { useAuth } from '@/contexts/auth-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EmailNotVerifiedScreen from './email-not-verified';
import WhatsappNotVerifiedScreen from './whatsapp-not-verified';

export default function TabLayout() {
  const activeColor = '#0066FF';
  const inactiveColor = '#9CA3AF';
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 12);

  if (!user) {
    return <Redirect href="/auth/welcome" />;
  }

  if (!user?.emailVerified && process.env.EXPO_PUBLIC_SKIP_EMAIL_VERIFICATION !== 'true') {
    return <EmailNotVerifiedScreen />;
  }
  if (!user?.phoneNumberVerified && process.env.EXPO_PUBLIC_SKIP_WHATSAPP_VERIFICATION !== 'true') {
    return <WhatsappNotVerifiedScreen />;
  }
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          paddingTop: 10,
          paddingBottom: bottomInset,
          height: 60 + bottomInset,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '500',
          textAlign: 'center',
        },
        tabBarItemStyle: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 2,
        },
        tabBarAllowFontScaling: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <HugeiconsIcon icon={MessageSearch01Icon} size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Serviços',
          tabBarIcon: ({ color }) => <HugeiconsIcon icon={UserSearch01Icon} size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="email-not-verified"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="whatsapp-not-verified"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="ratings"
        options={{
          title: 'Minhas avaliações',
          tabBarIcon: ({ color }) => <HugeiconsIcon icon={StarIcon} size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="documentos"
        options={{
          title: 'Documentos',
          tabBarIcon: ({ color }) => <HugeiconsIcon icon={FileAttachmentIcon} size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          title: 'Meu perfil',
          tabBarIcon: ({ color }) => <HugeiconsIcon icon={UserIcon} size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
