// LanguageTool API Service for Grammar and Spelling Checking

import { GrammarError, LanguageToolResponse, LanguageToolMatch } from './grammarTypes';

class LanguageToolService {
  private readonly baseUrl = 'https://api.languagetoolplus.com/v2';
  private readonly freeUrl = 'https://api.languagetool.org/v2';
  private readonly apiKey?: string;
  private requestCount = 0;
  private lastRequestTime = 0;
  private readonly rateLimitDelay = 3000; // 3 seconds between requests for free tier

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest(text: string, language = 'en-US'): Promise<LanguageToolResponse> {
    // Rate limiting for free tier
    if (!this.apiKey) {
      const now = Date.now();
      if (now - this.lastRequestTime < this.rateLimitDelay) {
        await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - (now - this.lastRequestTime)));
      }
      this.lastRequestTime = Date.now();
    }

    const url = this.apiKey ? this.baseUrl : this.freeUrl;
    const formData = new FormData();
    formData.append('text', text);
    formData.append('language', language);
    
    // Enhanced rules for NSW selective test preparation
    formData.append('enabledRules', [
      'MORFOLOGIK_RULE_EN_US', // Spelling
      'GRAMMAR_RULE', // Grammar
      'STYLE_RULE', // Style
      'PUNCTUATION_RULE', // Punctuation
      'TYPOGRAPHY_RULE', // Typography
      'REDUNDANCY_RULE', // Redundancy
      'WORDINESS_RULE', // Wordiness
      'CLICHES_RULE', // Clichés
      'PLAIN_ENGLISH_RULE' // Plain English
    ].join(','));

    if (this.apiKey) {
      formData.append('apiKey', this.apiKey);
    }

    try {
      const response = await fetch(`${url}/check`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`LanguageTool API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('LanguageTool API request failed:', error);
      throw error;
    }
  }

  private mapLanguageToolError(match: LanguageToolMatch, text: string): GrammarError {
    const errorType = this.determineErrorType(match);
    const severity = this.determineSeverity(match);

    return {
      id: `lt_${match.offset}_${match.length}_${Date.now()}`,
      start: match.offset,
      end: match.offset + match.length,
      message: match.message,
      type: errorType,
      severity,
      suggestions: match.replacements.map(r => r.value),
      context: match.context.text,
      explanation: match.rule.description,
      rule: match.rule.id,
      category: match.rule.category.name
    };
  }

  private determineErrorType(match: LanguageToolMatch): GrammarError['type'] {
    const ruleId = match.rule.id.toLowerCase();
    const category = match.rule.category.id.toLowerCase();

    if (category.includes('typo') || ruleId.includes('morfologik') || ruleId.includes('spell')) {
      return 'spelling';
    }
    if (category.includes('grammar') || ruleId.includes('grammar')) {
      return 'grammar';
    }
    if (category.includes('punctuation') || ruleId.includes('punct')) {
      return 'punctuation';
    }
    if (category.includes('style') || ruleId.includes('style') || ruleId.includes('redundancy')) {
      return 'style';
    }
    
    return 'grammar'; // Default fallback
  }

  private determineSeverity(match: LanguageToolMatch): GrammarError['severity'] {
    const issueType = match.rule.issueType?.toLowerCase() || '';
    const category = match.rule.category.id.toLowerCase();

    if (issueType.includes('misspelling') || category.includes('typo')) {
      return 'error';
    }
    if (issueType.includes('grammar') || category.includes('grammar')) {
      return 'error';
    }
    if (issueType.includes('style') || category.includes('style')) {
      return 'suggestion';
    }
    
    return 'warning'; // Default
  }

  public async checkText(text: string, language = 'en-US'): Promise<GrammarError[]> {
    if (!text.trim()) {
      return [];
    }

    try {
      const response = await this.makeRequest(text, language);
      return response.matches.map(match => this.mapLanguageToolError(match, text));
    } catch (error) {
      console.error('Grammar check failed:', error);
      return [];
    }
  }

  public async checkTextWithRetry(text: string, maxRetries = 3): Promise<GrammarError[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.checkText(text);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Grammar check attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    console.error('All grammar check attempts failed:', lastError);
    return [];
  }

  // Batch checking for better performance
  public async checkTextBatch(texts: string[]): Promise<GrammarError[][]> {
    const results: GrammarError[][] = [];
    
    for (const text of texts) {
      try {
        const errors = await this.checkText(text);
        results.push(errors);
      } catch (error) {
        console.error('Batch check failed for text:', text.substring(0, 50), error);
        results.push([]);
      }
    }

    return results;
  }

  // Get supported languages
  public async getSupportedLanguages(): Promise<string[]> {
    try {
      const url = this.apiKey ? this.baseUrl : this.freeUrl;
      const response = await fetch(`${url}/languages`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch languages: ${response.status}`);
      }

      const languages = await response.json();
      return languages.map((lang: any) => lang.code);
    } catch (error) {
      console.error('Failed to fetch supported languages:', error);
      return ['en-US', 'en-GB', 'en-AU']; // Fallback
    }
  }
}

// Singleton instance
export const languageToolService = new LanguageToolService();

// Export for custom API key usage
export { LanguageToolService };