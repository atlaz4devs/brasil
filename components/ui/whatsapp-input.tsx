import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { COUNTRIES, Country, findCountryByDialCode, getDefaultCountry } from '@/constants/countries';

interface WhatsappInputProps {
  value: string;
  onChangeValue: (fullNumber: string) => void;
  label?: string;
  placeholder?: string;
  readonly?: boolean;
  error?: string;
  isDark?: boolean;
  testID?: string;
}

export function WhatsappInput({
  value,
  onChangeValue,
  label = 'WhatsApp',
  placeholder,
  readonly = false,
  error,
  isDark = false,
  testID,
}: WhatsappInputProps) {
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(getDefaultCountry());
  const [localValue, setLocalValue] = useState('');
  const [countryFilter, setCountryFilter] = useState('');

  // Inicializa o valor local baseado no value prop
  React.useEffect(() => {
    if (value) {
      const digits = value.replace(/\D/g, '');
      
      // Detecta o país pelo prefixo
      const detectedCountry = findCountryByDialCode(digits);
      
      if (detectedCountry) {
        const dialDigits = detectedCountry.dialCode.replace(/\D/g, '');
        setSelectedCountry(detectedCountry);
        setLocalValue(formatPhoneNumber(digits.slice(dialDigits.length), detectedCountry));
      } else {
        setLocalValue(digits);
      }
    } else {
      setLocalValue('');
    }
  }, [value]);

  const formatPhoneNumber = (digits: string, country: Country): string => {
    if (!digits) return '';
    
    // Formata apenas Brasil e Paraguai que têm máscaras específicas
    if (country.code === 'BR') {
      // (XX) XXXXX-XXXX
      const match = digits.match(/^(\d{0,2})(\d{0,5})(\d{0,4})$/);
      if (match) {
        let formatted = '';
        if (match[1]) formatted = `(${match[1]}`;
        if (match[1]?.length === 2) formatted += ') ';
        if (match[2]) formatted += match[2];
        if (match[2]?.length === 5) formatted += '-';
        if (match[3]) formatted += match[3];
        return formatted;
      }
    } else if (country.code === 'PY') {
      // (XXX) XXX-XXX
      const match = digits.match(/^(\d{0,3})(\d{0,3})(\d{0,3})$/);
      if (match) {
        let formatted = '';
        if (match[1]) formatted = `(${match[1]}`;
        if (match[1]?.length === 3) formatted += ') ';
        if (match[2]) formatted += match[2];
        if (match[2]?.length === 3) formatted += '-';
        if (match[3]) formatted += match[3];
        return formatted;
      }
    }
    
    // Para outros países, retorna os dígitos sem formatação
    return digits;
  };

  const handleTextChange = (text: string) => {
    if (readonly) return;
    
    // Remove tudo que não é dígito
    const digits = text.replace(/\D/g, '');
    
    // Limita o tamanho baseado no país
    let maxLength = 15; // default
    if (selectedCountry.code === 'BR') maxLength = 11;
    else if (selectedCountry.code === 'PY') maxLength = 9;
    
    const limitedDigits = digits.slice(0, maxLength);
    
    // Formata para exibição
    const formatted = formatPhoneNumber(limitedDigits, selectedCountry);
    setLocalValue(formatted);
    
    // Envia o número completo (código do país + número)
    const dialDigits = selectedCountry.dialCode.replace(/\D/g, '');
    onChangeValue(limitedDigits ? `${dialDigits}${limitedDigits}` : '');
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
    setCountryFilter('');
    
    // Recalcula o valor com o novo código de país
    const digits = localValue.replace(/\D/g, '');
    const dialDigits = country.dialCode.replace(/\D/g, '');
    onChangeValue(digits ? `${dialDigits}${digits}` : '');
  };

  const filteredCountries = COUNTRIES.filter(country => {
    if (!countryFilter) return true;
    const search = countryFilter.toLowerCase();
    return (
      country.name.toLowerCase().includes(search) ||
      country.dialCode.includes(search) ||
      country.code.toLowerCase().includes(search)
    );
  });

  const effectivePlaceholder = placeholder || selectedCountry.placeholder;

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, isDark && styles.labelDark]}>{label}</Text>}
      
      <View style={[
        styles.inputContainer,
        error && styles.inputContainerError,
        isDark && styles.inputContainerDark
      ]}>
        {/* Seletor de país */}
        <TouchableOpacity
          style={styles.countrySelector}
          onPress={() => !readonly && setShowCountryPicker(true)}
          disabled={readonly}
        >
          <Text style={styles.flag}>{selectedCountry.flag}</Text>
          <Text style={[styles.dialCode, isDark && styles.dialCodeDark]}>{selectedCountry.dialCode}</Text>
          {!readonly && (
            <HugeiconsIcon icon={ArrowDown01Icon} size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
          )}
        </TouchableOpacity>

        {/* Separador */}
        <View style={[styles.separator, isDark && styles.separatorDark]} />

        {/* Input do número */}
        <TextInput
          testID={testID}
          style={[styles.input, isDark && styles.inputDark]}
          value={localValue}
          onChangeText={handleTextChange}
          placeholder={effectivePlaceholder}
          placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
          keyboardType="phone-pad"
          editable={!readonly}
        />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Modal de seleção de país */}
      <Modal
        visible={showCountryPicker}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => {
          setShowCountryPicker(false);
          setCountryFilter('');
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowCountryPicker(false);
            setCountryFilter('');
          }}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            style={[styles.modalContent, isDark && styles.modalContentDark]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>Selecione o país</Text>
            
            <TextInput
              style={[styles.filterInput, isDark && styles.filterInputDark]}
              value={countryFilter}
              onChangeText={setCountryFilter}
              placeholder="Buscar país..."
              placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <ScrollView style={styles.countriesList} showsVerticalScrollIndicator={false}>
              {filteredCountries.map((country, index) => {
                const originalIndex = COUNTRIES.findIndex(c => c.code === country.code);
                return (
                  <React.Fragment key={country.code}>
                    <TouchableOpacity
                      style={[
                        styles.countryOption,
                        selectedCountry.code === country.code && (isDark ? styles.countryOptionSelectedDark : styles.countryOptionSelected),
                      ]}
                      onPress={() => handleCountrySelect(country)}
                    >
                      <Text style={styles.countryFlag}>{country.flag}</Text>
                      <Text style={[styles.countryName, isDark && styles.countryNameDark]}>{country.name}</Text>
                      <Text style={[styles.countryDialCode, isDark && styles.countryDialCodeDark]}>{country.dialCode}</Text>
                    </TouchableOpacity>
                    {originalIndex === 1 && !countryFilter && <View style={[styles.countrySeparator, isDark && styles.countrySeparatorDark]} />}
                  </React.Fragment>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
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
  labelDark: {
    color: '#D1D5DB',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 12,
  },
  inputContainerDark: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
  },
  inputContainerError: {
    borderColor: '#EF4444',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 8,
  },
  flag: {
    fontSize: 20,
  },
  dialCode: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  dialCodeDark: {
    color: '#D1D5DB',
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  separatorDark: {
    backgroundColor: '#333',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 0,
  },
  inputDark: {
    color: '#F9FAFB',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 320,
    maxHeight: '80%',
  },
  modalContentDark: {
    backgroundColor: '#1f1f1f',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalTitleDark: {
    color: '#F9FAFB',
  },
  filterInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 12,
  },
  filterInputDark: {
    backgroundColor: '#2a2a2a',
    borderColor: '#444',
    color: '#F9FAFB',
  },
  countriesList: {
    maxHeight: 400,
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  countryOptionSelected: {
    backgroundColor: '#EBF5FF',
  },
  countryOptionSelectedDark: {
    backgroundColor: '#2a3a4a',
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  countryNameDark: {
    color: '#F9FAFB',
  },
  countryDialCode: {
    fontSize: 14,
    color: '#6B7280',
  },
  countryDialCodeDark: {
    color: '#9CA3AF',
  },
  countrySeparator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  countrySeparatorDark: {
    backgroundColor: '#333',
  },
});
