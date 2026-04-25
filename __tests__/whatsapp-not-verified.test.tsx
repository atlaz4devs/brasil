import { render, screen, waitFor } from '@testing-library/react-native';
import WhatsAppNotVerifiedScreen from '../app/(tabs)/whatsapp-not-verified';
import {
  getReusableVerificationCode,
  sendVerificationCodeForUser,
  shouldRevealVerificationCode,
} from '../services/whatsapp-service';
import { getUserProfile } from '../services/user-service';

const mockShow = jest.fn().mockName('snackbar.show');
let mockFocusEffectCalled = false;

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: any) => {
    if (!mockFocusEffectCalled) {
      mockFocusEffectCalled = true;
      callback();
    }
  },
}));

jest.mock('@/firebaseConfig', () => ({
  auth: {
    currentUser: {
      uid: 'user-1',
    },
  },
}));

jest.mock('../services/user-service', () => ({
  getUserProfile: jest.fn().mockName('getUserProfile'),
  updateUserProfile: jest.fn(),
}));

jest.mock('../services/whatsapp-service', () => ({
  getReusableVerificationCode: jest.fn().mockName('getReusableVerificationCode'),
  sendVerificationCodeForUser: jest.fn().mockName('sendVerificationCodeForUser'),
  shouldRevealVerificationCode: jest.fn().mockName('shouldRevealVerificationCode'),
  verifyStoredCode: jest.fn().mockName('verifyStoredCode'),
}));

jest.mock('../components/ui/snackbar', () => ({
  useSnackbar: () => ({ show: mockShow }),
}));

jest.mock('../components/ui/custom-dialog', () => ({
  CustomDialog: () => null,
}));

jest.mock('../components/ui/primary-button', () => ({
  PrimaryButton: ({ title }: { title: string }) => {
    const { Text } = require('react-native');
    return Text ? <Text>{title}</Text> : title;
  },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('firebase/auth', () => ({
  signOut: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

describe('WhatsAppNotVerifiedScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFocusEffectCalled = false;
    (getReusableVerificationCode as jest.Mock).mockResolvedValue(null);
    (sendVerificationCodeForUser as jest.Mock).mockResolvedValue('123456');
    (getUserProfile as jest.Mock).mockResolvedValue({ phoneNumber: '5511999999999' });
    (shouldRevealVerificationCode as jest.Mock).mockReturnValue(true);
  });

  it('gera e exibe o codigo ao entrar na tela antes de 10/05/2026', async () => {
    render(<WhatsAppNotVerifiedScreen />);

    await waitFor(() => {
      expect(sendVerificationCodeForUser).toHaveBeenCalledWith('user-1', '5511999999999');
      expect(screen.getByText('123456')).toBeTruthy();
    });
  });

  it('nao exibe o codigo depois de 10/05/2026', async () => {
    (shouldRevealVerificationCode as jest.Mock).mockReturnValue(false);

    render(<WhatsAppNotVerifiedScreen />);

    await waitFor(() => {
      expect(sendVerificationCodeForUser).not.toHaveBeenCalled();
      expect(screen.queryByText('123456')).toBeNull();
    });
  });
});
