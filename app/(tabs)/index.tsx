import { Search01Icon, StarIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSnackbar } from '../../components/ui/snackbar';

import { RatingsModal } from '@/components/ui/ratings-modal';
import { ReportModal } from '@/components/ui/report-modal';
import { WhatsappInput } from '@/components/ui/whatsapp-input';
import { useAuth } from '@/contexts/auth-context';
import {
  calculateAverageRating,
  deleteRating,
  formatWhatsappDisplay,
  getRatingsByWhatsapp,
  Rating,
} from '@/services/rating-service';

export default function HomeScreen() {
  const { user } = useAuth();
  const { show } = useSnackbar();

  const [searchWhatsapp, setSearchWhatsapp] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Rating[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Modais
  const [ratingsModalVisible, setRatingsModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedRatingForReport, setSelectedRatingForReport] = useState<Rating | null>(null);
  const [pendingDeleteRating, setPendingDeleteRating] = useState<Rating | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const handleSearch = async () => {
    if (!searchWhatsapp || searchWhatsapp.length < 10) {
      show('Digite um número de WhatsApp válido.', { backgroundColor: '#ba1a1a' });
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const results = await getRatingsByWhatsapp(searchWhatsapp);
      setSearchResults(results);
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
      show('Erro ao buscar avaliações. Tente novamente.', { backgroundColor: '#ba1a1a' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleNewRating = () => {
    // Passa o WhatsApp como parâmetro se já foi pesquisado
    if (searchWhatsapp && searchResults !== null) {
      router.push({
        pathname: '/rating/[id]',
        params: { id: 'new', whatsapp: searchWhatsapp },
      });
    } else {
      router.push('/rating/new');
    }
  };

  const handleEditRating = (rating: Rating) => {
    router.push({
      pathname: '/rating/[id]',
      params: { id: rating.id },
    });
  };

  const handleDeletePress = (rating: Rating) => {
    setPendingDeleteRating(rating);
    setDeleteConfirmVisible(true);
  };

  const handleDeleteRating = async (rating: Rating) => {
    try {
      await deleteRating(rating.id);
      show('Avaliação excluída com sucesso!', { backgroundColor: '#006e1c' });
      
      setSearchResults((currentResults) => {
        if (!currentResults) return currentResults;

        const updatedResults = currentResults.filter((r) => r.id !== rating.id);

        if (updatedResults.length === 0) {
          setRatingsModalVisible(false);
        }

        return updatedResults;
      });
    } catch (error) {
      console.error('Erro ao excluir avaliação:', error);
      show('Erro ao excluir avaliação. Tente novamente.', { backgroundColor: '#ba1a1a' });
    }
  };

  const handleReportRating = (rating: Rating) => {
    setSelectedRatingForReport(rating);
    setReportModalVisible(true);
  };

  const averageRating = searchResults ? calculateAverageRating(searchResults) : 0;

  const renderProviderCard = () => {
    if (!searchResults || searchResults.length === 0) return null;

    const firstRating = searchResults[0];

    return (
      <TouchableOpacity 
        style={styles.providerCard}
        onPress={() => setRatingsModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>
            {firstRating.prestadorNome}
          </Text>
          <Text style={styles.providerService}>
            {firstRating.servico}
          </Text>
          <Text style={styles.providerWhatsapp}>
            {formatWhatsappDisplay(searchWhatsapp)}
          </Text>
        </View>
        <View style={styles.providerStats}>
          <View style={styles.ratingBadge}>
            <HugeiconsIcon icon={StarIcon} size={20} color="#FFB800" fill="#FFB800" />
            <Text style={styles.ratingValue}>{averageRating.toFixed(1)}</Text>
          </View>
          <Text style={styles.totalRatings}>
            {searchResults.length} {searchResults.length === 1 ? 'avaliação' : 'avaliações'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (!hasSearched) {
      return (
        <View style={styles.emptyState}>
          <HugeiconsIcon icon={Search01Icon} size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Busque um prestador</Text>
          <Text style={styles.emptySubtitle}>
            Digite o número de WhatsApp para ver as avaliações
          </Text>
        </View>
      );
    }

    if (searchResults?.length === 0) {
      return (
        <View style={styles.emptyState}>
          <HugeiconsIcon icon={StarIcon} size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Nenhuma avaliação encontrada</Text>
          <Text style={styles.emptySubtitle}>
            Seja o primeiro a avaliar este prestador!
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={handleNewRating}>
            <Text style={styles.emptyButtonText}>Avaliar agora</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Consultar Avaliações de Prestador</Text>
        <Text style={styles.headerSubtitle}>
          Encontre avaliações por número de WhatsApp
        </Text>
      </View>

      {/* Busca */}
      <View style={styles.searchSection}>
        <WhatsappInput
          value={searchWhatsapp}
          onChangeValue={setSearchWhatsapp}
          label="WhatsApp do prestador"
        />
        <TouchableOpacity
          style={[styles.searchButton, isSearching && styles.searchButtonDisabled]}
          onPress={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <HugeiconsIcon icon={Search01Icon} size={20} color="#fff" />
              <Text style={styles.searchButtonText}>Buscar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Resultados */}
      {isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1C1C1E" />
        </View>
      ) : (
        <View style={styles.resultsContainer}>
          {renderProviderCard()}
          {renderEmptyState()}
        </View>
      )}

      {/* Botão de nova avaliação */}
      {hasSearched && searchResults !== null && (
        <TouchableOpacity style={styles.fab} onPress={handleNewRating}>
          <Text style={styles.fabText}>+ Avaliar</Text>
        </TouchableOpacity>
      )}

      {/* Modal de avaliações */}
      {searchResults && searchResults.length > 0 && (
        <RatingsModal
          visible={ratingsModalVisible}
          ratings={searchResults}
          currentUserId={user?.uid}
          providerName={searchResults[0].prestadorNome}
          onClose={() => setRatingsModalVisible(false)}
          onEdit={handleEditRating}
          onDelete={handleDeleteRating}
          onDeletePress={handleDeletePress}
          onReport={handleReportRating}
          deleteConfirmVisible={deleteConfirmVisible}
          pendingDeleteRating={pendingDeleteRating}
          onDeleteConfirm={(rating) => {
            handleDeleteRating(rating);
            setDeleteConfirmVisible(false);
            setPendingDeleteRating(null);
          }}
          onDeleteCancel={() => {
            setDeleteConfirmVisible(false);
            setPendingDeleteRating(null);
          }}
        />
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
  searchSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    height: 56,
    gap: 8,
  },
  searchButtonDisabled: {
    opacity: 0.7,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  providerCard: {
    backgroundColor: '#EBF5FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  providerService: {
    fontSize: 14,
    color: '#374151',
    marginTop: 2,
  },
  providerWhatsapp: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  providerStats: {
    alignItems: 'flex-end',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  totalRatings: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
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
