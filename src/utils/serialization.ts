/**
 * Serialization utilities for handling BigInt values in JSON
 */

/**
 * Recursively converts BigInt values to strings in an object/array
 * This allows JSON.stringify to work with BigInt values
 */
export function serializeBigInt<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle BigInt
  if (typeof obj === 'bigint') {
    return obj.toString() as any;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => serializeBigInt(item)) as any;
  }

  // Handle objects
  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeBigInt(value);
    }
    return result as T;
  }

  // Return primitive values as-is
  return obj;
}

