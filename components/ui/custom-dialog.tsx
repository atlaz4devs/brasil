import React from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

import { PrimaryButton } from './primary-button';

export interface DialogButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: DialogButton[];
  onClose?: () => void;
  closeOnBackdrop?: boolean;
}

export function CustomDialog({
  visible,
  title,
  message,
  buttons = [{ text: 'OK' }],
  onClose,
  closeOnBackdrop = false,
}: CustomDialogProps) {
  const handleBackdropPress = () => {
    if (closeOnBackdrop && onClose) {
      onClose();
    }
  };

  const handleButtonPress = (button: DialogButton) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.dialog}>
              <Text style={styles.title}>{title}</Text>
              
              {message && <Text style={styles.message}>{message}</Text>}

              <View style={styles.buttonsContainer}>
                {buttons.map((button, index) => {
                  if (button.style === 'cancel') {
                    return (
                      <TouchableOpacity
                        key={index}
                        style={styles.cancelButton}
                        onPress={() => handleButtonPress(button)}
                      >
                        <Text style={styles.cancelButtonText}>{button.text}</Text>
                      </TouchableOpacity>
                    );
                  }

                  return (
                    <View key={index} style={styles.primaryButtonContainer}>
                      <PrimaryButton
                        title={button.text}
                        onPress={() => handleButtonPress(button)}
                        style={button.style === 'destructive' ? styles.destructiveButton : undefined}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButtonContainer: {
    width: '100%',
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  destructiveButton: {
    backgroundColor: '#EF4444',
  },
});
