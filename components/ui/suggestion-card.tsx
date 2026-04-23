import { Cancel01Icon, ThumbsUpIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  getStatusColor,
  getStatusLabel,
  hasVoted,
  Suggestion,
} from '@/services/suggestion-service';

interface SuggestionCardProps {
  suggestion: Suggestion;
  currentUserId: string;
  onVote: (suggestion: Suggestion) => void;
}

export function SuggestionCard({
  suggestion,
  currentUserId,
  onVote,
}: SuggestionCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];
  const voted = hasVoted(suggestion, currentUserId);
  const [modalVisible, setModalVisible] = useState(false);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  return (
    <>
      <Pressable
        style={[
          styles.container,
          { backgroundColor: isDark ? '#1f1f1f' : '#F9FAFB' },
        ]}
        onPress={() => setModalVisible(true)}
      >
        {/* Vote Button */}
        <Pressable
          style={({ pressed }) => [
            styles.voteButton,
            {
              backgroundColor: voted
                ? colors.tint
                : isDark
                  ? '#333'
                  : '#E5E7EB',
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          onPress={(e) => {
            e.stopPropagation();
            onVote(suggestion);
          }}
        >
          <HugeiconsIcon
            icon={ThumbsUpIcon}
            size={20}
            color={voted ? '#fff' : colors.icon}
          />
          <Text
            style={[
              styles.voteCount,
              { color: voted ? '#fff' : colors.text },
            ]}
          >
            {suggestion.votes}
          </Text>
        </Pressable>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.header}>
            <Text
              style={[styles.title, { color: colors.text }]}
              numberOfLines={1}
            >
              {suggestion.title}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(suggestion.status) + '20' },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(suggestion.status) },
                ]}
              >
                {getStatusLabel(suggestion.status)}
              </Text>
            </View>
          </View>

          <Text
            style={[styles.description, { color: isDark ? '#9CA3AF' : '#6B7280' }]}
            numberOfLines={1}
          >
            {suggestion.description}
          </Text>

          <View style={styles.footer}>
            <Text style={[styles.author, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
              {suggestion.authorName} • {formatDate(suggestion.createdAt)}
            </Text>
            <Text style={[styles.seeMore, { color: colors.tint }]}>
              ver mais...
            </Text>
          </View>
        </View>
      </Pressable>

      {/* Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        statusBarTranslucent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#333' : '#E5E7EB' }]}>
            <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>
              Detalhes
            </Text>
            <Pressable onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <HugeiconsIcon icon={Cancel01Icon} size={24} color={colors.icon} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Status Badge */}
            <View style={styles.modalStatusRow}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(suggestion.status) + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(suggestion.status) },
                  ]}
                >
                  {getStatusLabel(suggestion.status)}
                </Text>
              </View>
              <Text style={[styles.modalDate, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
                {formatDate(suggestion.createdAt)}
              </Text>
            </View>

            {/* Title */}
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {suggestion.title}
            </Text>

            {/* Author */}
            <Text style={[styles.modalAuthor, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              Sugerido por {suggestion.authorName}
            </Text>

            {/* Description */}
            <Text style={[styles.modalDescription, { color: colors.text }]}>
              {suggestion.description}
            </Text>

            {/* Vote Section */}
            <View style={[styles.modalVoteSection, { borderTopColor: isDark ? '#333' : '#E5E7EB' }]}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalVoteButton,
                  {
                    backgroundColor: voted
                      ? colors.tint
                      : isDark
                        ? '#333'
                        : '#E5E7EB',
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                onPress={() => onVote(suggestion)}
              >
                <HugeiconsIcon
                  icon={ThumbsUpIcon}
                  size={24}
                  color={voted ? '#fff' : colors.icon}
                />
                <Text
                  style={[
                    styles.modalVoteText,
                    { color: voted ? '#fff' : colors.text },
                  ]}
                >
                  {voted ? 'Votado' : 'Votar'}
                </Text>
                <Text
                  style={[
                    styles.modalVoteCount,
                    { color: voted ? '#fff' : colors.text },
                  ]}
                >
                  {suggestion.votes}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  voteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minWidth: 52,
    gap: 4,
  },
  voteCount: {
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    marginBottom: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  author: {
    fontSize: 12,
  },
  seeMore: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalDate: {
    fontSize: 13,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalAuthor: {
    fontSize: 14,
    marginBottom: 20,
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 24,
  },
  modalVoteSection: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  modalVoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  modalVoteText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalVoteCount: {
    fontSize: 16,
    fontWeight: '700',
  },
});
