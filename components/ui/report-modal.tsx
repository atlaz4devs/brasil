import React, { useState } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { createReport, REPORT_REASONS, ReportReason } from '@/services/report-service';

import { PrimaryButton } from './primary-button';

interface ReportModalProps {
  visible: boolean;
  ratingId: string;
  reporterId: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function ReportModal({
  visible,
  ratingId,
  reporterId,
  onClose,
  onSuccess,
  onError,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setIsLoading(true);
    try {
      await createReport({
        ratingId,
        reporterId,
        reason: selectedReason,
        description: description.trim() || undefined,
      });
      
      // Limpa o estado
      setSelectedReason(null);
      setDescription('');
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao criar denúncia:', error);
      onError('Erro ao enviar denúncia. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDescription('');
    onClose();
  };

  const reasons = Object.entries(REPORT_REASONS) as [ReportReason, string][];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity
          style={styles.content}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.title}>Denunciar avaliação</Text>
          <Text style={styles.subtitle}>
            Selecione o motivo da denúncia:
          </Text>

          {/* Opções de motivo */}
          <View style={styles.reasonsContainer}>
            {reasons.map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.reasonOption,
                  selectedReason === key && styles.reasonOptionSelected,
                ]}
                onPress={() => setSelectedReason(key)}
              >
                <View style={styles.radioOuter}>
                  {selectedReason === key && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.reasonLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Campo de descrição adicional */}
          {selectedReason === 'other' && (
            <TextInput
              style={styles.descriptionInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Descreva o motivo..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          )}

          {/* Botões */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <View style={styles.submitButtonContainer}>
              <PrimaryButton
                title="Enviar denúncia"
                onPress={handleSubmit}
                loading={isLoading}
                disabled={!selectedReason}
              />
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  reasonsContainer: {
    marginBottom: 16,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  reasonOptionSelected: {
    backgroundColor: '#F3F4F6',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1C1C1E',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1C1C1E',
  },
  reasonLabel: {
    fontSize: 15,
    color: '#1F2937',
  },
  descriptionInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 80,
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  submitButtonContainer: {
    flex: 1,
  },
});
