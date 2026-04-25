import {
  sendVerificationCodeForUser,
  shouldRevealVerificationCode,
  verifyStoredCode,
} from '../services/whatsapp-service';
import { getDoc, setDoc } from 'firebase/firestore';

jest.mock('@/firebaseConfig', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  deleteField: jest.fn(() => ({ __deleteField: true })),
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}));

describe('whatsapp-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    } as any);
  });

  it('mostra o codigo somente antes de 10/05/2026', () => {
    expect(shouldRevealVerificationCode(new Date(2026, 3, 30))).toBe(true);
    expect(shouldRevealVerificationCode(new Date(2026, 4, 10, 23, 59, 59, 999))).toBe(true);
    expect(shouldRevealVerificationCode(new Date(2026, 4, 11))).toBe(false);
  });

  it('reutiliza o codigo salvo no Firestore ao reenviar', async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        whatsappVerificationCode: '123456',
        whatsappVerificationCodeExpiresAt: Date.now() + 15 * 60 * 1000,
      }),
    });

    await sendVerificationCodeForUser('user-1', '5511999999999');

    expect(setDoc).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect((global.fetch as jest.Mock).mock.calls[0][1].body).toContain('123456');
  });

  it('valida e limpa o codigo salvo quando a verificacao e bem-sucedida', async () => {
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        whatsappVerificationCode: '654321',
        whatsappVerificationCodeExpiresAt: Date.now() + 15 * 60 * 1000,
      }),
    });

    const isValid = await verifyStoredCode('user-2', '654321');

    expect(isValid).toBe(true);
    expect(setDoc).toHaveBeenCalled();
  });

  it('gera um novo codigo ao reenviar quando o anterior expirou', async () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);

    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        whatsappVerificationCode: '123456',
        whatsappVerificationCodeExpiresAt: Date.now() - 1,
      }),
    });

    await sendVerificationCodeForUser('user-3', '5511999999999');

    expect(setDoc).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect((global.fetch as jest.Mock).mock.calls[0][1].body).toContain('100000');

    randomSpy.mockRestore();
  });
});
