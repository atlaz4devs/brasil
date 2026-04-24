import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface ServiceSelectProps {
  services: string[];
  selectedService: string;
  onSelectService: (service: string) => void;
  placeholder?: string;
  label?: string;
  allowCustom?: boolean;
}

export function ServiceSelect({
  services,
  selectedService,
  onSelectService,
  placeholder = 'Selecione um serviÃ§o',
  label,
  allowCustom = false,
}: ServiceSelectProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customService, setCustomService] = useState('');

  const closeModal = () => {
    setModalVisible(false);
    setShowCustomInput(false);
    setCustomService('');
  };

  const handleSelect = (service: string) => {
    if (service === 'OUTRO') {
      setShowCustomInput(true);
      return;
    }

    onSelectService(service);
    closeModal();
  };

  const handleCustomSubmit = () => {
    if (customService.trim()) {
      onSelectService(customService.trim());
      closeModal();
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.selectText, !selectedService && styles.placeholder]}>
          {selectedService || placeholder}
        </Text>
        <HugeiconsIcon icon={ArrowDown01Icon} size={20} color="#6B7280" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalKeyboardAvoiding}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {showCustomInput ? 'Novo serviÃ§o' : 'Selecione o serviÃ§o'}
                </Text>
                <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>Fechar</Text>
                </TouchableOpacity>
              </View>

              {showCustomInput ? (
                <ScrollView
                  contentContainerStyle={styles.customInputContainer}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.customInputLabel}>Digite o nome do serviÃ§o:</Text>
                  <TextInput
                    style={styles.customInput}
                    value={customService}
                    onChangeText={setCustomService}
                    placeholder="Ex: Eletricista, Encanador..."
                    placeholderTextColor="#9CA3AF"
                    autoFocus
                    returnKeyType="done"
                    blurOnSubmit
                    onSubmitEditing={handleCustomSubmit}
                  />
                  <View style={styles.customButtons}>
                    <TouchableOpacity
                      style={styles.customButtonCancel}
                      onPress={() => {
                        setShowCustomInput(false);
                        setCustomService('');
                      }}
                    >
                      <Text style={styles.customButtonCancelText}>Voltar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.customButtonConfirm,
                        !customService.trim() && styles.customButtonDisabled,
                      ]}
                      onPress={handleCustomSubmit}
                      disabled={!customService.trim()}
                    >
                      <Text style={styles.customButtonConfirmText}>Confirmar</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              ) : (
                <>
                  {allowCustom && (
                    <View style={styles.topAction}>
                      <TouchableOpacity
                        style={styles.otherOptionButton}
                        onPress={() => handleSelect('OUTRO')}
                      >
                        <Text style={styles.otherOptionText}>+ Outro serviÃ§o</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <ScrollView style={styles.optionsList} keyboardShouldPersistTaps="handled">
                    {services.map((service) => (
                      <TouchableOpacity
                        key={service}
                        style={[
                          styles.optionItem,
                          selectedService === service && styles.optionItemSelected,
                        ]}
                        onPress={() => handleSelect(service)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            selectedService === service && styles.optionTextSelected,
                          ]}
                        >
                          {service}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  selectText: {
    fontSize: 15,
    color: '#1F2937',
    flex: 1,
  },
  placeholder: {
    color: '#9CA3AF',
  },
  modalKeyboardAvoiding: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#0066FF',
    fontWeight: '500',
  },
  optionsList: {
    flex: 1,
  },
  optionItem: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionItemSelected: {
    backgroundColor: '#EBF5FF',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
  },
  optionTextSelected: {
    color: '#0066FF',
    fontWeight: '600',
  },
  topAction: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  otherOptionText: {
    color: '#0066FF',
    fontWeight: '600',
  },
  otherOptionButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#EEF4FF',
  },
  customInputContainer: {
    padding: 24,
  },
  customInputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  customInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 16,
  },
  customButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  customButtonCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  customButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  customButtonConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
  },
  customButtonDisabled: {
    opacity: 0.5,
  },
  customButtonConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
