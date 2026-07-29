import OpenAI from 'openai';

// The chat model used to pick recommended hairstyles from a customer's photo.
export const VISION_MODEL = 'gpt-4o';

// The image-editing model used to render the customer wearing each recommended cut.
// gpt-image-1 is the only OpenAI image-edit model currently available (aside from dall-e-2);
// configurable via env in case that changes.
export const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';

let client: OpenAI | null | undefined;

// Lazily create a singleton OpenAI client. Returns null if no API key is configured,
// so callers can fail with a clear error instead of throwing on import.
export function getOpenAIClient(): OpenAI | null {
  if (client !== undefined) return client;
  const apiKey = process.env.OPENAI_API_KEY;
  client = apiKey ? new OpenAI({ apiKey }) : null;
  return client;
}
