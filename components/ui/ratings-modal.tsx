import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Rating } from '@/services/rating-service';

import { CustomDialog } from './custom-dialog';
import { RatingCard } from './rating-card';

interface RatingsModalProps {
  visible: boolean;
  ratings: Rating[];
  currentUserId?: string;
  providerName: string;
  onClose: () => void;
  onEdit?: (rating: Rating) => void;
  onDelete?: (rating: Rating) => void;
  onDeletePress?: (rating: Rating) => void;
  onReport?: (rating: Rating) => void;
  deleteConfirmVisible?: boolean;
  pendingDeleteRating?: Rating | null;
  onDeleteConfirm?: (rating: Rating) => void;
  onDeleteCancel?: () => void;
}

export function RatingsModal({
  visible,
  ratings,
  currentUserId,
  providerName,
  onClose,
  onEdit,
  onDelete,
  onDeletePress,
  onReport,
  deleteConfirmVisible = false,
  pendingDeleteRating = null,
  onDeleteConfirm,
  onDeleteCancel,
}: RatingsModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Avaliações</Text>
            <Text style={styles.subtitle}>{providerName}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <HugeiconsIcon icon={Cancel01Icon} size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        {/* Lista de avaliações */}
        <FlatList
          data={ratings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RatingCard
              rating={item}
              currentUserId={currentUserId}
              onEdit={onEdit}
              onDelete={onDelete}
              onDeletePress={onDeletePress}
              onReport={onReport}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {pendingDeleteRating && (
          <CustomDialog
            visible={deleteConfirmVisible}
            title="Excluir avaliação"
            message="Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita."
            buttons={[
              {
                text: 'Cancelar',
                style: 'cancel',
                onPress: onDeleteCancel,
              },
              {
                text: 'Excluir',
                style: 'destructive',
                onPress: () => onDeleteConfirm?.(pendingDeleteRating),
              },
            ]}
            onClose={onDeleteCancel}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
});

