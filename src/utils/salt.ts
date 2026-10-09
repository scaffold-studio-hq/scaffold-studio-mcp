/**
 * Salt generation utilities
 *
 * Generates random 32-byte hex strings for contract deployment salts
 */

import crypto from 'crypto';

/**
 * Generate a random 32-byte salt for contract deployment
 * @returns 64-character hex string (32 bytes)
 */
export function generateSalt(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate multiple unique salts
 * @param count - Number of salts to generate
 * @returns Array of unique salt strings
 */
export function generateMultipleSalts(count: number): string[] {
  const salts = new Set<string>();
  while (salts.size < count) {
    salts.add(generateSalt());
  }
  return Array.from(salts);
}
