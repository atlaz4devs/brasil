import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomDialog } from '../../components/ui/custom-dialog';
import { InputField, type InputFieldRef } from '../../components/ui/input-field';
import { PrimaryButton } from '../../components/ui/primary-button';
import { useSnackbar } from '../../components/ui/snackbar';
import { useAuth } from '../../contexts/auth-context';
import { auth } from '../../firebaseConfig';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const { setHoldRedirect } = useAuth();
  const { show } = useSnackbar();

  const scrollViewRef = useRef<ScrollView>(null);
  const scrollViewY = useRef(0);
  const emailRef = useRef<InputFieldRef>(null);
  const passwordRef = useRef<InputFieldRef>(null);
  const keyboardTopRef = useRef(Dimensions.get('window').height);
  const keyboardVisibleRef = useRef(false);
  const keyboardSettledTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyboardScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingFocusRef = useRef<{ y: number; height: number } | null>(null);

  const scrollFocusedFieldIntoView = useCallback((layout: { y: number; height: number }) => {
    const keyboardTop = keyboardTopRef.current;
    const fieldBottom = layout.y + layout.height;
    const visibleBottom = keyboardTop - 24;

    if (fieldBottom <= visibleBottom) {
      return;
    }

    const nextOffset = scrollViewY.current + (fieldBottom - visibleBottom) + 16;
    scrollViewRef.current?.scrollTo({
      y: Math.max(0, nextOffset),
      animated: true,
    });
  }, []);

  const scheduleScrollForFocusedField = useCallback((layout: { y: number; height: number }) => {
    pendingFocusRef.current = layout;

    if (keyboardScrollTimeoutRef.current) {
      clearTimeout(keyboardScrollTimeoutRef.current);
    }

    keyboardScrollTimeoutRef.current = setTimeout(() => {
      scrollFocusedFieldIntoView(layout);
    }, 180);
  }, [scrollFocusedFieldIntoView]);

  const handleInputFocus = useCallback((layout: { y: number; height: number }) => {
    if (keyboardVisibleRef.current) {
      scheduleScrollForFocusedField(layout);
    } else {
      pendingFocusRef.current = layout;
    }
  }, [scheduleScrollForFocusedField]);

  useEffect(() => {
    const syncKeyboardFrame = (event: any) => {
      keyboardVisibleRef.current = true;
      keyboardTopRef.current = event.endCoordinates.screenY;

      if (pendingFocusRef.current) {
        if (keyboardSettledTimeoutRef.current) {
          clearTimeout(keyboardSettledTimeoutRef.current);
        }

        keyboardSettledTimeoutRef.current = setTimeout(() => {
          if (pendingFocusRef.current) {
            scheduleScrollForFocusedField(pendingFocusRef.current);
          }
        }, 60);
      }
    };

    const showSubscription = Keyboard.addListener('keyboardDidShow', syncKeyboardFrame);
    const frameSubscriptions =
      Platform.OS === 'ios'
        ? [
            Keyboard.addListener('keyboardWillChangeFrame', syncKeyboardFrame),
            Keyboard.addListener('keyboardDidChangeFrame', syncKeyboardFrame),
          ]
        : [];

    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      keyboardVisibleRef.current = false;
      keyboardTopRef.current = Dimensions.get('window').height;

      if (keyboardScrollTimeoutRef.current) {
        clearTimeout(keyboardScrollTimeoutRef.current);
        keyboardScrollTimeoutRef.current = null;
      }
      if (keyboardSettledTimeoutRef.current) {
        clearTimeout(keyboardSettledTimeoutRef.current);
        keyboardSettledTimeoutRef.current = null;
      }
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      frameSubscriptions.forEach((subscription) => subscription.remove());
      if (keyboardScrollTimeoutRef.current) {
        clearTimeout(keyboardScrollTimeoutRef.current);
      }
      if (keyboardSettledTimeoutRef.current) {
        clearTimeout(keyboardSettledTimeoutRef.current);
      }
    };
  }, [scheduleScrollForFocusedField]);

  const handleScroll = (event: any) => {
    scrollViewY.current = event.nativeEvent.contentOffset.y;
  };

  const handleLogin = async () => {
    // Validações
    if (!email.trim()) {
      show('Por favor, insira seu email.', { backgroundColor: '#ba1a1a' });
      return;
    }
    if (!password) {
      show('Por favor, insira sua senha.', { backgroundColor: '#ba1a1a' });
      return;
    }

    setIsLoading(true);

    // Bloqueia o redirect antes de fazer login
    setHoldRedirect(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setShowSuccessDialog(true);
    } catch (error: any) {
      // Libera o redirect em caso de erro
      setHoldRedirect(false);

      let message = 'Ocorreu um erro ao fazer login.';

      switch (error.code) {
        case 'auth/invalid-email':
          message = 'Email inválido.';
          break;
        case 'auth/user-disabled':
          message = 'Esta conta foi desativada.';
          break;
        case 'auth/user-not-found':
          message = 'Usuário não encontrado.';
          break;
        case 'auth/wrong-password':
          message = 'Senha incorreta.';
          break;
        case 'auth/invalid-credential':
          message = 'Email ou senha incorretos.';
          break;
        case 'auth/too-many-requests':
          message = 'Muitas tentativas. Tente novamente mais tarde.';
          break;
      }

      show(message, { backgroundColor: '#ba1a1a' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = () => {
    setShowSuccessDialog(false);
    // Libera o redirect quando fechar o dialog
    setHoldRedirect(false);
  };

  const handleForgotPassword = () => {
    // Navigate to forgot password screen
    // router.push('/auth/forgot-password');
  };

  const handleCreateAccount = () => {
    router.push('/auth/register');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={28} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Login</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Field */}
            <InputField
              ref={emailRef}
              testID="email-input"
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
              onFocusWithPosition={handleInputFocus}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            {/* Password Field */}
            <InputField
              ref={passwordRef}
              testID="password-input"
              label="Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="off"
              textContentType="none"
              importantForAutofill="no"
              onFocusWithPosition={handleInputFocus}
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={handleLogin}
            />

            {/* Login Button */}
            <PrimaryButton
              testID="login-button"
              title="Entrar"
              onPress={handleLogin}
              loading={isLoading}
            />

            {/* Forgot Password Link */}
            <TouchableOpacity
              style={styles.linkContainer}
              onPress={handleForgotPassword}
            >
              <Text style={styles.linkText}>Esqueceu a senha?</Text>
            </TouchableOpacity>

            {/* Create Account Link */}
            <TouchableOpacity
              style={styles.linkContainer}
              onPress={handleCreateAccount}
            >
              <Text style={styles.linkText}>Não tem uma conta? Crie uma</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Dialog de sucesso */}
        <CustomDialog
          visible={showSuccessDialog}
          title="Bem-vindo!"
          message="Login realizado com sucesso."
          onClose={handleDialogClose}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 96,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  headerSpacer: {
    width: 40,
  },
  form: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '400',
  },
});
