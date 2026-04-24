import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
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
import { WhatsappInput, type WhatsappInputRef } from '../../components/ui/whatsapp-input';
import { auth } from '../../firebaseConfig';
import { isDisplayNameAvailable, isPhoneNumberAvailable, updateUserProfile, validateDisplayNameFormat } from '../../services/user-service';

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const { show } = useSnackbar();

  const scrollViewRef = useRef<ScrollView>(null);
  const scrollViewY = useRef(0);
  const displayNameRef = useRef<InputFieldRef>(null);
  const fullNameRef = useRef<InputFieldRef>(null);
  const emailRef = useRef<InputFieldRef>(null);
  const whatsappRef = useRef<WhatsappInputRef>(null);
  const passwordRef = useRef<InputFieldRef>(null);
  const confirmPasswordRef = useRef<InputFieldRef>(null);
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

  const handleRegister = async () => {
    // Validações
    const displayNameValidation = validateDisplayNameFormat(displayName);
    if (!displayNameValidation.valid) {
      show(displayNameValidation.error!, { backgroundColor: '#ba1a1a' });
      return;
    }
    if (!fullName.trim()) {
      show('Por favor, insira seu nome completo.', { backgroundColor: '#ba1a1a' });
      return;
    }
    if (!email.trim()) {
      show('Por favor, insira seu email.', { backgroundColor: '#ba1a1a' });
      return;
    }
    if (!password) {
      show('Por favor, insira uma senha.', { backgroundColor: '#ba1a1a' });
      return;
    }
    if (password.length < 6) {
      show('A senha deve ter pelo menos 6 caracteres.', { backgroundColor: '#ba1a1a' });
      return;
    }
    if (password !== confirmPassword) {
      show('As senhas não coincidem.', { backgroundColor: '#ba1a1a' });
      return;
    }
    if (!phone.trim()) {
      show('Por favor, insira seu WhatsApp.', { backgroundColor: '#ba1a1a' });
      return;
    }

    setLoading(true);
    try {
      // Verifica se o displayName está disponível
      const isAvailable = await isDisplayNameAvailable(displayName);
      if (!isAvailable) {
        show('Este nome de exibição já está em uso', { backgroundColor: '#ba1a1a' });
        setLoading(false);
        return;
      }

      // Verifica se o WhatsApp está disponível
      if (phone.trim()) {
        const isPhoneAvailable = await isPhoneNumberAvailable(phone.trim());
        if (!isPhoneAvailable) {
          show('Este WhatsApp já está em uso', { backgroundColor: '#ba1a1a' });
          setLoading(false);
          return;
        }
      }

      // Criar usuário no Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);

      // Enviar email de verificação (a menos que EXPO_PUBLIC_SKIP_EMAIL_VERIFICATION esteja ativo)
      if (process.env.EXPO_PUBLIC_SKIP_EMAIL_VERIFICATION !== 'true') {
        // Salvar timestamp ANTES de enviar o email (pois o auth state change já aconteceu)
        await AsyncStorage.setItem('emailVerificationSentAt', Date.now().toString());
        await sendEmailVerification(userCredential.user);
      }

      const normalizedDisplayName = displayName.trim().toLowerCase();

      // Atualizar o perfil com o nome de exibição
      await updateProfile(userCredential.user, {
        displayName: normalizedDisplayName,
      });

      // Salvar perfil completo no Firestore
      await updateUserProfile(userCredential.user.uid, {
        displayName: normalizedDisplayName,
        fullName: fullName.trim(),
        phoneNumber: phone.trim(),
        ...(process.env.EXPO_PUBLIC_SKIP_WHATSAPP_VERIFICATION === 'true' && { phoneNumberVerified: true }),
      });

      // Registro bem-sucedido, mostrar dialog de sucesso
      setShowSuccessDialog(true);
    } catch (error: any) {
      let errorMessage = 'Ocorreu um erro ao criar sua conta: ' + error.message;

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Este email já está em uso.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido.';
          break;
        case 'auth/weak-password':
          errorMessage = 'A senha é muito fraca.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Operação não permitida.';
          break;
      }

      show(errorMessage, { backgroundColor: '#ba1a1a' });
    } finally {
      setLoading(false);
    }
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
              <Ionicons name="chevron-back" size={28} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Criar conta</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Display Name Field */}
            <InputField
              ref={displayNameRef}
              testID="displayname-input"
              label="Nome de exibição"
              value={displayName}
              onChangeText={(text) => setDisplayName(text.toLowerCase().replace(/[^a-z0-9]/g, ''))}
              placeholder="usuario123"
              autoCapitalize="none"
              autoCorrect={false}
              onFocusWithPosition={handleInputFocus}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => fullNameRef.current?.focus()}
              helperText="Apenas letras e números, sem espaços (3-20 caracteres)"
              maxLength={20}
            />

            {/* Full Name Field */}
            <InputField
              ref={fullNameRef}
              testID="fullname-input"
              label="Nome completo"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Seu nome completo"
              autoCapitalize="words"
              autoCorrect={false}
              onFocusWithPosition={handleInputFocus}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => emailRef.current?.focus()}
              helperText="Privado, não será exibido publicamente"
            />

            {/* Email Field */}
            <InputField
              ref={emailRef}
              testID="email-input"
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onFocusWithPosition={handleInputFocus}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => whatsappRef.current?.focus()}
            />

            {/* WhatsApp Field */}
            <WhatsappInput
              ref={whatsappRef}
              testID="whatsapp-input"
              label="WhatsApp"
              value={phone}
              onChangeValue={setPhone}
              placeholder="Digite seu WhatsApp"
              isDark={false}
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
              placeholder="••••••••"
              secureTextEntry
              onFocusWithPosition={handleInputFocus}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
            />

            {/* Confirm Password Field */}
            <InputField
              ref={confirmPasswordRef}
              testID="confirm-password-input"
              label="Confirmação de senha"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              secureTextEntry
              onFocusWithPosition={handleInputFocus}
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={handleRegister}
            />

            {/* Register Button */}
            <PrimaryButton
              testID="register-button"
              title="Criar conta"
              onPress={handleRegister}
              loading={loading}
            />
          </View>
        </ScrollView>

        {/* Success Dialog */}
        <CustomDialog
          visible={showSuccessDialog}
          title="Conta criada com sucesso!"
          message="Sua conta foi criada. Você já pode começar a usar o app."
          buttons={[
            {
              text: 'Continuar',
              onPress: () => {
                setShowSuccessDialog(false);
                router.replace('/(tabs)');
              },
            },
          ]}
          onClose={() => setShowSuccessDialog(false)}
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
});
