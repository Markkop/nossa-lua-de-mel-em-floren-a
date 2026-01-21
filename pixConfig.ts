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

/**
 * Get the PIX "Copia e Cola" code for a given amount
 * @param amount - The gift amount in BRL
 * @returns The PIX code string, or empty string if not configured
 */
export const getPixCode = (amount: number): string => {
  return PIX_CODES[amount] || '';
};

/**
 * Check if a PIX code is configured for a given amount
 * @param amount - The gift amount in BRL
 * @returns True if a valid PIX code exists for this amount
 */
export const hasPixCode = (amount: number): boolean => {
  const code = PIX_CODES[amount];
  return Boolean(code && code.length > 0 && !code.startsWith('PIX_PLACEHOLDER'));
};
