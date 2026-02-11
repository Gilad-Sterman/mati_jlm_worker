import { supabaseAdmin } from '../config/database.js';

class PrivacyFilterService {
  constructor() {
    this.supabase = supabaseAdmin;

    // Supported languages for full filtering
    this.SUPPORTED_LANGUAGES = ['he', 'en', 'ar'];

    // Language mapping for normalization
    this.LANGUAGE_MAP = {
      'he': 'he', 'hebrew': 'he', 'iw': 'he',
      'en': 'en', 'english': 'en',
      'ar': 'ar', 'arabic': 'ar',
      'el': 'el', 'greek': 'el'
    };
  }

  /**
   * Normalize language code/name to standard ISO code
   */
  normalizeLanguage(lang) {
    if (!lang) return null;
    const normalized = lang.toLowerCase().trim();
    return this.LANGUAGE_MAP[normalized] || normalized;
  }

  /**
   * Main entry point - filters transcription text and returns audit data
   * @param {string} text - The transcription text to filter
   * @param {string} language - Language code from Whisper (he, en, ar, etc.)
   * @param {string} sessionId - Session ID for audit logging
   * @returns {Object} { filteredText, auditData }
   */
  async filterTranscription(text, language, sessionId) {
    try {
      const normalizedLang = this.normalizeLanguage(language);
      console.log(`[PrivacyFilter] Starting privacy filtering for session ${sessionId}, language: ${language} (normalized: ${normalizedLang})`);

      const isConservative = this.shouldUseConservativeFiltering(normalizedLang);
      const filteredItems = [];
      let filteredText = text;

      if (isConservative) {
        // Conservative filtering - only perfect credit cards
        const result = this.filterPerfectCreditCards(filteredText, normalizedLang);
        filteredText = result.text;
        filteredItems.push(...result.items);
      } else {
        // FULL filtering mode - used for Hebrew, English, Arabic, and Unknown/Unsupported languages
        // for maximum safety (relying on checksums and context keywords)

        const creditCardResult = this.filterCreditCards(filteredText, normalizedLang);
        filteredText = creditCardResult.text;
        filteredItems.push(...creditCardResult.items);

        // Israeli ID - Checksum based, safe to run even if not explicitly Hebrew
        const idResult = this.filterIsraeliIds(filteredText, normalizedLang);
        filteredText = idResult.text;
        filteredItems.push(...idResult.items);

        const bankAccountResult = this.filterBankAccounts(filteredText, normalizedLang);
        filteredText = bankAccountResult.text;
        filteredItems.push(...bankAccountResult.items);

        const phoneResult = this.filterPhoneNumbers(filteredText, normalizedLang);
        filteredText = phoneResult.text;
        filteredItems.push(...phoneResult.items);
      }

      // Create audit data
      const auditData = {
        sessionId,
        filteredItems,
        totalFiltered: filteredItems.length,
        language,
        conservativeMode: isConservative,
        filteredAt: new Date().toISOString()
      };

      console.log(`[PrivacyFilter] Completed filtering: ${filteredItems.length} items filtered`);

      return {
        filteredText,
        auditData
      };

    } catch (error) {
      console.error('[PrivacyFilter] Error during filtering:', error);
      // Return original text on error to avoid breaking transcription
      return {
        filteredText: text,
        auditData: {
          sessionId,
          filteredItems: [],
          totalFiltered: 0,
          language,
          error: error.message,
          filteredAt: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Determines if conservative filtering should be used
   * @param {string} language - Language code
   * @returns {boolean}
   */
  shouldUseConservativeFiltering(language) {
    const normalized = this.normalizeLanguage(language);

    // List of languages where we are VERY sure we DON'T want full filtering
    // (e.g. because of high false positive risk or performance).
    const EXCLUDED_FROM_FULL = ['fr', 'es', 'de', 'ru', 'it', 'ja', 'zh'];
    return EXCLUDED_FROM_FULL.includes(normalized);
  }

  /**
   * Gets appropriate replacement text based on language
   * @param {string} language - Language code
   * @returns {string}
   */
  getReplacementText(language) {
    const normalized = this.normalizeLanguage(language);
    if (normalized === 'he') {
      return '[מידע מוסתר]';
    }
    if (normalized === 'ar') {
      return '[بيانات مخفية]';
    }
    return '[REDACTED]';
  }

  /**
   * Conservative filtering - only perfect credit card matches with Luhn validation
   * @param {string} text - Text to filter
   * @param {string} language - Language code
   * @returns {Object} { text, items }
   */
  filterPerfectCreditCards(text, language) {
    const items = [];
    const replacement = this.getReplacementText(language);

    // Match perfect 13-19 digit sequences
    const perfectCardPattern = /\b\d{13,19}\b/g;

    const filteredText = text.replace(perfectCardPattern, (match, offset) => {
      if (this.isValidCreditCard(match)) {
        const context = this.getContext(text, offset, match.length);

        items.push({
          type: 'credit_card',
          position: offset,
          context,
          confidence: 'high',
          originalValue: match,
          method: 'perfect_match_luhn'
        });

        return replacement;
      }
      return match;
    });

    return { text: filteredText, items };
  }

  /**
   * Full credit card filtering with fuzzy matching
   * @param {string} text - Text to filter
   * @param {string} language - Language code
   * @returns {Object} { text, items }
   */
  filterCreditCards(text, language) {
    const items = [];
    const replacement = this.getReplacementText(language);

    // Normalize text for fuzzy matching
    let normalizedText = this.normalizeNumbers(text);

    // Pattern for credit card numbers (13-19 digits with optional separators)
    const cardPatterns = [
      /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g, // 16 digits
      /\b\d{4}[\s\-]?\d{6}[\s\-]?\d{5}\b/g, // 15 digits (Amex)
      /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{3}\b/g, // 15 digits
      /\b\d{13,19}\b/g // Continuous digits
    ];

    cardPatterns.forEach(pattern => {
      normalizedText = normalizedText.replace(pattern, (match, offset) => {
        const cleanNumber = match.replace(/[\s\-]/g, '');

        if (cleanNumber.length >= 13 && cleanNumber.length <= 19) {
          const confidence = this.isValidCreditCard(cleanNumber) ? 'high' : 'medium';
          const context = this.getContext(text, offset, match.length);

          // Only filter if high confidence or if context suggests it's a credit card
          if (confidence === 'high' || this.hasCardContext(context)) {
            items.push({
              type: 'credit_card',
              position: offset,
              context,
              confidence,
              originalValue: match,
              method: 'fuzzy_match'
            });

            return replacement;
          }
        }

        return match;
      });
    });

    return { text: normalizedText, items };
  }

  /**
   * Filter bank account numbers
   * @param {string} text - Text to filter
   * @param {string} language - Language code
   * @returns {Object} { text, items }
   */
  filterBankAccounts(text, language) {
    const items = [];
    const replacement = this.getReplacementText(language);

    let normalizedText = this.normalizeNumbers(text);

    // Israeli bank account patterns
    const bankPatterns = [
      /\b\d{2}[\s\-]?\d{3}[\s\-]?\d{6,8}\b/g, // Branch-Account format
      /\b\d{6,12}\b/g // Simple account numbers
    ];

    bankPatterns.forEach(pattern => {
      normalizedText = normalizedText.replace(pattern, (match, offset) => {
        const context = this.getContext(text, offset, match.length);

        if (this.hasBankContext(context)) {
          items.push({
            type: 'bank_account',
            position: offset,
            context,
            confidence: 'medium',
            originalValue: match,
            method: 'context_match'
          });

          return replacement;
        }

        return match;
      });
    });

    return { text: normalizedText, items };
  }

  /**
   * Filter Israeli ID numbers
   * @param {string} text - Text to filter
   * @param {string} language - Language code
   * @returns {Object} { text, items }
   */
  filterIsraeliIds(text, language) {
    const items = [];
    const replacement = this.getReplacementText(language);

    let normalizedText = this.normalizeNumbers(text);

    // Israeli ID pattern (9 digits)
    const idPattern = /\b\d{9}\b/g;

    normalizedText = normalizedText.replace(idPattern, (match, offset) => {
      if (this.isValidIsraeliId(match)) {
        const context = this.getContext(text, offset, match.length);

        items.push({
          type: 'israeli_id',
          position: offset,
          context,
          confidence: 'high',
          originalValue: match,
          method: 'checksum_validation'
        });

        return replacement;
      }

      return match;
    });

    return { text: normalizedText, items };
  }

  /**
   * Filter phone numbers
   * @param {string} text - Text to filter
   * @param {string} language - Language code
   * @returns {Object} { text, items }
   */
  filterPhoneNumbers(text, language) {
    const items = [];
    const replacement = this.getReplacementText(language);

    let normalizedText = this.normalizeNumbers(text);

    // Phone number patterns
    const phonePatterns = [
      /\b0\d{1,2}[\s\-]?\d{7,8}\b/g, // Israeli format
      /\b\+972[\s\-]?\d{1,2}[\s\-]?\d{7,8}\b/g, // International Israeli
      /\b\d{3}[\s\-]?\d{3}[\s\-]?\d{4}\b/g // General format
    ];

    phonePatterns.forEach(pattern => {
      normalizedText = normalizedText.replace(pattern, (match, offset) => {
        const context = this.getContext(text, offset, match.length);

        if (this.hasPhoneContext(context)) {
          items.push({
            type: 'phone_number',
            position: offset,
            context,
            confidence: 'medium',
            originalValue: match,
            method: 'context_match'
          });

          return replacement;
        }

        return match;
      });
    });

    return { text: normalizedText, items };
  }

  /**
   * Normalize number representations in text
   * @param {string} text - Text to normalize
   * @returns {string}
   */
  normalizeNumbers(text) {
    const wordToNumber = {
      'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
      'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
      'dash': '-', 'minus': '-', 'hyphen': '-', 'space': '', 'gap': ''
    };

    let normalized = text;

    // First pass: convert word numbers to digits
    Object.entries(wordToNumber).forEach(([word, digit]) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      normalized = normalized.replace(regex, digit);
    });

    // Second pass: clean up multiple spaces and normalize separators
    normalized = normalized.replace(/\s+/g, ' '); // Multiple spaces to single space
    normalized = normalized.replace(/\s*-\s*/g, '-'); // Clean up dashes

    // Third pass: convert spaced digit sequences to continuous numbers
    // Match sequences like "4 5 3 2 1 2 3 4" and convert to "45321234"
    normalized = normalized.replace(/\b(\d\s+){3,}\d\b/g, (match) => {
      return match.replace(/\s+/g, '');
    });

    // Fourth pass: handle phone number patterns with dashes
    // Convert "0 5 2-1 2 3-4 5 6 7" to "052-123-4567"
    normalized = normalized.replace(/\b(\d\s+){2,}\d(-\d(\s+\d){2,}){1,2}\b/g, (match) => {
      return match.replace(/\s+/g, '');
    });

    return normalized;
  }

  /**
   * Get context around a match
   * @param {string} text - Full text
   * @param {number} offset - Match position
   * @param {number} length - Match length
   * @returns {string}
   */
  getContext(text, offset, length) {
    const contextSize = 50;
    const start = Math.max(0, offset - contextSize);
    const end = Math.min(text.length, offset + length + contextSize);
    return text.substring(start, end);
  }

  /**
   * Check if context suggests credit card
   * @param {string} context - Context text
   * @returns {boolean}
   */
  hasCardContext(context) {
    const cardKeywords = [
      'credit', 'card', 'visa', 'mastercard', 'amex', 'american express',
      'כרטיס', 'אשראי', 'ויזה', 'מאסטרקארד',
      'بطاقة', 'ائتمان', 'فيزا'
    ];

    const lowerContext = context.toLowerCase();
    return cardKeywords.some(keyword => lowerContext.includes(keyword));
  }

  /**
   * Check if context suggests bank account
   * @param {string} context - Context text
   * @returns {boolean}
   */
  hasBankContext(context) {
    const bankKeywords = [
      'bank', 'account', 'branch', 'routing', 'חשבון', 'בנק', 'סניף',
      'بنك', 'حساب', 'فرع'
    ];

    const lowerContext = context.toLowerCase();
    return bankKeywords.some(keyword => lowerContext.includes(keyword));
  }

  /**
   * Check if context suggests phone number
   * @param {string} context - Context text
   * @returns {boolean}
   */
  hasPhoneContext(context) {
    const phoneKeywords = [
      'phone', 'mobile', 'cell', 'number', 'call', 'landline', 'reach', 'contact',
      'טלפון', 'נייד', 'מספר', 'צלצלו', 'התקשרו',
      'هاتف', 'جوال', 'رقم'
    ];

    const lowerContext = context.toLowerCase();
    return phoneKeywords.some(keyword => lowerContext.includes(keyword));
  }

  /**
   * Validate credit card using Luhn algorithm
   * @param {string} number - Credit card number
   * @returns {boolean}
   */
  isValidCreditCard(number) {
    const cleanNumber = number.replace(/\D/g, '');

    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Validate Israeli ID using checksum
   * @param {string} id - Israeli ID number
   * @returns {boolean}
   */
  isValidIsraeliId(id) {
    if (id.length !== 9) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      let digit = parseInt(id[i]);
      if (i % 2 === 1) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      sum += digit;
    }

    return sum % 10 === 0;
  }

  /**
   * Save audit data to database (merges with existing metadata)
   * @param {Object} auditData - Audit information
   */
  async saveAuditData(auditData) {
    try {
      // Get existing transcription_metadata to merge with
      const { data: session, error: fetchError } = await this.supabase
        .from('sessions')
        .select('transcription_metadata')
        .eq('id', auditData.sessionId)
        .single();

      if (fetchError) {
        console.error('[PrivacyFilter] Error fetching existing metadata:', fetchError);
        return;
      }

      // Merge with existing metadata
      const existingMetadata = session.transcription_metadata || {};
      const updatedMetadata = {
        ...existingMetadata,
        privacy_filter: auditData
      };

      // Update with merged metadata
      const { error } = await this.supabase
        .from('sessions')
        .update({
          transcription_metadata: updatedMetadata
        })
        .eq('id', auditData.sessionId);

      if (error) {
        console.error('[PrivacyFilter] Error saving audit data:', error);
      } else {
        console.log(`[PrivacyFilter] Audit data saved for session ${auditData.sessionId}`);
      }
    } catch (error) {
      console.error('[PrivacyFilter] Error saving audit data:', error);
    }
  }
}

export default PrivacyFilterService;
