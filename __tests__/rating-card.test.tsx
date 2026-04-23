import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { RatingCard } from '../components/ui/rating-card';

const mockOnDeletePress = jest.fn();
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

  it('solicita exclusão ao clicar no botão', async () => {
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
        onDeletePress={mockOnDeletePress}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Excluir')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Excluir'));

    expect(mockOnDeletePress).toHaveBeenCalledWith(rating);
  });
});

