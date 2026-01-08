/**
 * TOTP (Time-based One-Time Password) implementation
 * RFC 6238
 */

import { hmac, HashAlgorithm, bytesToHex } from './hmac';
import { TimeManager } from './time';

export interface TruncationResult {
  offset: number;
  selectedBytes: Uint8Array;
  selectedBytesHex: string;
  binaryValue: number;
  maskedValue: number;
}

export interface TOTPResult {
  otp: string;
  counter: number;
  counterBytes: Uint8Array;
  counterBytesHex: string;
  hmacHash: Uint8Array;
  hmacHashHex: string;
  truncation: TruncationResult;
  algorithm: HashAlgorithm;
  digits: number;
  timestamp: number;
}

export interface TOTPConfig {
  secret: Uint8Array;
  algorithm: HashAlgorithm;
  digits: number;
  timeManager: TimeManager;
}

/**
 * Dynamic truncation as per RFC 4226
 */
export function dynamicTruncation(hash: Uint8Array, _digits: number): TruncationResult {
  // Get offset from last nibble (4 bits)
  const offset = hash[hash.length - 1] & 0x0f;
  
  // Select 4 bytes starting at offset
  const selectedBytes = hash.slice(offset, offset + 4);
  
  // Convert to 32-bit integer (big-endian) and mask sign bit
  const binaryValue = 
    ((selectedBytes[0] & 0xff) << 24) |
    ((selectedBytes[1] & 0xff) << 16) |
    ((selectedBytes[2] & 0xff) << 8) |
    (selectedBytes[3] & 0xff);
  
  // Mask the sign bit (0x7FFFFFFF)
  const maskedValue = binaryValue & 0x7fffffff;
  
  return {
    offset,
    selectedBytes,
    selectedBytesHex: bytesToHex(selectedBytes),
    binaryValue,
    maskedValue
  };
}

/**
 * Generate TOTP
 */
export async function generateTOTP(config: TOTPConfig): Promise<TOTPResult> {
  const { secret, algorithm, digits, timeManager } = config;
  
  // Get counter bytes
  const counterBytes = timeManager.counterToBytes();
  const counter = timeManager.getCounter();
  const timestamp = timeManager.getCurrentTime();
  
  // Generate HMAC
  const hmacResult = await hmac(secret, counterBytes, algorithm);
  
  // Dynamic truncation
  const truncation = dynamicTruncation(hmacResult.hash, digits);
  
  // Generate OTP
  const modulo = Math.pow(10, digits);
  const otpValue = truncation.maskedValue % modulo;
  const otp = otpValue.toString().padStart(digits, '0');
  
  return {
    otp,
    counter,
    counterBytes,
    counterBytesHex: bytesToHex(counterBytes),
    hmacHash: hmacResult.hash,
    hmacHashHex: hmacResult.hashHex,
    truncation,
    algorithm,
    digits,
    timestamp
  };
}

/**
 * Verify TOTP with time drift tolerance
 */
export async function verifyTOTP(
  config: TOTPConfig,
  inputOTP: string,
  window: number = 1
): Promise<{ valid: boolean; matchedCounter: number | null; checkedCounters: number[] }> {
  const currentCounter = config.timeManager.getCounter();
  const checkedCounters: number[] = [];
  
  // Check current counter and ±window
  for (let i = -window; i <= window; i++) {
    const checkCounter = currentCounter + i;
    checkedCounters.push(checkCounter);
    
    // Create a temporary time manager at the specific counter
    const tempTimeManager = new TimeManager();
    const targetTime = checkCounter * config.timeManager.getTimeStep();
    tempTimeManager.setTimeStep(config.timeManager.getTimeStep());
    tempTimeManager.setTimeOffset(targetTime - Math.floor(Date.now() / 1000));
    tempTimeManager.freezeTime();
    
    const result = await generateTOTP({
      ...config,
      timeManager: tempTimeManager
    });
    
    if (result.otp === inputOTP) {
      return { valid: true, matchedCounter: checkCounter, checkedCounters };
    }
  }
  
  return { valid: false, matchedCounter: null, checkedCounters };
}
