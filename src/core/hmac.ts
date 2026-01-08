/**
 * HMAC-SHA1/SHA256/SHA512 implementation for TOTP
 */

export type HashAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-512';

export interface HMACResult {
  hash: Uint8Array;
  hashHex: string;
  algorithm: HashAlgorithm;
}

// Convert hex string to Uint8Array
export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

// Convert Uint8Array to hex string
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Base32 decode (RFC 4648)
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Decode(input: string): Uint8Array {
  // Remove spaces and convert to uppercase
  const cleanInput = input.replace(/\s/g, '').toUpperCase().replace(/=+$/, '');
  
  const output: number[] = [];
  let bits = 0;
  let value = 0;
  
  for (const char of cleanInput) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid Base32 character: ${char}`);
    }
    
    value = (value << 5) | index;
    bits += 5;
    
    if (bits >= 8) {
      bits -= 8;
      output.push((value >> bits) & 0xff);
    }
  }
  
  return new Uint8Array(output);
}

// Base32 encode
export function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';
  
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    
    while (bits >= 5) {
      bits -= 5;
      output += BASE32_ALPHABET[(value >> bits) & 0x1f];
    }
  }
  
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  }
  
  // Add padding
  while (output.length % 8 !== 0) {
    output += '=';
  }
  
  return output;
}

// Generate random secret
export function generateSecret(length: number = 20): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

// HMAC implementation using Web Crypto API
export async function hmac(
  key: Uint8Array,
  message: Uint8Array,
  algorithm: HashAlgorithm = 'SHA-1'
): Promise<HMACResult> {
  // Create new ArrayBuffer copies to avoid SharedArrayBuffer type issues
  const keyBuffer = new Uint8Array(key).buffer;
  const messageBuffer = new Uint8Array(message).buffer;
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageBuffer);
  const hash = new Uint8Array(signature);
  
  return {
    hash,
    hashHex: bytesToHex(hash),
    algorithm
  };
}

// Get hash length for algorithm
export function getHashLength(algorithm: HashAlgorithm): number {
  switch (algorithm) {
    case 'SHA-1': return 20;
    case 'SHA-256': return 32;
    case 'SHA-512': return 64;
  }
}
