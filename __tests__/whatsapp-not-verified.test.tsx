import { render, screen, waitFor } from '@testing-library/react-native';
import WhatsAppNotVerifiedScreen from '../app/(tabs)/whatsapp-not-verified';
import {
  getReusableVerificationCode,
  getOrCreateVerificationCode,
  sendVerificationCode,
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
  getOrCreateVerificationCode: jest.fn().mockName('getOrCreateVerificationCode'),
  sendVerificationCode: jest.fn().mockName('sendVerificationCode'),
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
    (getOrCreateVerificationCode as jest.Mock).mockResolvedValue({ code: '123456', expiresAt: Date.now() + 15 * 60 * 1000 });
    (sendVerificationCode as jest.Mock).mockResolvedValue({ success: true });
    (getUserProfile as jest.Mock).mockResolvedValue({ phoneNumber: '5511999999999' });
    (shouldRevealVerificationCode as jest.Mock).mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('gera e exibe o codigo ao entrar na tela antes de 10/05/2026', async () => {
    render(<WhatsAppNotVerifiedScreen />);

    await waitFor(() => {
      expect(getOrCreateVerificationCode).toHaveBeenCalledWith('user-1');
      expect(sendVerificationCode).toHaveBeenCalledWith('5511999999999', '123456');
      expect(screen.getByText('123456')).toBeTruthy();
    });
  });

  it('mantem o codigo visivel mesmo quando o envio falha', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    (sendVerificationCode as jest.Mock).mockRejectedValue(new Error('envio indisponivel'));

    render(<WhatsAppNotVerifiedScreen />);

    await waitFor(() => {
      expect(screen.getByText('123456')).toBeTruthy();
    });
  });

  it('nao exibe o codigo depois de 10/05/2026', async () => {
    (shouldRevealVerificationCode as jest.Mock).mockReturnValue(false);

    render(<WhatsAppNotVerifiedScreen />);

    await waitFor(() => {
      expect(sendVerificationCode).not.toHaveBeenCalled();
      expect(screen.queryByText('123456')).toBeNull();
    });
  });
});
