import {
  Delete02Icon,
  Flag01Icon,
  PencilEdit01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Rating } from '@/services/rating-service';
import { getUserProfile } from '@/services/user-service';

import { CustomDialog } from './custom-dialog';
import { StarRating } from './star-rating';

interface RatingCardProps {
  rating: Rating;
  currentUserId?: string;
  onEdit?: (rating: Rating) => void;
  onDelete?: (rating: Rating) => void;
  onReport?: (rating: Rating) => void;
  showProviderInfo?: boolean;
}

export function RatingCard({
  rating,
  currentUserId,
  onEdit,
  onDelete,
  onReport,
  showProviderInfo = false,
}: RatingCardProps) {
  const isOwner = currentUserId === rating.userId;
  const [displayName, setDisplayName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  useEffect(() => {
    loadDisplayName();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDisplayName = async () => {
    try {
      const profile = await getUserProfile(rating.userId);
      if (profile?.displayName) {
        setDisplayName(profile.displayName);
      } else if (!rating.userName.includes('@')) {
        setDisplayName(rating.userName);
      } else {
        setDisplayName('Usuário anônimo');
      }
    } catch (error) {
      console.error('Erro ao carregar nome:', error);
      if (!rating.userName.includes('@')) {
        setDisplayName(rating.userName);
      } else {
        setDisplayName('Usuário anônimo');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    setConfirmDeleteVisible(true);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {isLoading ? '...' : displayName}
          </Text>
          <Text style={styles.date}>{formatDate(rating.createdAt)}</Text>
        </View>
        <StarRating value={rating.rating} readonly size={16} spacing={2} />
      </View>

      {showProviderInfo && (
        <>
          <Text style={styles.providerName}>
            Prestador: {rating.prestadorNome}
          </Text>
          <Text style={styles.providerName}>
            Serviço: {rating.servico}
          </Text>
        </>
      )}

      <Text style={styles.comment}>{rating.comment}</Text>

      <View style={styles.actions}>
        {isOwner ? (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onEdit?.(rating)}
            >
              <HugeiconsIcon icon={PencilEdit01Icon} size={18} color="#6B7280" />
              <Text style={styles.actionText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDelete}
            >
              <HugeiconsIcon icon={Delete02Icon} size={18} color="#EF4444" />
              <Text style={[styles.actionText, styles.deleteText]}>Excluir</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onReport?.(rating)}
          >
            <HugeiconsIcon icon={Flag01Icon} size={18} color="#6B7280" />
            <Text style={styles.actionText}>Denunciar</Text>
          </TouchableOpacity>
        )}
      </View>

      <CustomDialog
        visible={confirmDeleteVisible}
        title="Excluir avaliação"
        message="Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita."
        buttons={[
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: () => onDelete?.(rating),
          },
        ]}
        onClose={() => setConfirmDeleteVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  providerName: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  comment: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    color: '#6B7280',
  },
  deleteText: {
    color: '#EF4444',
  },
});
