import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { PrimaryButton } from './primary-button';

interface SuggestionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string) => Promise<void>;
}

export function SuggestionModal({
  visible,
  onClose,
  onSubmit,
}: SuggestionModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});

  const validate = () => {
    const newErrors: { title?: string; description?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Título é obrigatório';
    } else if (title.trim().length < 5) {
      newErrors.title = 'Título deve ter pelo menos 5 caracteres';
    }

    if (!description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    } else if (description.trim().length < 10) {
      newErrors.description = 'Descrição deve ter pelo menos 10 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit(title.trim(), description.trim());
      setTitle('');
      setDescription('');
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Erro ao criar sugestão:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setErrors({});
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: isDark ? '#333' : '#E5E7EB' }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Nova Sugestão
          </Text>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <HugeiconsIcon icon={Cancel01Icon} size={24} color={colors.icon} />
          </Pressable>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Título</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#1f1f1f' : '#F9FAFB',
                  color: colors.text,
                  borderColor: errors.title ? '#EF4444' : isDark ? '#333' : '#E5E7EB',
                },
              ]}
              placeholder="Ex: Adicionar modo offline"
              placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Descrição</Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: isDark ? '#1f1f1f' : '#F9FAFB',
                  color: colors.text,
                  borderColor: errors.description ? '#EF4444' : isDark ? '#333' : '#E5E7EB',
                },
              ]}
              placeholder="Descreva sua sugestão em detalhes..."
              placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={500}
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}
            <Text style={[styles.charCount, { color: isDark ? '#666' : '#9CA3AF' }]}>
              {description.length}/500
            </Text>
          </View>

          <PrimaryButton
            title="Enviar Sugestão"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  form: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  textArea: {
    height: 120,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
    fontSize: 15,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
});

