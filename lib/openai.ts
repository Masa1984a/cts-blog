const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

export interface TranslationResult {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Language configurations
 */
export const LANGUAGES = {
  en: 'English',
  es: 'Spanish (Español)',
  pt: 'Portuguese (Português)',
  ko: 'Korean (한국어)',
  zh: 'Simplified Chinese (简体中文)',
  tw: 'Traditional Chinese (繁體中文)',
  th: 'Thai (ไทย)',
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

/**
 * Translate markdown blog post to target language using OpenAI GPT-5-nano
 */
export async function translateBlogPost(params: {
  content: string;
  targetLanguage: LanguageCode;
  sourceLanguage?: string;
}): Promise<TranslationResult> {
  const { content, targetLanguage, sourceLanguage = 'Japanese' } = params;
  const languageName = LANGUAGES[targetLanguage];

  const systemPrompt = `You are a professional translator for technical blog content.

## CRITICAL REQUIREMENTS:
- Translate the content to ${languageName}
- Preserve ALL Markdown formatting (headings, lists, code blocks, links, etc.)
- Keep all code blocks unchanged
- Keep all URLs exactly as they are
- Maintain technical terminology accuracy
- Keep numbers, dates, and symbols unchanged
- Translate naturally while preserving the professional and technical tone
- Output only the translation result.
- Do NOT add any explanations or comments such as "Original content in Japanese:" or "Original content in English:"
- Output ONLY the translated markdown content`;

  const prompt = `Please translate the following blog post from ${sourceLanguage} to ${languageName}.

"""
${content}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes

    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-nano',
          reasoning: { effort: 'medium' },
          input: [
            {
              role: 'system',
              content: [{ type: 'input_text', text: systemPrompt }],
            },
            {
              role: 'user',
              content: [{ type: 'input_text', text: prompt }],
            },
          ],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      let translatedContent = '';

      // Try different response formats
      if (Array.isArray(data.output_text)) {
        translatedContent = data.output_text.join('\n');
      } else if (typeof data.output_text === 'string') {
        translatedContent = data.output_text;
      }

      if (!translatedContent && Array.isArray(data.output)) {
        const messageObject = data.output.find((item: any) => item.type === 'message');
        const messageContent = messageObject?.content?.find(
          (part: any) => part.type === 'output_text' || part.type === 'text'
        );
        translatedContent = messageContent?.text || '';
      }

      if (!translatedContent) {
        console.error('Unexpected API response:', JSON.stringify(data, null, 2));
        throw new Error('Could not extract translated content from API response');
      }

      return {
        content: translatedContent,
        usage: {
          prompt_tokens: data.usage?.input_tokens || data.usage?.prompt_tokens || 0,
          completion_tokens: data.usage?.output_tokens || data.usage?.completion_tokens || 0,
          total_tokens:
            (data.usage?.input_tokens || data.usage?.prompt_tokens || 0) +
            (data.usage?.output_tokens || data.usage?.completion_tokens || 0),
        },
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Translation API call timed out after 2 minutes');
      }
      throw error;
    }
  } catch (error) {
    console.error('Translation API error:', error);
    throw error;
  }
}

/**
 * Translate blog post to multiple languages using 2-stage translation for better accuracy:
 * 1. Japanese → English
 * 2. English → Other languages (es, pt, ko, zh, tw, th)
 */
export async function translateToAllLanguages(
  content: string
): Promise<Record<LanguageCode, string>> {
  const translations: Partial<Record<LanguageCode, string>> = {};

  // Stage 1: Translate Japanese → English
  console.log('Stage 1: Translating Japanese → English');
  try {
    const englishResult = await translateBlogPost({
      content,
      targetLanguage: 'en',
      sourceLanguage: 'Japanese',
    });
    translations.en = englishResult.content;
    console.log('✓ English translation completed');
  } catch (error) {
    console.error('English translation failed:', error);
    // If English translation fails, we cannot proceed with other languages
    throw new Error('Failed to translate to English. Cannot proceed with other languages.');
  }

  // Stage 2: Translate English → Other languages in parallel
  const otherLanguages: LanguageCode[] = ['es', 'pt', 'ko', 'zh', 'tw', 'th'];
  console.log('Stage 2: Translating English → Other languages');

  const results = await Promise.allSettled(
    otherLanguages.map(async (lang) => {
      const result = await translateBlogPost({
        content: translations.en!,
        targetLanguage: lang,
        sourceLanguage: 'English',
      });
      return { lang, content: result.content };
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      translations[result.value.lang] = result.value.content;
      console.log(`✓ ${result.value.lang} translation completed`);
    } else {
      console.error(`Translation failed for language:`, result.reason);
    }
  }

  return translations as Record<LanguageCode, string>;
}
