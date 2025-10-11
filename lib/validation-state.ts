// lib/api/validation-state.ts
export interface ValidationState {
  providedFields: string[];
  cumulativePrompt: string;
  originalNarrative: string;
  attemptCount: number;
}

export class ValidationStateManager {
  private static instance: ValidationStateManager;
  private states: Map<string, ValidationState> = new Map();

  private constructor() {}

  static getInstance(): ValidationStateManager {
    if (!ValidationStateManager.instance) {
      ValidationStateManager.instance = new ValidationStateManager();
    }
    return ValidationStateManager.instance;
  }

  getState(sessionKey: string): ValidationState | null {
    return this.states.get(sessionKey) || null;
  }

  setState(sessionKey: string, state: ValidationState): void {
    this.states.set(sessionKey, state);
  }

  clearState(sessionKey: string): void {
    this.states.delete(sessionKey);
  }

  // Clean up old states (optional, for memory management)
  cleanupOldStates(maxAge: number = 30 * 60 * 1000): void { // 30 minutes
    const now = Date.now();
    for (const [key, state] of Array.from(this.states.entries())) {
      // Assuming sessionKey contains timestamp, adjust as needed
      if (now - parseInt(key.split('-').pop() || '0') > maxAge) {
        this.states.delete(key);
      }
    }
  }
}

// Generate a unique session key for each validation session
export function generateSessionKey(userId: string, offenseId: string): string {
  return `${userId}-${offenseId}-${Date.now()}`;
}