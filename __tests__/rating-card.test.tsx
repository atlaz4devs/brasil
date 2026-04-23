import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { RatingCard } from '../components/ui/rating-card';

const mockOnDelete = jest.fn();
const mockGetUserProfile = jest.fn();

jest.mock('@/services/user-service', () => ({
  getUserProfile: (...args: any[]) => mockGetUserProfile(...args),
}));

jest.mock('@hugeicons/react-native', () => ({
  HugeiconsIcon: () => null,
}));

jest.mock('@hugeicons/core-free-icons', () => ({
  Delete02Icon: 'Delete02Icon',
  Flag01Icon: 'Flag01Icon',
  PencilEdit01Icon: 'PencilEdit01Icon',
}));

describe('RatingCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserProfile.mockResolvedValue({ displayName: 'Danilo' });
  });

  it('abre a confirmação e chama o callback ao excluir', async () => {
    const rating = {
      id: 'rating-1',
      prestadorWhatsapp: '5511999999999',
      prestadorNome: 'João',
      servico: 'Eletricista',
      rating: 5,
      comment: 'Ótimo atendimento e rápido.',
      userId: 'user-1',
      userName: 'Danilo',
      createdAt: new Date('2026-04-01T10:00:00.000Z'),
    } as any;

    render(
      <RatingCard
        rating={rating}
        currentUserId="user-1"
        onDelete={mockOnDelete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Excluir')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByText('Excluir'));
    });

    await waitFor(() => {
      expect(screen.getByText('Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita.')).toBeTruthy();
    });

    const deleteButtons = screen.getAllByText('Excluir');

    await act(async () => {
      fireEvent.press(deleteButtons[deleteButtons.length - 1]);
    });

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith(rating);
    });
  });
});

