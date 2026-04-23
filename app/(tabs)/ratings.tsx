import { StarIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSnackbar } from '../../components/ui/snackbar';

import { RatingCard } from '@/components/ui/rating-card';
import { ReportModal } from '@/components/ui/report-modal';
import { useAuth } from '@/contexts/auth-context';
import {
  deleteRating,
  formatWhatsappDisplay,
  getRatingsByUser,
  Rating,
} from '@/services/rating-service';

export default function RatingsScreen() {
  const { user } = useAuth();
  const { show } = useSnackbar();

  const [ratings, setRatings] = useState<Rating[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal de denúncia
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedRatingForReport, setSelectedRatingForReport] = useState<Rating | null>(null);

  const loadRatings = useCallback(async () => {
    if (!user) return;

    try {
      const userRatings = await getRatingsByUser(user.uid);
      setRatings(userRatings);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
      show('Erro ao carregar avaliações.', { backgroundColor: '#ba1a1a' });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  // Recarrega quando a tela recebe foco
  useFocusEffect(
    useCallback(() => {
      loadRatings();
    }, [loadRatings])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadRatings();
  };

  const handleNewRating = () => {
    router.push('/rating/new');
  };

  const handleEditRating = (rating: Rating) => {
    router.push({
      pathname: '/rating/[id]',
      params: { id: rating.id },
    });
  };

  const handleDeleteRating = async (rating: Rating) => {
    console.log(rating);
    try {
      await deleteRating(rating.id);
      show('Avaliação excluída com sucesso!', { backgroundColor: '#006e1c' });
      setRatings((currentRatings) => currentRatings.filter((r) => r.id !== rating.id));
    } catch (error) {
      console.error('Erro ao excluir avaliação:', error);
      show('Erro ao excluir avaliação. Tente novamente.', { backgroundColor: '#ba1a1a' });
    }
  };

  const handleReportRating = (rating: Rating) => {
    setSelectedRatingForReport(rating);
    setReportModalVisible(true);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <HugeiconsIcon icon={StarIcon} size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>Nenhuma avaliação ainda</Text>
      <Text style={styles.emptySubtitle}>
        Você ainda não avaliou nenhum prestador de serviços.
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleNewRating}>
        <Text style={styles.emptyButtonText}>Fazer primeira avaliação</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRatingItem = ({ item }: { item: Rating }) => (
    <View style={styles.ratingItemContainer}>
      <Text style={styles.providerWhatsapp}>
        {formatWhatsappDisplay(item.prestadorWhatsapp)} • {item.prestadorNome} • {item.servico}
      </Text>
      <RatingCard
        rating={item}
        currentUserId={user?.uid}
        onEdit={handleEditRating}
        onDelete={handleDeleteRating}
        onReport={handleReportRating}
        showProviderInfo={false}
      />
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color="#1C1C1E" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minhas avaliações</Text>
        <Text style={styles.headerSubtitle}>
          {ratings.length} {ratings.length === 1 ? 'avaliação feita' : 'avaliações feitas'}
        </Text>
      </View>

      {/* Lista de avaliações */}
      <FlatList
        data={ratings}
        keyExtractor={(item) => item.id}
        renderItem={renderRatingItem}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#1C1C1E']}
            tintColor="#1C1C1E"
          />
        }
      />

      {/* Botão de nova avaliação */}
      {ratings.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleNewRating}>
          <Text style={styles.fabText}>+ Nova avaliação</Text>
        </TouchableOpacity>
      )}

      {/* Modal de denúncia */}
      {selectedRatingForReport && (
        <ReportModal
          visible={reportModalVisible}
          ratingId={selectedRatingForReport.id}
          reporterId={user?.uid || ''}
          onClose={() => {
            setReportModalVisible(false);
            setSelectedRatingForReport(null);
          }}
          onSuccess={() => {
            show('Denúncia enviada com sucesso!', { backgroundColor: '#006e1c' });
          }}
          onError={(error) => {
            show(error, { backgroundColor: '#ba1a1a' });
          }}
        />
      )}
    </SafeAreaView>
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 100,
    flexGrow: 1,
  },
  ratingItemContainer: {
    marginBottom: 8,
  },
  providerWhatsapp: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0066FF',
    marginBottom: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  emptyButton: {
    marginTop: 24,
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    backgroundColor: '#1C1C1E',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
