
import {
  ArrowRight01Icon,
  Idea01Icon,
  LockPasswordIcon,
  Logout01Icon,
  Settings01FreeIcons,
  UserIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import React from 'react';
import {
  Alert,
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { auth } from '@/firebaseConfig';
import { useColorScheme } from '@/hooks/use-color-scheme';

type MenuItemProps = {
  icon: React.ComponentProps<typeof HugeiconsIcon>['icon'];
  label: string;
  onPress?: () => void;
  showDivider?: boolean;
  fullWidthDivider?: boolean;
  danger?: boolean;
};

function MenuItem({ icon, label, onPress, showDivider = true, fullWidthDivider = false, danger = false }: MenuItemProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        { backgroundColor: pressed ? (isDark ? '#2a2a2a' : '#f5f5f5') : 'transparent' },
      ]}
      onPress={onPress}
    >
      <View style={styles.menuItemContent}>
        <HugeiconsIcon
          icon={icon}
          size={24}
          color={danger ? '#ff4444' : colors.icon}
          style={styles.menuIcon}
        />
        <ThemedText style={[styles.menuLabel, danger && { color: '#ff4444' }]}>
          {label}
        </ThemedText>
      </View>
      <HugeiconsIcon icon={ArrowRight01Icon} size={20} color={colors.icon} />
      {showDivider && (
        <View
          style={[
            fullWidthDivider ? styles.fullDivider : styles.divider,
            { backgroundColor: isDark ? '#333' : '#eee' },
          ]}
        />
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const scrollY = new Animated.Value(0);

  const handleLogoutPress = () => {
    if (Platform.OS === 'web') {
      const confirmed = confirm('Tem certeza que deseja sair?');
      if (confirmed) {
        confirmLogout();
      }
    } else {
      Alert.alert(
        'Sair da conta',
        'Tem certeza que deseja sair?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Sair',
            style: 'destructive',
            onPress: confirmLogout,
          },
        ]
      );
    }
  };

  const confirmLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/auth/welcome');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  // Animações do header
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [320, 100],
    extrapolate: 'clamp',
  });

  // Avatar grande (estado expandido)
  const largeAvatarOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const largeAvatarScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.5],
    extrapolate: 'clamp',
  });

  // Nome e tabs (estado expandido)
  const expandedContentOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Header colapsado (título + avatar pequeno)
  const collapsedHeaderOpacity = scrollY.interpolate({
    inputRange: [80, 150],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Usuário';

  return (
    <ThemedView style={styles.container}>
      {/* Animated Header */}
      <Animated.View
        style={[
          styles.header,
          {
            height: headerHeight,
            paddingTop: insets.top,
            backgroundColor: colors.background,
          },
        ]}
      >
        {/* Estado Expandido - Avatar grande centralizado */}
        <Animated.View
          style={[
            styles.expandedHeader,
            {
              opacity: largeAvatarOpacity,
              transform: [{ scale: largeAvatarScale }],
            },
          ]}
        >
          <View style={styles.largeAvatarContainer}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.largeAvatar} />
            ) : (
              <View
                style={[
                  styles.largeAvatar,
                  styles.avatarPlaceholder,
                  { backgroundColor: isDark ? '#333' : '#e0e0e0' },
                ]}
              >
                <HugeiconsIcon icon={UserIcon} size={50} color={colors.icon} />
              </View>
            )}
          </View>
        </Animated.View>

        {/* Nome do usuário (estado expandido) */}
        <Animated.View style={[styles.userNameContainer, { opacity: expandedContentOpacity }]}>
          <ThemedText style={styles.userName}>{displayName}</ThemedText>
        </Animated.View>

        {/* Estado Colapsado - Título "Perfil" + avatar pequeno */}
        <Animated.View
          style={[
            styles.collapsedHeader,
            { opacity: collapsedHeaderOpacity },
          ]}
        >
          <ThemedText style={styles.headerTitle}>Perfil</ThemedText>
          <View style={styles.smallAvatarContainer}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.smallAvatar} />
            ) : (
              <View
                style={[
                  styles.smallAvatar,
                  styles.avatarPlaceholder,
                  { backgroundColor: isDark ? '#333' : '#e0e0e0' },
                ]}
              >
                <HugeiconsIcon icon={UserIcon} size={24} color={colors.icon} />
              </View>
            )}
          </View>
        </Animated.View>
      </Animated.View>

      {/* Scrollable Menu Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Spacer for header */}
        <View style={{ height: 320 }} />

        {/* Menu Section - Main Options */}
        <View
          style={[
            styles.menuSection,
            { backgroundColor: colors.background },
          ]}
        >
          <MenuItem icon={Settings01FreeIcons} label="Configurações de conta" onPress={() => router.push('/(tabs)/(profile)/account-settings')} showDivider fullWidthDivider />
          <MenuItem icon={Idea01Icon} label="Sugestões de melhorias" onPress={() => router.push('/(tabs)/(profile)/suggestions')} showDivider fullWidthDivider />
          <MenuItem icon={LockPasswordIcon} label="Alterar senha" onPress={() => router.push('/(tabs)/(profile)/change-password')} showDivider fullWidthDivider />
          <MenuItem
            icon={Logout01Icon}
            label="Sair da conta"
            onPress={handleLogoutPress}
            danger
            showDivider={false}
          />
        </View>
      </Animated.ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    overflow: 'hidden',
  },
  expandedHeader: {
    alignItems: 'center',
    marginTop: 20,
  },
  largeAvatarContainer: {
    marginBottom: 16,
  },
  largeAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  userNameContainer: {
    marginBottom: 20,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  collapsedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  smallAvatarContainer: {
    marginLeft: 16,
  },
  smallAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  menuSection: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    position: 'relative',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  menuIcon: {
    marginRight: 16,
  },
  menuLabel: {
    fontSize: 16,
  },
  divider: {
    position: 'absolute',
    bottom: 0,
    left: 56,
    right: 0,
    height: 1,
  },
  fullDivider: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
  },
});
