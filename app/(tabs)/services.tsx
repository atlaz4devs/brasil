import { Search01Icon, StarIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSnackbar } from '../../components/ui/snackbar';

import { RatingsModal } from '@/components/ui/ratings-modal';
import { ReportModal } from '@/components/ui/report-modal';
import { ServiceSelect } from '@/components/ui/service-select';
import { useAuth } from '@/contexts/auth-context';
import {
    calculateAverageRating,
    deleteRating,
    formatWhatsappDisplay,
    getRatingsByService,
    getRatingsByWhatsapp,
    getUniqueServices,
    Rating,
} from '@/services/rating-service';

interface ProviderInfo {
  prestadorNome: string;
  prestadorWhatsapp: string;
  servicos: string[];
  ratings: Rating[];
  averageRating: number;
}

export default function ServicesScreen() {
  const { user } = useAuth();
  const { show } = useSnackbar();

  const [availableServices, setAvailableServices] = useState<string[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [searchService, setSearchService] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Modais
  const [selectedProvider, setSelectedProvider] = useState<ProviderInfo | null>(null);
  const [ratingsModalVisible, setRatingsModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedRatingForReport, setSelectedRatingForReport] = useState<Rating | null>(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const services = await getUniqueServices();
      setAvailableServices(services);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      show('Erro ao carregar serviços.', { backgroundColor: '#ba1a1a' });
    } finally {
      setIsLoadingServices(false);
    }
  };

  const handleSearch = async () => {
    if (!searchService || searchService.trim().length === 0) {
      show('Selecione um serviço.', { backgroundColor: '#ba1a1a' });
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const results = await getRatingsByService(searchService.trim());
      
      // Encontra WhatsApps únicos
      const uniqueWhatsapps = [...new Set(results.map(r => r.prestadorWhatsapp))];
      
      // Para cada WhatsApp, busca TODAS as avaliações
      const providersList: ProviderInfo[] = [];
      
      for (const whatsapp of uniqueWhatsapps) {
        const allRatings = await getRatingsByWhatsapp(whatsapp);
        const firstRating = results.find(r => r.prestadorWhatsapp === whatsapp)!;
        
        providersList.push({
          prestadorNome: firstRating.prestadorNome,
          prestadorWhatsapp: whatsapp,
          servicos: [...new Set(allRatings.map(r => r.servico))],
          ratings: allRatings,
          averageRating: calculateAverageRating(allRatings),
        });
      }

      // Ordena por média de avaliação (maior primeiro)
      providersList.sort((a, b) => b.averageRating - a.averageRating);

      setProviders(providersList);
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      show('Erro ao buscar serviços. Tente novamente.', { backgroundColor: '#ba1a1a' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleProviderPress = async (provider: ProviderInfo) => {
    try {
      // Busca TODAS as avaliações deste WhatsApp
      const allRatings = await getRatingsByWhatsapp(provider.prestadorWhatsapp);
      
      // Atualiza o provider com todas as avaliações
      const updatedProvider = {
        ...provider,
        ratings: allRatings,
        averageRating: calculateAverageRating(allRatings),
        servicos: [...new Set(allRatings.map(r => r.servico))],
      };
      
      setSelectedProvider(updatedProvider);
      setRatingsModalVisible(true);
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
      show('Erro ao carregar avaliações.', { backgroundColor: '#ba1a1a' });
    }
  };

  const handleEditRating = (rating: Rating) => {
    router.push({
      pathname: '/rating/[id]',
      params: { id: rating.id },
    });
  };

  const handleDeleteRating = async (rating: Rating) => {
    if (!selectedProvider) return;

    try {
      await deleteRating(rating.id);
      show('Avaliação excluída com sucesso!', { backgroundColor: '#006e1c' });
      
      // Atualiza a lista do provider atual
      const updatedRatings = selectedProvider.ratings.filter((r) => r.id !== rating.id);
      
      if (updatedRatings.length === 0) {
        // Remove o provider se não tiver mais avaliações
        setProviders((currentProviders) =>
          currentProviders.filter((p) =>
            p.prestadorWhatsapp !== selectedProvider.prestadorWhatsapp
          )
        );
        setRatingsModalVisible(false);
        setSelectedProvider(null);
      } else {
        // Recalcula lista de serviços únicos
        const uniqueServices = [...new Set(updatedRatings.map(r => r.servico))];
        
        // Atualiza o provider
        const updatedProvider = {
          ...selectedProvider,
          ratings: updatedRatings,
          servicos: uniqueServices,
          averageRating: calculateAverageRating(updatedRatings),
        };
        setSelectedProvider(updatedProvider);
        setProviders((currentProviders) =>
          currentProviders.map((p) =>
            p.prestadorWhatsapp === selectedProvider.prestadorWhatsapp ? updatedProvider : p
          )
        );
      }
    } catch (error) {
      console.error('Erro ao excluir avaliação:', error);
      show('Erro ao excluir avaliação. Tente novamente.', { backgroundColor: '#ba1a1a' });
    }
  };

  const handleReportRating = (rating: Rating) => {
    setSelectedRatingForReport(rating);
    setReportModalVisible(true);
  };

  const renderProviderCard = ({ item }: { item: ProviderInfo }) => (
    <TouchableOpacity 
      style={styles.providerCard}
      onPress={() => handleProviderPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.providerInfo}>
        <Text style={styles.providerName}>{item.prestadorNome}</Text>
        <Text style={styles.providerService}>{item.servicos.join(', ')}</Text>
        <Text style={styles.providerWhatsapp}>
          {formatWhatsappDisplay(item.prestadorWhatsapp)}
        </Text>
      </View>
      <View style={styles.providerStats}>
        <View style={styles.ratingBadge}>
          <HugeiconsIcon icon={StarIcon} size={20} color="#FFB800" fill="#FFB800" />
          <Text style={styles.ratingValue}>{item.averageRating.toFixed(1)}</Text>
        </View>
        <Text style={styles.totalRatings}>
          {item.ratings.length} {item.ratings.length === 1 ? 'avaliação' : 'avaliações'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (!hasSearched) {
      return (
        <View style={styles.emptyState}>
          <HugeiconsIcon icon={Search01Icon} size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Busque por serviço</Text>
          <Text style={styles.emptySubtitle}>
            Digite o tipo de serviço que procura{'\n'}
            Ex: Eletricista, Encanador, Jardineiro...
          </Text>
        </View>
      );
    }

    if (providers.length === 0) {
      return (
        <View style={styles.emptyState}>
          <HugeiconsIcon icon={StarIcon} size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Nenhum prestador encontrado</Text>
          <Text style={styles.emptySubtitle}>
            Não encontramos prestadores para este serviço
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Buscar por Serviço</Text>
        <Text style={styles.headerSubtitle}>
          Encontre prestadores por tipo de serviço
        </Text>
      </View>

      {/* Busca */}
      <View style={styles.searchSection}>
        {isLoadingServices ? (
          <View style={styles.loadingServices}>
            <ActivityIndicator color="#1C1C1E" size="small" />
            <Text style={styles.loadingText}>Carregando serviços...</Text>
          </View>
        ) : availableServices.length === 0 ? (
          <View style={styles.noServicesContainer}>
            <Text style={styles.noServicesText}>
              Nenhum serviço cadastrado ainda
            </Text>
          </View>
        ) : (
          <>
            <ServiceSelect
              services={availableServices}
              selectedService={searchService}
              onSelectService={setSearchService}
              placeholder="Selecione um serviço"
              label="Tipo de serviço"
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
          </>
        )}
      </View>

      {/* Resultados */}
      {isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1C1C1E" />
        </View>
      ) : (
        <FlatList
          data={providers}
          keyExtractor={(item) => item.prestadorWhatsapp}
          renderItem={renderProviderCard}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal de avaliações */}
      {selectedProvider && (
        <RatingsModal
          visible={ratingsModalVisible}
          ratings={selectedProvider.ratings}
          currentUserId={user?.uid}
          providerName={selectedProvider.prestadorNome}
          onClose={() => {
            setRatingsModalVisible(false);
            setSelectedProvider(null);
          }}
          onEdit={handleEditRating}
          onDelete={handleDeleteRating}
          onReport={handleReportRating}
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
  loadingServices: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  noServicesContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noServicesText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    height: 56,
    gap: 8,
    marginTop: 12,
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
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  providerCard: {
    backgroundColor: '#EBF5FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
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
});

