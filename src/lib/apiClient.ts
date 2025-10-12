// src/lib/apiClient.ts
// API client with retry logic and exponential backoff

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2
};

class APIClient {
  private failureCount: Map<string, number> = new Map();
  private lastAttempt: Map<string, number> = new Map();
  private isInDevelopment: boolean;

  constructor() {
    // Detect if we're in development mode
    this.isInDevelopment = 
      window.location.hostname === 'localhost' || 
      window.location.hostname.includes('webcontainer') ||
      window.location.hostname.includes('stackblitz');
  }

  private getBackoffDelay(endpoint: string, config: RetryConfig): number {
    const failures = this.failureCount.get(endpoint) || 0;
    const delay = Math.min(
      config.initialDelay * Math.pow(config.backoffMultiplier, failures),
      config.maxDelay
    );
    return delay;
  }

  private shouldRetry(endpoint: string, config: RetryConfig): boolean {
    const failures = this.failureCount.get(endpoint) || 0;
    const lastAttemptTime = this.lastAttempt.get(endpoint) || 0;
    const backoffDelay = this.getBackoffDelay(endpoint, config);
    const timeSinceLastAttempt = Date.now() - lastAttemptTime;

    // Don't retry if we've exceeded max retries
    if (failures >= config.maxRetries) {
      console.warn(`[APIClient] Max retries (${config.maxRetries}) exceeded for ${endpoint}`);
      return false;
    }

    // Don't retry if we're still in backoff period
    if (timeSinceLastAttempt < backoffDelay) {
      console.log(`[APIClient] Still in backoff period for ${endpoint} (${Math.ceil((backoffDelay - timeSinceLastAttempt) / 1000)}s remaining)`);
      return false;
    }

    return true;
  }

  private recordFailure(endpoint: string): void {
    const currentFailures = this.failureCount.get(endpoint) || 0;
    this.failureCount.set(endpoint, currentFailures + 1);
    this.lastAttempt.set(endpoint, Date.now());
  }

  private recordSuccess(endpoint: string): void {
    this.failureCount.delete(endpoint);
    this.lastAttempt.delete(endpoint);
  }

  async fetchWithRetry(
    endpoint: string,
    options: RequestInit = {},
    config: Partial<RetryConfig> = {}
  ): Promise<Response> {
    const retryConfig = { ...defaultRetryConfig, ...config };

    // Check if we should even attempt the request
    if (!this.shouldRetry(endpoint, retryConfig)) {
      // Return a mock successful response to prevent spam
      console.log(`[APIClient] Skipping request to ${endpoint} due to backoff`);
      throw new Error('Request skipped due to backoff period');
    }

    try {
      console.log(`[APIClient] Attempting request to ${endpoint}`);
      this.lastAttempt.set(endpoint, Date.now());

      const response = await fetch(endpoint, options);

      if (response.ok) {
        this.recordSuccess(endpoint);
        return response;
      }

      // Handle 404 specifically
      if (response.status === 404) {
        this.recordFailure(endpoint);
        
        if (this.isInDevelopment) {
          console.warn(`[APIClient] 404 on ${endpoint} - likely in development mode without Netlify functions`);
        }
        
        throw new Error(`Endpoint not found: ${endpoint}`);
      }

      // Handle other errors
      this.recordFailure(endpoint);
      throw new Error(`Request failed with status ${response.status}`);

    } catch (error) {
      this.recordFailure(endpoint);
      console.error(`[APIClient] Request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Specific method for chat-response endpoint
  async sendChatMessage(payload: any): Promise<any> {
    const endpoint = '/.netlify/functions/chat-response';
    
    try {
      const response = await this.fetchWithRetry(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      return await response.json();
    } catch (error) {
      console.error('[APIClient] Chat message failed:', error);
      
      // Return fallback response instead of throwing
      return {
        response: "I'm having trouble connecting right now. Please try again in a moment! 😊"
      };
    }
  }

  // Reset failure tracking (useful for testing or manual retry)
  resetEndpoint(endpoint: string): void {
    this.failureCount.delete(endpoint);
    this.lastAttempt.delete(endpoint);
    console.log(`[APIClient] Reset failure tracking for ${endpoint}`);
  }

  // Get current status
  getStatus(endpoint: string): { failures: number; lastAttempt: number; backoffDelay: number } {
    const failures = this.failureCount.get(endpoint) || 0;
    const lastAttempt = this.lastAttempt.get(endpoint) || 0;
    const backoffDelay = this.getBackoffDelay(endpoint, defaultRetryConfig);
    
    return { failures, lastAttempt, backoffDelay };
  }
}

// Export singleton instance
export const apiClient = new APIClient();
