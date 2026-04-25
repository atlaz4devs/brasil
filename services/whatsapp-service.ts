import { db } from '@/firebaseConfig';
import { deleteField, doc, getDoc, setDoc } from 'firebase/firestore';

const WHATSAPP_API_VERSION = 'v24.0';
const WHATSAPP_API_URL = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;
const USERS_COLLECTION = 'users';
const VERIFICATION_CODE_TTL_MS = 15 * 60 * 1000;
const WHATSAPP_CODE_REVEAL_DEADLINE = new Date(2026, 4, 10);

const ACCESS_TOKEN = process.env.EXPO_PUBLIC_WHATSAPP_ACCESS_TOKEN!;
const PHONE_NUMBER_ID = process.env.EXPO_PUBLIC_WHATSAPP_PHONE_NUMBER_ID!;

interface TemplateComponent {
  type: 'body' | 'header' | 'button';
  parameters?: {
    type: 'text';
    text: string;
  }[];
  sub_type?: 'url' | 'quick_reply';
  index?: string;
}

export interface StoredVerificationCode {
  code: string;
  expiresAt: number;
}

export async function sendTemplateMessage(
  to: string,
  templateName: string,
  languageCode: string = 'en',
  components?: TemplateComponent[]
) {
  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: languageCode },
            components: components || [],
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`WhatsApp API Error: ${JSON.stringify(data)}`);
    }

    return data;
  } catch (error) {
    console.error('Erro ao enviar template WhatsApp:', error);
    throw error;
  }
}

export async function markMessageAsRead(messageId: string) {
  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        }),
      }
    );

    return await response.json();
  } catch (error) {
    console.error('Erro ao marcar mensagem como lida:', error);
    throw error;
  }
}

export async function getBusinessProfile() {
  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/whatsapp_business_profile`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      }
    );

    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar perfil business:', error);
    throw error;
  }
}

// Webhook para receber mensagens (configurar no Meta Developer)
export function handleWebhook(payload: any) {
  if (payload.object === 'whatsapp_business_account') {
    payload.entry?.forEach((entry: any) => {
      entry.changes?.forEach((change: any) => {
        if (change.field === 'messages') {
          const messages = change.value?.messages || [];
          messages.forEach((message: any) => {
            console.log('Mensagem recebida:', message);
            // Processar mensagem aqui
          });
        }
      });
    });
  }
}

// Gera codigo de verificacao aleatorio de 6 digitos
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function shouldRevealVerificationCode(now: Date = new Date()): boolean {
  return now < WHATSAPP_CODE_REVEAL_DEADLINE;
}

async function readStoredVerificationCode(userId: string): Promise<StoredVerificationCode | null> {
  const docRef = doc(db, USERS_COLLECTION, userId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  const code = data.whatsappVerificationCode;
  const expiresAt = data.whatsappVerificationCodeExpiresAt;

  if (typeof code !== 'string' || !code) {
    return null;
  }

  if (typeof expiresAt !== 'number' || Date.now() > expiresAt) {
    await clearVerificationCode(userId);
    return null;
  }

  return { code, expiresAt };
}

export async function saveVerificationCode(
  userId: string,
  code: string,
  expiresAt: number = Date.now() + VERIFICATION_CODE_TTL_MS
): Promise<StoredVerificationCode> {
  await setDoc(
    doc(db, USERS_COLLECTION, userId),
    {
      whatsappVerificationCode: code,
      whatsappVerificationCodeExpiresAt: expiresAt,
      updatedAt: new Date(),
    },
    { merge: true }
  );

  return { code, expiresAt };
}

export async function clearVerificationCode(userId: string): Promise<void> {
  await setDoc(
    doc(db, USERS_COLLECTION, userId),
    {
      whatsappVerificationCode: deleteField(),
      whatsappVerificationCodeExpiresAt: deleteField(),
      updatedAt: new Date(),
    },
    { merge: true }
  );
}

export async function getReusableVerificationCode(userId: string): Promise<string | null> {
  const stored = await readStoredVerificationCode(userId);
  return stored?.code ?? null;
}

export async function getOrCreateVerificationCode(userId: string): Promise<StoredVerificationCode> {
  const stored = await readStoredVerificationCode(userId);
  if (stored) {
    return stored;
  }

  const code = generateVerificationCode();
  return saveVerificationCode(userId, code);
}

export async function sendVerificationCode(phoneNumber: string, code: string) {
  return sendTemplateMessage(phoneNumber, 'verify_code', 'en', [
    {
      type: 'body',
      parameters: [
        {
          type: 'text',
          text: code,
        },
      ],
    },
    {
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [
        {
          type: 'text',
          text: code,
        },
      ],
    },
  ]);
}

export async function sendVerificationCodeForUser(userId: string, phoneNumber: string) {
  const { code } = await getOrCreateVerificationCode(userId);
  await sendVerificationCode(phoneNumber, code);
  return code;
}

export async function verifyStoredCode(userId: string, inputCode: string): Promise<boolean> {
  const stored = await readStoredVerificationCode(userId);

  if (!stored) {
    return false;
  }

  if (stored.code !== inputCode.trim()) {
    return false;
  }

  await clearVerificationCode(userId);
  return true;
}
