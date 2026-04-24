import { router, Stack, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSnackbar } from '../../components/ui/snackbar';

import { InputField, type InputFieldRef } from '@/components/ui/input-field';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ServiceSelect } from '@/components/ui/service-select';
import { StarRating } from '@/components/ui/star-rating';
import { WhatsappInput, type WhatsappInputRef } from '@/components/ui/whatsapp-input';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/firebaseConfig';
import {
    createRating,
    getUniqueServices,
    Rating,
    updateRating,
} from '@/services/rating-service';
import { getUserProfile } from '@/services/user-service';

export default function RatingFormScreen() {
  const { id, whatsapp: initialWhatsapp } = useLocalSearchParams<{
    id: string;
    whatsapp?: string;
  }>();
  const { user } = useAuth();
  const { show } = useSnackbar();

  const isEditing = id !== 'new';

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditing);
  const [availableServices, setAvailableServices] = useState<string[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  // Form state
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp || '');
  const [prestadorNome, setPrestadorNome] = useState('');
  const [servico, setServico] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  // Erros de validação
  const [errors, setErrors] = useState<{
    whatsapp?: string;
    prestadorNome?: string;
    servico?: string;
    rating?: string;
    comment?: string;
  }>({});

  const scrollViewRef = useRef<ScrollView>(null);
  const scrollViewY = useRef(0);
  const whatsappRef = useRef<WhatsappInputRef>(null);
  const prestadorRef = useRef<InputFieldRef>(null);
  const commentRef = useRef<TextInput>(null);
  const keyboardTopRef = useRef(Dimensions.get('window').height);
  const keyboardVisibleRef = useRef(false);
  const keyboardSettledTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyboardScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingFocusRef = useRef<{ y: number; height: number } | null>(null);

  // Carrega serviços disponíveis
  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Carrega dados da avaliação se estiver editando
  useEffect(() => {
    if (isEditing && id) {
      loadRating();
    }
  }, [id, isEditing, loadRating]);

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

  const handleCommentFocus = useCallback(() => {
    commentRef.current?.measureInWindow((...measure) => {
      const [, y, , height] = measure;
      handleInputFocus({ y, height });
    });
  }, [handleInputFocus]);

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

  const loadServices = useCallback(async () => {
    try {
      const services = await getUniqueServices();
      setAvailableServices(services);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    } finally {
      setIsLoadingServices(false);
    }
  }, []);

  const loadRating = useCallback(async () => {
    try {
      const docRef = doc(db, 'ratings', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as Rating;
        setWhatsapp(data.prestadorWhatsapp);
        setPrestadorNome(data.prestadorNome || '');
        setServico(data.servico || '');
        setRating(data.rating);
        setComment(data.comment);
      } else {
        show('Avaliação não encontrada.', { backgroundColor: '#ba1a1a' });
        router.back();
      }
    } catch (error) {
      console.error('Erro ao carregar avaliação:', error);
      show('Erro ao carregar avaliação.', { backgroundColor: '#ba1a1a' });
      router.back();
    } finally {
      setIsFetching(false);
    }
  }, [id, show]);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!whatsapp || whatsapp.length < 10) {
      newErrors.whatsapp = 'Digite um número de WhatsApp válido.';
    }

    if (!prestadorNome.trim()) {
      newErrors.prestadorNome = 'O nome do prestador é obrigatório.';
    }

    if (!servico.trim()) {
      newErrors.servico = 'O serviço prestado é obrigatório.';
    }

    if (rating === 0) {
      newErrors.rating = 'Selecione uma avaliação de 1 a 5 estrelas.';
    }

    if (!comment.trim()) {
      newErrors.comment = 'O comentário é obrigatório.';
    } else if (comment.trim().length < 10) {
      newErrors.comment = 'O comentário deve ter pelo menos 10 caracteres.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    if (!user) {
      show('Você precisa estar logado para avaliar.', { backgroundColor: '#ba1a1a' });
      return;
    }

    setIsLoading(true);

    try {
      if (isEditing) {
        await updateRating(id, {
          prestadorNome: prestadorNome.trim(),
          servico: servico.trim(),
          rating,
          comment: comment.trim(),
        });
        show('Avaliação atualizada com sucesso!', { backgroundColor: '#006e1c' });
      } else {
        // Busca o nome de exibição do perfil do usuário
        const profile = await getUserProfile(user.uid);
        const displayName = profile?.displayName || user.displayName || user.email || 'Usuário';

        await createRating({
          prestadorWhatsapp: whatsapp,
          prestadorNome: prestadorNome.trim(),
          servico: servico.trim(),
          rating,
          comment: comment.trim(),
          userId: user.uid,
          userName: displayName,
        });
        show('Avaliação criada com sucesso!', { backgroundColor: '#006e1c' });
      }

      router.back();
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      show('Erro ao salvar avaliação. Tente novamente.', { backgroundColor: '#ba1a1a' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1C1C1E" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditing ? 'Editar avaliação' : 'Nova avaliação',
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
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
        {/* Formulário */}
        <View style={styles.form}>
          {/* WhatsApp do prestador */}
          <WhatsappInput
            ref={whatsappRef}
            value={whatsapp}
            onChangeValue={setWhatsapp}
            label="WhatsApp do prestador"
            readonly={isEditing}
            error={errors.whatsapp}
            onFocusWithPosition={handleInputFocus}
          />

          {/* Nome do prestador */}
          <InputField
            ref={prestadorRef}
            label="Nome do prestador"
            value={prestadorNome}
            onChangeText={setPrestadorNome}
            placeholder="Ex: João Silva"
            error={errors.prestadorNome}
            onFocusWithPosition={handleInputFocus}
          />

          {/* Serviço prestado */}
          {isLoadingServices ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#1C1C1E" />
            </View>
          ) : (
            <ServiceSelect
              services={availableServices}
              selectedService={servico}
              onSelectService={setServico}
              placeholder="Selecione o serviço prestado"
              label="Serviço prestado"
              allowCustom={true}
            />
          )}
          {errors.servico && <Text style={styles.errorText}>{errors.servico}</Text>}

          {/* Avaliação em estrelas */}
          <View style={styles.ratingSection}>
            <Text style={styles.label}>Sua avaliação</Text>
            <StarRating value={rating} onChange={setRating} size={40} spacing={8} />
            {errors.rating && <Text style={styles.errorText}>{errors.rating}</Text>}
          </View>

          {/* Comentário */}
          <View style={styles.commentSection}>
            <Text style={styles.label}>Comentário</Text>
            <TextInput
              ref={commentRef}
              style={[styles.commentInput, errors.comment && styles.commentInputError]}
              value={comment}
              onChangeText={setComment}
              placeholder="Conte sua experiência com este prestador..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              onFocus={handleCommentFocus}
            />
            {errors.comment && <Text style={styles.errorText}>{errors.comment}</Text>}
            <Text style={styles.charCount}>{comment.length} caracteres</Text>
          </View>

          {/* Botão de enviar */}
          <PrimaryButton
            title={isEditing ? 'Salvar alterações' : 'Enviar avaliação'}
            onPress={handleSubmit}
            loading={isLoading}
          />

          {/* Botão de cancelar */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 96,
  },
  form: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  ratingSection: {
    marginBottom: 24,
  },
  commentSection: {
    marginBottom: 24,
  },
  commentInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 120,
  },
  commentInputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  cancelButton: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
});
