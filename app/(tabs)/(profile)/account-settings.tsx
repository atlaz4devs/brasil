import {
  Mail01Icon,
  UserIcon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useRouter } from 'expo-router';
import { updateEmail, updateProfile } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CustomDialog } from '@/components/ui/custom-dialog';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useSnackbar } from '@/components/ui/snackbar';
import { WhatsappInput } from '@/components/ui/whatsapp-input';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { auth } from '@/firebaseConfig';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getUserProfile, isDisplayNameAvailable, updateUserProfile, validateDisplayNameFormat } from '@/services/user-service';
import { generateVerificationCode, sendVerificationCode, storeVerificationCode, verifyCode } from '@/services/whatsapp-service';

export default function ContactSettingsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const snackbar = useSnackbar();

  const [displayName, setDisplayName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [originalPhone, setOriginalPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    setLoadingProfile(true);
    try {
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setDisplayName(profile.displayName || '');
        setFullName(profile.fullName || '');
        setPhone(profile.phoneNumber || '');
        setOriginalPhone(profile.phoneNumber || '');
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser || !user) return;

    // Validações
    const displayNameValidation = validateDisplayNameFormat(displayName);
    if (!displayNameValidation.valid) {
      snackbar.show(displayNameValidation.error!, { backgroundColor: '#F44336' });
      return;
    }

    if (!fullName.trim()) {
      snackbar.show('Nome completo é obrigatório', { backgroundColor: '#F44336' });
      return;
    }

    // Se telefone mudou, requer verificação
    if (phone.trim() !== originalPhone && phone.trim()) {
      await sendVerificationToPhone();
      return;
    }

    setLoading(true);
    try {
      // Verifica se o displayName está disponível
      const isAvailable = await isDisplayNameAvailable(displayName, user.uid);
      if (!isAvailable) {
        snackbar.show('Este nome de exibição já está em uso', { backgroundColor: '#F44336' });
        setLoading(false);
        return;
      }

      await saveProfile();
    } catch (error: any) {
      console.error('Erro ao atualizar:', error);
      let errorMessage = 'Erro ao atualizar informações';
      
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Por segurança, faça login novamente para alterar o e-mail';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'E-mail inválido';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este e-mail já está em uso';
      }

      snackbar.show(errorMessage, { backgroundColor: '#F44336' });
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationToPhone = async () => {
    if (!phone.trim()) return;

    setSendingCode(true);
    try {
      const code = generateVerificationCode();
      setVerificationCode(code);
      storeVerificationCode(phone, code);
      
      await sendVerificationCode(phone, code);
      
      setShowVerificationDialog(true);
      snackbar.show('Código enviado via WhatsApp!', { backgroundColor: '#4CAF50' });
    } catch (error) {
      console.error('Erro ao enviar código:', error);
      snackbar.show('Erro ao enviar código de verificação', { backgroundColor: '#F44336' });
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!inputCode.trim()) {
      snackbar.show('Digite o código recebido', { backgroundColor: '#F44336' });
      return;
    }

    const isValid = verifyCode(phone, inputCode.trim());
    
    if (!isValid) {
      snackbar.show('Código inválido ou expirado', { backgroundColor: '#F44336' });
      return;
    }

    setShowVerificationDialog(false);
    setInputCode('');
    
    setLoading(true);
    try {
      await saveProfile();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      snackbar.show('Erro ao salvar informações', { backgroundColor: '#F44336' });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!auth.currentUser || !user) return;

    // Atualizar perfil no Firestore
    await updateUserProfile(user.uid, {
      displayName: displayName.trim().toLowerCase(),
      fullName: fullName.trim(),
      phoneNumber: phone.trim(),
    });

    // Atualizar perfil no Firebase Auth
    await updateProfile(auth.currentUser, {
      displayName: displayName.trim().toLowerCase(),
    });

    // Atualizar e-mail se foi alterado
    if (email !== user?.email && email.trim()) {
      await updateEmail(auth.currentUser, email.trim());
    }

    setOriginalPhone(phone.trim());
    setShowSuccessDialog(true);
  };

  if (loadingProfile) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.text} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Display Name Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <HugeiconsIcon icon={UserIcon} size={20} color={colors.icon} />
              <ThemedText style={styles.label}>Nome de exibição</ThemedText>
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#1a1a1a' : '#fff',
                  borderColor: isDark ? '#333' : '#e5e5e5',
                  color: colors.text,
                },
              ]}
              value={displayName}
              onChangeText={(text) => setDisplayName(text.toLowerCase().replace(/[^a-z0-9]/g, ''))}
              placeholder="usuario123"
              placeholderTextColor={isDark ? '#666' : '#999'}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
            <ThemedText style={styles.helperText}>
              Apenas letras e números, sem espaços (3-20 caracteres)
            </ThemedText>
          </View>

          {/* Full Name Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <HugeiconsIcon icon={UserIcon} size={20} color={colors.icon} />
              <ThemedText style={styles.label}>Nome completo</ThemedText>
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#1a1a1a' : '#fff',
                  borderColor: isDark ? '#333' : '#e5e5e5',
                  color: colors.text,
                },
              ]}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Seu nome completo"
              placeholderTextColor={isDark ? '#666' : '#999'}
              autoCapitalize="words"
            />
            <ThemedText style={styles.helperText}>
              Mantido em privado, não será exibido publicamente
            </ThemedText>
          </View>

          {/* E-mail Field */}
          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <HugeiconsIcon icon={Mail01Icon} size={20} color={colors.icon} />
              <ThemedText style={styles.label}>E-mail</ThemedText>
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#1a1a1a' : '#fff',
                  borderColor: isDark ? '#333' : '#e5e5e5',
                  color: colors.text,
                },
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder="Digite seu e-mail"
              placeholderTextColor={isDark ? '#666' : '#999'}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* WhatsApp Field */}
          <View style={styles.phoneFieldContainer}>
            <WhatsappInput
              value={phone}
              onChangeValue={setPhone}
              label="WhatsApp"
              placeholder="Digite seu WhatsApp"
              isDark={isDark}
            />
            <ThemedText style={styles.helperText}>
              A alteração do WhatsApp pode requerer verificação
            </ThemedText>
          </View>

          {/* Save Button */}
          <View style={styles.buttonContainer}>
            <PrimaryButton
              title={loading ? 'Salvando...' : 'Salvar alterações'}
              onPress={handleSave}
              disabled={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomDialog
        visible={showSuccessDialog}
        title="Sucesso"
        message="Informações atualizadas com sucesso!"
        buttons={[
          {
            text: 'OK',
            onPress: () => {
              setShowSuccessDialog(false);
            },
          },
        ]}
        onClose={() => {
          setShowSuccessDialog(false);
        }}
      />

      {/* Modal de verificação com input */}
      <Modal
        visible={showVerificationDialog}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => {
          setShowVerificationDialog(false);
          setInputCode('');
        }}
      >
        <TouchableWithoutFeedback>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: isDark ? '#1f1f1f' : '#fff' }]}>
                <ThemedText style={styles.modalTitle}>Verificação WhatsApp</ThemedText>
                <ThemedText style={styles.modalMessage}>
                  Digite o código de 6 dígitos enviado para {phone}
                </ThemedText>

                <TextInput
                  style={[
                    styles.codeInput,
                    {
                      backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                      borderColor: isDark ? '#444' : '#e5e5e5',
                      color: colors.text,
                    },
                  ]}
                  value={inputCode}
                  onChangeText={setInputCode}
                  placeholder="000000"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />

                <View style={styles.modalButtons}>
                  <View style={styles.modalButton}>
                    <PrimaryButton
                      title="Cancelar"
                      onPress={() => {
                        setShowVerificationDialog(false);
                        setInputCode('');
                      }}
                      style={styles.cancelButtonStyle}
                    />
                  </View>
                  <View style={styles.modalButton}>
                    <PrimaryButton
                      title="Verificar"
                      onPress={handleVerifyCode}
                    />
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  phoneFieldContainer: {
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 8,
  },
  buttonContainer: {
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  codeInput: {
    width: '100%',
    height: 60,
    borderWidth: 2,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: '600',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  cancelButtonStyle: {
    backgroundColor: '#6B7280',
  },
});
