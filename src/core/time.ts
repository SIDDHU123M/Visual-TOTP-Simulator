/**
 * Time utilities for TOTP calculation
 */

export interface TimeState {
  currentTime: number;
  counter: number;
  timeStep: number;
  timeRemaining: number;
  isFrozen: boolean;
}

export class TimeManager {
  private timeStep: number = 30;
  private frozenTime: number | null = null;
  private timeOffset: number = 0;

  getCurrentTime(): number {
    if (this.frozenTime !== null) {
      return this.frozenTime;
    }
    return Math.floor(Date.now() / 1000) + this.timeOffset;
  }

  getCounter(): number {
    return Math.floor(this.getCurrentTime() / this.timeStep);
  }

  getTimeRemaining(): number {
    return this.timeStep - (this.getCurrentTime() % this.timeStep);
  }

  getTimeStep(): number {
    return this.timeStep;
  }

  setTimeStep(step: number): void {
    this.timeStep = step;
  }

  freezeTime(): void {
    this.frozenTime = this.getCurrentTime();
  }

  unfreezeTime(): void {
    this.frozenTime = null;
  }

  isFrozen(): boolean {
    return this.frozenTime !== null;
  }

  setTimeOffset(offset: number): void {
    this.timeOffset = offset;
  }

  getTimeOffset(): number {
    return this.timeOffset;
  }

  getState(): TimeState {
    return {
      currentTime: this.getCurrentTime(),
      counter: this.getCounter(),
      timeStep: this.timeStep,
      timeRemaining: this.getTimeRemaining(),
      isFrozen: this.isFrozen()
    };
  }

  // Convert counter to 8-byte buffer (big-endian)
  counterToBytes(): Uint8Array {
    const counter = this.getCounter();
    const buffer = new Uint8Array(8);
    let value = counter;
    
    for (let i = 7; i >= 0; i--) {
      buffer[i] = value & 0xff;
      value = Math.floor(value / 256);
    }
    
    return buffer;
  }
}

export const timeManager = new TimeManager();
