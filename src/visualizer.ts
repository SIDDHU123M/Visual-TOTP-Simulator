/**
 * Visualizer - Handles all UI updates and animations
 */

import { TOTPResult } from './core/totp';
import { bytesToHex, base32Encode } from './core/hmac';

export class Visualizer {
  private previousOTP: string = '';
  private previousCounter: number = -1;

  // Update time panel
  updateTimePanel(
    currentTime: number,
    counter: number,
    timeStep: number,
    timeRemaining: number,
    isFrozen: boolean
  ): void {
    // Update values
    const unixTimestamp = document.getElementById('unix-timestamp');
    const timeStepDisplay = document.getElementById('time-step-display');
    const counterValue = document.getElementById('counter-value');
    const timeRemainingEl = document.getElementById('time-remaining');
    const formulaTime = document.getElementById('formula-time');
    const formulaStep = document.getElementById('formula-step');
    const formulaResult = document.getElementById('formula-result');
    const countdownRing = document.querySelector('#countdown-ring') as SVGCircleElement | null;
    const freezeBtn = document.getElementById('freeze-toggle');

    if (unixTimestamp) unixTimestamp.textContent = currentTime.toString();
    if (timeStepDisplay) timeStepDisplay.textContent = `${timeStep}s`;
    if (counterValue) {
      if (counter !== this.previousCounter) {
        counterValue.classList.add('animate');
        setTimeout(() => counterValue.classList.remove('animate'), 300);
      }
      counterValue.textContent = counter.toString();
    }
    if (timeRemainingEl) timeRemainingEl.textContent = timeRemaining.toString();
    if (formulaTime) formulaTime.textContent = currentTime.toString();
    if (formulaStep) formulaStep.textContent = timeStep.toString();
    if (formulaResult) formulaResult.textContent = counter.toString();

    // Update countdown ring
    if (countdownRing) {
      const progress = (timeRemaining / timeStep) * 283; // 283 = circumference
      countdownRing.style.strokeDashoffset = (283 - progress).toString();
      
      // Color changes based on time remaining
      countdownRing.classList.remove('warning', 'danger');
      if (timeRemaining <= 5) {
        countdownRing.classList.add('danger');
      } else if (timeRemaining <= 10) {
        countdownRing.classList.add('warning');
      }
    }

    // Update freeze button
    if (freezeBtn) {
      freezeBtn.textContent = isFrozen ? '▶️ Resume Time' : '❄️ Freeze Time';
      freezeBtn.classList.toggle('active', isFrozen);
    }

    this.previousCounter = counter;
  }

  // Update secret panel
  updateSecretPanel(secretBytes: Uint8Array, viewMode: 'base32' | 'hex'): void {
    const secretBase32 = document.getElementById('secret-base32');
    const secretHexGrid = document.getElementById('secret-hex-grid');

    const base32 = base32Encode(secretBytes);
    const hex = bytesToHex(secretBytes);

    if (secretBase32) {
      secretBase32.textContent = viewMode === 'base32' ? base32 : hex;
    }

    if (secretHexGrid) {
      secretHexGrid.innerHTML = '';
      for (let i = 0; i < secretBytes.length; i++) {
        const cell = document.createElement('div');
        cell.className = 'byte-cell';
        cell.textContent = secretBytes[i].toString(16).padStart(2, '0').toUpperCase();
        secretHexGrid.appendChild(cell);
      }
    }
  }

