/**
 * PIX Configuration Module
 * Maps gift amounts to their corresponding PIX "Copia e Cola" codes from environment variables
 */

const PIX_CODES: Record<number, string> = {
  50: import.meta.env.VITE_PIX_CODE_50 || '',
  100: import.meta.env.VITE_PIX_CODE_100 || '',
  250: import.meta.env.VITE_PIX_CODE_250 || '',
  500: import.meta.env.VITE_PIX_CODE_500 || '',
  1000: import.meta.env.VITE_PIX_CODE_1000 || '',
  2000: import.meta.env.VITE_PIX_CODE_2000 || '',
};

export type PixRecipient = 'mark' | 'yosha';

const PIX_RECIPIENT_CODES: Record<PixRecipient, string> = {
  mark: import.meta.env.VITE_PIX_CODE_MARK || '',
  yosha: import.meta.env.VITE_PIX_CODE_YOSHA || '',
};

const isPixCodeConfigured = (code: string): boolean => {
  return Boolean(code && code.length > 0 && !code.startsWith('PIX_PLACEHOLDER'));
};

/**
 * Get the PIX "Copia e Cola" code for a given amount
 * @param amount - The gift amount in BRL
 * @returns The PIX code string, or empty string if not configured
 */
export const getPixCode = (amount: number): string => {
  return PIX_CODES[amount] || '';
};

/**
 * Get the PIX "Copia e Cola" code for a given recipient
 * @param recipient - The recipient identifier
 * @returns The PIX code string, or empty string if not configured
 */
export const getRecipientPixCode = (recipient: PixRecipient): string => {
  return PIX_RECIPIENT_CODES[recipient] || '';
};

/**
 * Check if a PIX code is configured for a given amount
 * @param amount - The gift amount in BRL
 * @returns True if a valid PIX code exists for this amount
 */
export const hasPixCode = (amount: number): boolean => {
  const code = PIX_CODES[amount];
  return isPixCodeConfigured(code);
};

/**
 * Check if a PIX code is configured for a given recipient
 * @param recipient - The recipient identifier
 * @returns True if a valid PIX code exists for this recipient
 */
export const hasRecipientPixCode = (recipient: PixRecipient): boolean => {
  const code = PIX_RECIPIENT_CODES[recipient];
  return isPixCodeConfigured(code);
};
