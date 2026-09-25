import { CustomerDisplayState } from '../types';

const CHANNEL_NAME = '3stars_customer_display_channel';
const STORAGE_KEY = '3stars_customer_display_state';

class DisplaySyncService {
  private channel: BroadcastChannel | null = null;
  private listeners: Array<(state: CustomerDisplayState) => void> = [];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data) {
            this.notify(event.data);
          }
        };
      } catch {
        this.channel = null;
      }
    }

    // Fallback: localStorage event for cross-tab sync
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY && event.newValue) {
          try {
            const parsed = JSON.parse(event.newValue);
            this.notify(parsed);
          } catch {
            // ignore
          }
        }
      });
    }
  }

  public publish(state: CustomerDisplayState) {
    if (this.channel) {
      try {
        this.channel.postMessage(state);
      } catch {
        // channel error
      }
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // storage quota
      }
    }
    this.notify(state);
  }

  public subscribe(callback: (state: CustomerDisplayState) => void): () => void {
    this.listeners.push(callback);
    // Provide initial state from storage if exists
    const initial = this.getLatestState();
    if (initial) {
      callback(initial);
    }
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  public getLatestState(): CustomerDisplayState | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return null;
  }

  private notify(state: CustomerDisplayState) {
    for (const listener of this.listeners) {
      listener(state);
    }
  }
}

export const displaySync = new DisplaySyncService();
