/**
 * Client-side check for blocked contact details in chat.
 * Backend enforces the same rules - this provides immediate feedback.
 */
const BLOCKED_PATTERNS = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // email
  /(\+234[\s-]?|0)(7[0-9]|8[0-2]|9[0-2])[\s.-]?\d{3}[\s.-]?\d{4}/, // Nigerian phone
  /\d{10,}/, // 10+ consecutive digits
  /wa\.me\/\d+/i, // WhatsApp link
  /t\.me\/[a-zA-Z0-9_]+/i, // Telegram link
  /(?:\d\D*){10,}/, // digits with any separators
  /\b(call|whatsapp|wa|telegram|dm|text|phone|number)\b/i, // contact words
];

export const BLOCKED_MESSAGE =
  'Please do not share phone numbers, emails, or contact details. All communication should stay on the platform. Continued attempts will result in your account being flagged.';

const hasNumberWords = (text: string): boolean => {
  const matches = text
    .toLowerCase()
    .match(/\b(zero|one|two|three|four|five|six|seven|eight|nine)\b/g);
  return !!matches && matches.length >= 10;
};

export function containsBlockedContactDetails(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (!trimmed) return false;
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(trimmed)) || hasNumberWords(trimmed);
}