  // Update HMAC panel
  updateHMACPanel(result: TOTPResult, secretBytes: Uint8Array): void {
    const hmacKeyPreview = document.getElementById('hmac-key-preview');
    const hmacCounterPreview = document.getElementById('hmac-counter-preview');
    const hmacAlgoDisplay = document.getElementById('hmac-algo-display');
    const formulaAlgo = document.getElementById('formula-algo');
    const hashLength = document.getElementById('hash-length');
    const hmacHashGrid = document.getElementById('hmac-hash-grid');
    const hmacBox = document.getElementById('hmac-animation-box');

    // Update key preview (truncated)
    if (hmacKeyPreview) {
      const keyHex = bytesToHex(secretBytes);
      hmacKeyPreview.textContent = keyHex.length > 20 
        ? keyHex.substring(0, 20) + '...' 
        : keyHex;
    }

    // Update counter preview
    if (hmacCounterPreview) {
      const counterBytes = Array.from(result.counterBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ');
      hmacCounterPreview.textContent = counterBytes.toUpperCase();
    }

    // Update algorithm displays
    const algoShort = result.algorithm.replace('-', '');
    if (hmacAlgoDisplay) hmacAlgoDisplay.textContent = algoShort;
    if (formulaAlgo) formulaAlgo.textContent = algoShort;
    if (hashLength) hashLength.textContent = result.hmacHash.length.toString();

    // Animate HMAC box on counter change
    if (hmacBox && result.counter !== this.previousCounter) {
      hmacBox.classList.add('processing');
      setTimeout(() => hmacBox.classList.remove('processing'), 500);
    }

    // Update hash grid with highlighting for truncation
    if (hmacHashGrid) {
      hmacHashGrid.innerHTML = '';
      const offset = result.truncation.offset;
      
      for (let i = 0; i < result.hmacHash.length; i++) {
        const cell = document.createElement('div');
        cell.className = 'byte-cell';
        
        // Highlight selected bytes
        if (i >= offset && i < offset + 4) {
          cell.classList.add('selected');
        }
        
        // Highlight offset indicator (last byte)
        if (i === result.hmacHash.length - 1) {
          cell.classList.add('offset');
        }
        
        cell.textContent = result.hmacHash[i].toString(16).padStart(2, '0').toUpperCase();
        cell.title = `Byte ${i}`;
        hmacHashGrid.appendChild(cell);
      }
    }
  }

  // Update truncation panel
  updateTruncationPanel(result: TOTPResult): void {
    const lastByteValue = document.getElementById('last-byte-value');
    const offsetValue = document.getElementById('offset-value');
    const selectedBytesDisplay = document.getElementById('selected-bytes-display');
    const binaryValueDisplay = document.getElementById('binary-value-display');
    const maskedValueDisplay = document.getElementById('masked-value-display');

    const lastByte = result.hmacHash[result.hmacHash.length - 1];

    if (lastByteValue) {
      lastByteValue.textContent = '0x' + lastByte.toString(16).padStart(2, '0').toUpperCase();
    }

    if (offsetValue) {
      offsetValue.textContent = result.truncation.offset.toString();
    }

    if (selectedBytesDisplay) {
      selectedBytesDisplay.innerHTML = '';
      for (let i = 0; i < result.truncation.selectedBytes.length; i++) {
        const cell = document.createElement('div');
        cell.className = 'byte-cell selected';
        cell.textContent = result.truncation.selectedBytes[i].toString(16).padStart(2, '0').toUpperCase();
        selectedBytesDisplay.appendChild(cell);
      }
    }

    if (binaryValueDisplay) {
      binaryValueDisplay.textContent = '0x' + result.truncation.binaryValue.toString(16).padStart(8, '0').toUpperCase();
    }

    if (maskedValueDisplay) {
      maskedValueDisplay.textContent = result.truncation.maskedValue.toString();
    }
  }

  // Update OTP panel
  updateOTPPanel(result: TOTPResult, timeRemaining: number): void {
    const otpPrevious = document.getElementById('otp-previous');
    const otpCurrent = document.getElementById('otp-current');
    const otpCountdown = document.getElementById('otp-countdown');
    const formulaMasked = document.getElementById('formula-masked');
    const formulaDigits = document.getElementById('formula-digits');
    const formulaOTP = document.getElementById('formula-otp');

    // Check if OTP changed
    if (result.otp !== this.previousOTP) {
      if (otpPrevious && this.previousOTP) {
        otpPrevious.textContent = this.previousOTP;
        otpPrevious.classList.add('fade-in');
        setTimeout(() => otpPrevious.classList.remove('fade-in'), 300);
      }
      
      if (otpCurrent) {
        otpCurrent.textContent = result.otp;
        otpCurrent.classList.add('changing');
        setTimeout(() => otpCurrent.classList.remove('changing'), 500);
      }
      
      this.previousOTP = result.otp;
    }

    if (otpCountdown) {
      otpCountdown.textContent = timeRemaining.toString();
    }

    if (formulaMasked) {
      formulaMasked.textContent = result.truncation.maskedValue.toString();
    }

    if (formulaDigits) {
      formulaDigits.textContent = result.digits.toString();
    }

    if (formulaOTP) {
      formulaOTP.textContent = result.otp;
    }
  }

  // Update verification panel with counter checks
  updateVerificationPanel(
    checkedCounters: { counter: number; otp: string; matched: boolean; current: boolean }[],
    success: boolean | null
  ): void {
    const counterChecks = document.getElementById('counter-checks');
    const verificationResult = document.getElementById('verification-result');

    if (counterChecks) {
      counterChecks.innerHTML = '';
      
      checkedCounters.forEach((check, index) => {
        const checkEl = document.createElement('div');
        checkEl.className = 'counter-check';
        
        if (check.matched) {
          checkEl.classList.add('matched');
        } else if (success !== null) {
          checkEl.classList.add('not-matched');
        }
        
        checkEl.innerHTML = `
          <div class="counter-check-label">${check.current ? 'Current' : (index === 0 ? 'Previous' : 'Next')} (Counter: ${check.counter})</div>
          <div class="counter-check-otp">${check.otp}</div>
        `;
        
        // Animate checking
        setTimeout(() => {
          checkEl.classList.add('checking');
          setTimeout(() => checkEl.classList.remove('checking'), 500);
        }, index * 200);
        
        counterChecks.appendChild(checkEl);
      });
    }

    if (verificationResult) {
      if (success === null) {
        verificationResult.textContent = '';
        verificationResult.className = 'verification-result';
      } else if (success) {
        verificationResult.textContent = '✅ OTP Verified Successfully!';
        verificationResult.className = 'verification-result success';
      } else {
        verificationResult.textContent = '❌ OTP Verification Failed';
        verificationResult.className = 'verification-result failure';
      }
    }
  }

  // Clear verification display
  clearVerification(): void {
    const counterChecks = document.getElementById('counter-checks');
    const verificationResult = document.getElementById('verification-result');
    
    if (counterChecks) counterChecks.innerHTML = '';
    if (verificationResult) {
      verificationResult.textContent = '';
      verificationResult.className = 'verification-result';
    }
  }
}

export const visualizer = new Visualizer();
