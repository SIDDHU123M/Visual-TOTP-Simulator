/**
 * Visual TOTP Simulator - Main Entry Point
 */

import { TimeManager } from './core/time';
import { generateTOTP, TOTPResult, TOTPConfig } from './core/totp';
import { base32Decode, base32Encode, generateSecret, HashAlgorithm } from './core/hmac';
import { visualizer } from './visualizer';

// Application state
interface AppState {
  secret: Uint8Array;
  algorithm: HashAlgorithm;
  digits: number;
  secretViewMode: 'base32' | 'hex';
  timeManager: TimeManager;
  currentResult: TOTPResult | null;
}

const state: AppState = {
  secret: base32Decode('JBSWY3DPEHPK3PXP'),
  algorithm: 'SHA-1',
  digits: 6,
  secretViewMode: 'base32',
  timeManager: new TimeManager(),
  currentResult: null
};

// Update interval reference
let updateInterval: number | null = null;

// Initialize the application
async function init(): Promise<void> {
  setupEventListeners();
  visualizer.updateSecretPanel(state.secret, state.secretViewMode);
  await update();
  startUpdateLoop();
}

// Main update function
async function update(): Promise<void> {
  const timeState = state.timeManager.getState();
  
  // Update time panel
  visualizer.updateTimePanel(
    timeState.currentTime,
    timeState.counter,
    timeState.timeStep,
    timeState.timeRemaining,
    timeState.isFrozen
  );

  // Generate TOTP
  const config: TOTPConfig = {
    secret: state.secret,
    algorithm: state.algorithm,
    digits: state.digits,
    timeManager: state.timeManager
  };

  try {
    const result = await generateTOTP(config);
    state.currentResult = result;

    // Update all panels
    visualizer.updateHMACPanel(result, state.secret);
    visualizer.updateTruncationPanel(result);
    visualizer.updateOTPPanel(result, timeState.timeRemaining);
  } catch (error) {
    console.error('Error generating TOTP:', error);
  }
}

// Start the update loop
function startUpdateLoop(): void {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  updateInterval = window.setInterval(update, 100); // Update every 100ms for smooth countdown
}

// Setup all event listeners
function setupEventListeners(): void {
  // Time step selector
  const timeStepSelect = document.getElementById('time-step-select') as HTMLSelectElement;
  if (timeStepSelect) {
    timeStepSelect.addEventListener('change', () => {
      state.timeManager.setTimeStep(parseInt(timeStepSelect.value));
      update();
    });
  }

  // Time offset slider
  const timeOffset = document.getElementById('time-offset') as HTMLInputElement;
  const timeOffsetValue = document.getElementById('time-offset-value');
  if (timeOffset) {
    timeOffset.addEventListener('input', () => {
      const offset = parseInt(timeOffset.value);
      state.timeManager.setTimeOffset(offset);
      if (timeOffsetValue) {
        timeOffsetValue.textContent = `${offset}s`;
      }
      update();
    });
  }

  // Freeze toggle
  const freezeToggle = document.getElementById('freeze-toggle');
  if (freezeToggle) {
    freezeToggle.addEventListener('click', () => {
      if (state.timeManager.isFrozen()) {
        state.timeManager.unfreezeTime();
      } else {
        state.timeManager.freezeTime();
      }
      update();
    });
  }

  // Generate random secret
  const generateSecretBtn = document.getElementById('generate-secret');
  if (generateSecretBtn) {
    generateSecretBtn.addEventListener('click', () => {
      state.secret = generateSecret(20);
      const secretInput = document.getElementById('secret-input') as HTMLInputElement;
      if (secretInput) {
        secretInput.value = base32Encode(state.secret);
      }
      visualizer.updateSecretPanel(state.secret, state.secretViewMode);
      update();
    });
  }

  // Secret input
  const secretInput = document.getElementById('secret-input') as HTMLInputElement;
  if (secretInput) {
    secretInput.addEventListener('change', () => {
      try {
        state.secret = base32Decode(secretInput.value);
        visualizer.updateSecretPanel(state.secret, state.secretViewMode);
        update();
      } catch (error) {
        console.error('Invalid Base32 secret:', error);
        alert('Invalid Base32 secret. Please enter a valid Base32 encoded string.');
      }
    });
  }

  // Secret view mode
  const secretViewMode = document.getElementById('secret-view-mode') as HTMLSelectElement;
  if (secretViewMode) {
    secretViewMode.addEventListener('change', () => {
      state.secretViewMode = secretViewMode.value as 'base32' | 'hex';
      visualizer.updateSecretPanel(state.secret, state.secretViewMode);
    });
  }

  // Hash algorithm
  const hashAlgorithm = document.getElementById('hash-algorithm') as HTMLSelectElement;
  if (hashAlgorithm) {
    hashAlgorithm.addEventListener('change', () => {
      state.algorithm = hashAlgorithm.value as HashAlgorithm;
      update();
    });
  }

  // OTP digits
  const otpDigits = document.getElementById('otp-digits') as HTMLSelectElement;
  if (otpDigits) {
    otpDigits.addEventListener('change', () => {
      state.digits = parseInt(otpDigits.value);
      update();
    });
  }

  // Verification
  const verifyBtn = document.getElementById('verify-btn');
  const verifyInput = document.getElementById('verify-otp-input') as HTMLInputElement;
  if (verifyBtn && verifyInput) {
    verifyBtn.addEventListener('click', () => verifyOTP(verifyInput.value));
    verifyInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        verifyOTP(verifyInput.value);
      }
    });
  }
}

// Verify OTP function
async function verifyOTP(inputOTP: string): Promise<void> {
  if (!inputOTP || inputOTP.length !== state.digits) {
    alert(`Please enter a ${state.digits}-digit OTP`);
    return;
  }

  const currentCounter = state.timeManager.getCounter();
  const checkedCounters: { counter: number; otp: string; matched: boolean; current: boolean }[] = [];
  let matched = false;

  // Check counters: previous, current, next
  for (let i = -1; i <= 1; i++) {
    const checkCounter = currentCounter + i;
    
    // Create temp time manager for this counter
    const tempTimeManager = new TimeManager();
    tempTimeManager.setTimeStep(state.timeManager.getTimeStep());
    const targetTime = checkCounter * state.timeManager.getTimeStep();
    tempTimeManager.setTimeOffset(targetTime - Math.floor(Date.now() / 1000));
    tempTimeManager.freezeTime();

    const config: TOTPConfig = {
      secret: state.secret,
      algorithm: state.algorithm,
      digits: state.digits,
      timeManager: tempTimeManager
    };

    const result = await generateTOTP(config);
    const isMatched = result.otp === inputOTP;
    
    if (isMatched) {
      matched = true;
    }

    checkedCounters.push({
      counter: checkCounter,
      otp: result.otp,
      matched: isMatched,
      current: i === 0
    });
  }

  // Update visualization with animation delays
  visualizer.clearVerification();
  
  setTimeout(() => {
    visualizer.updateVerificationPanel(checkedCounters, null);
    
    // Show result after checking animation
    setTimeout(() => {
      visualizer.updateVerificationPanel(checkedCounters, matched);
    }, 800);
  }, 100);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
