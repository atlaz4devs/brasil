import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ShowOptions {
  backgroundColor?: string;
  label?: string;
  onPress?: () => void;
  duration?: number;
}

interface SnackbarContextType {
  show: (message: string, options?: ShowOptions) => void;
  hide: () => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

interface SnackbarProviderProps {
  children: React.ReactNode;
}

export function SnackbarProvider({ children }: SnackbarProviderProps) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [options, setOptions] = useState<ShowOptions>({});
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const insets = useSafeAreaInsets();

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  }, [translateY, opacity]);

  const show = useCallback(
    (msg: string, opts: ShowOptions = {}) => {
      // Limpa timeout anterior se existir
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setMessage(msg);
      setOptions(opts);
      setVisible(true);

      // Anima entrada
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide após duration (padrão 3 segundos)
      const duration = opts.duration ?? 3000;
      timeoutRef.current = setTimeout(() => {
        hide();
      }, duration);
    },
    [translateY, opacity, hide]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleActionPress = () => {
    if (options.onPress) {
      options.onPress();
    }
    hide();
  };

  return (
    <SnackbarContext.Provider value={{ show, hide }}>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        presentationStyle="overFullScreen"
        onRequestClose={hide}
      >
        <View pointerEvents="box-none" style={styles.modalRoot}>
          <Animated.View
            style={[
              styles.container,
              {
                top: insets.top + 10,
                transform: [{ translateY }],
                opacity,
                backgroundColor: options.backgroundColor || '#323232',
              },
            ]}
          >
            <View style={styles.content}>
              <Text style={styles.message} numberOfLines={2}>
                {message}
              </Text>
              {options.label && (
                <TouchableOpacity onPress={handleActionPress} style={styles.actionButton}>
                  <Text style={styles.actionText}>{options.label}</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar(): SnackbarContextType {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  modalRoot: {
    flex: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  message: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    marginLeft: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    color: '#bb86fc',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
