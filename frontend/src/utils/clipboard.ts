export interface ClipboardOptions {
  clearTimeout?: number; // seconds
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
  onCountdown?: (remaining: number) => void;
  showCountdown?: boolean;
}

export interface ClipboardResult {
  success: boolean;
  message: string;
  error?: string;
  clearId?: number;
}

class ClipboardManager {
  private activeClearTimeouts = new Map<string, number>();
  private countdownIntervals = new Map<string, number>();

  /**
   * Copy text to clipboard với auto-clear và toast notification
   */
  async copyWithAutoClear(
    text: string,
    type: string = 'text',
    options: ClipboardOptions = {}
  ): Promise<ClipboardResult> {
    const {
      clearTimeout = 15, // default 15 seconds
      onSuccess,
      onError,
      onCountdown,
      showCountdown = true
    } = options;

    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers or non-secure contexts
        await this.fallbackCopyToClipboard(text);
      }

      const successMessage = `${type} đã được sao chép vào clipboard${clearTimeout > 0 ? ` (sẽ tự xóa sau ${clearTimeout}s)` : ''}`;

      // Clear any existing timeout for this type
      this.clearActiveTimeout(type);

      // Setup auto-clear if timeout > 0
      let clearId: number | undefined;
      if (clearTimeout > 0) {
        clearId = this.setupAutoClear(text, type, clearTimeout, {
          onCountdown: showCountdown ? onCountdown : undefined
        });
      }

      // Notify success
      onSuccess?.(successMessage);

      return {
        success: true,
        message: successMessage,
        clearId
      };

    } catch (error) {
      const errorMessage = `Không thể sao chép ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      onError?.(errorMessage);

      return {
        success: false,
        message: errorMessage,
        error: errorMessage
      };
    }
  }

  /**
   * Fallback copy method for older browsers
   */
  private async fallbackCopyToClipboard(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create temporary textarea
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-999999px';
      textarea.style.top = '-999999px';
      document.body.appendChild(textarea);

      try {
        textarea.focus();
        textarea.select();

        // Try execCommand as fallback
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);

        if (successful) {
          resolve();
        } else {
          reject(new Error('execCommand copy failed'));
        }
      } catch (err) {
        document.body.removeChild(textarea);
        reject(err);
      }
    });
  }

  /**
   * Setup auto-clear timeout với countdown
   */
  private setupAutoClear(
    originalText: string,
    type: string,
    timeoutSeconds: number,
    options: { onCountdown?: (remaining: number) => void } = {}
  ): number {
    const { onCountdown } = options;

    // Clear existing timers
    this.clearActiveTimeout(type);

    let remainingTime = timeoutSeconds;

    // Setup countdown interval if callback provided
    if (onCountdown) {
      const countdownId = window.setInterval(() => {
        remainingTime--;
        onCountdown(remainingTime);

        if (remainingTime <= 0) {
          window.clearInterval(countdownId);
          this.countdownIntervals.delete(type);
        }
      }, 1000);

      this.countdownIntervals.set(type, countdownId);
    }

    // Setup clear timeout
    const timeoutId = window.setTimeout(async () => {
      try {
        // Check if current clipboard content matches what we copied
        if (navigator.clipboard && window.isSecureContext) {
          const currentClipboard = await navigator.clipboard.readText();
          if (currentClipboard === originalText) {
            await navigator.clipboard.writeText('');
            console.log(`Clipboard cleared after ${timeoutSeconds}s timeout`);
          }
        }
      } catch (error) {
        console.warn('Could not clear clipboard:', error);
      }

      // Clean up
      this.activeClearTimeouts.delete(type);
      this.clearCountdownInterval(type);
    }, timeoutSeconds * 1000);

    this.activeClearTimeouts.set(type, timeoutId);
    return timeoutId;
  }

  /**
   * Clear active timeout for a specific type
   */
  private clearActiveTimeout(type: string): void {
    const existingTimeout = this.activeClearTimeouts.get(type);
    if (existingTimeout) {
      window.clearTimeout(existingTimeout);
      this.activeClearTimeouts.delete(type);
    }
    this.clearCountdownInterval(type);
  }

  /**
   * Clear countdown interval
   */
  private clearCountdownInterval(type: string): void {
    const existingInterval = this.countdownIntervals.get(type);
    if (existingInterval) {
      window.clearInterval(existingInterval);
      this.countdownIntervals.delete(type);
    }
  }

  /**
   * Cancel auto-clear for specific type
   */
  cancelAutoClear(type: string): void {
    this.clearActiveTimeout(type);
  }

  /**
   * Cancel all active auto-clear timers
   */
  cancelAllAutoClears(): void {
    for (const type of this.activeClearTimeouts.keys()) {
      this.clearActiveTimeout(type);
    }
  }

  /**
   * Check if clipboard API is available
   */
  isClipboardSupported(): boolean {
    return !!(navigator.clipboard || document.execCommand);
  }

  /**
   * Check if secure clipboard API is available
   */
  isSecureClipboardSupported(): boolean {
    return !!(navigator.clipboard && window.isSecureContext);
  }
}

// Export singleton instance
export const clipboardManager = new ClipboardManager();

// Export convenience functions
export const copyToClipboard = (
  text: string,
  type: string = 'text',
  options?: ClipboardOptions
) => clipboardManager.copyWithAutoClear(text, type, options);

export const cancelClipboardAutoClear = (type: string) =>
  clipboardManager.cancelAutoClear(type);

export const isClipboardSupported = () =>
  clipboardManager.isClipboardSupported();