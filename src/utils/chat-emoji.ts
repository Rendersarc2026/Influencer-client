/**
 * Emoji and sticker data for the chat composer.
 *
 * Kept out of the component file so the picker stays a component-only module
 * (fast refresh) and so the message transcript can ask `isStickerMessage`
 * without importing the picker itself.
 */
/**
 * Emoji are plain text, so they need no picker library, no bundle weight and no
 * schema change — `safeMultilineText` already carries any Unicode that is not a
 * control character. A curated set beats a full 1,800-emoji dependency here: the
 * chat is a working channel between an agency, its brands and its creators, and
 * these are the ones that actually get used.
 */
export const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: 'Smileys',
    emojis: [
      '😀',
      '😃',
      '😄',
      '😁',
      '😅',
      '😂',
      '🙂',
      '😉',
      '😊',
      '😍',
      '😘',
      '😎',
      '🤩',
      '🥳',
      '🤔',
      '🙃',
      '😌',
      '😴',
      '🤗',
      '🤝',
      '😐',
      '😬',
      '😕',
      '🙁',
      '😢',
      '😭',
      '😤',
      '😱',
      '🤯',
      '😇',
    ],
  },
  {
    label: 'Gestures',
    emojis: [
      '👍',
      '👎',
      '👌',
      '🙌',
      '👏',
      '🙏',
      '💪',
      '✌️',
      '🤞',
      '👋',
      '☝️',
      '👉',
      '👈',
      '✍️',
      '🫡',
      '🤙',
      '🖖',
      '✋',
      '👊',
      '🤛',
    ],
  },
  {
    label: 'Work',
    emojis: [
      '✅',
      '❌',
      '⚠️',
      '📌',
      '📎',
      '📅',
      '⏰',
      '⏳',
      '📈',
      '📉',
      '📊',
      '💰',
      '💵',
      '🧾',
      '📝',
      '📄',
      '📁',
      '🔗',
      '🔍',
      '🎯',
      '🚀',
      '🔥',
      '⭐',
      '💡',
      '📣',
      '🎬',
      '📸',
      '🎥',
      '📱',
      '💻',
    ],
  },
  {
    label: 'Hearts',
    emojis: [
      '❤️',
      '🧡',
      '💛',
      '💚',
      '💙',
      '💜',
      '🖤',
      '🤍',
      '💯',
      '✨',
      '🎉',
      '🎊',
      '🏆',
      '🥇',
      '👑',
      '💎',
      '🌟',
      '💫',
      '🙌',
      '🫶',
    ],
  },
];

/**
 * Stickers are oversized single emoji sent on their own.
 *
 * A true image sticker needs a message type, hosting and a render path; sending
 * one character that the bubble renders large gets the same expressive result
 * with no new storage and no change to the message pipeline. `isStickerMessage`
 * below is what the transcript uses to decide.
 */
export const STICKERS: string[] = [
  '👍',
  '🎉',
  '🔥',
  '👏',
  '💯',
  '🚀',
  '😂',
  '😍',
  '🥳',
  '🤝',
  '✅',
  '❤️',
  '😅',
  '🙏',
  '💡',
  '⭐',
  '🏆',
  '👀',
];

/**
 * True when a message is nothing but emoji (and whitespace), and short enough to
 * have been meant as a sticker rather than as text that happens to contain them.
 */
export function isStickerMessage(body: string): boolean {
  const trimmed = body.trim();
  if (!trimmed) return false;
  // Any letter, digit or punctuation means it is a sentence, not a sticker.
  if (/[\p{L}\p{N}]/u.test(trimmed)) return false;
  if (!/\p{Extended_Pictographic}/u.test(trimmed)) return false;
  return [...trimmed].length <= 8;
}

/**
 * Where an inserted emoji actually belongs: at the caret, replacing whatever is
 * selected — not glued onto the end.
 *
 * Appending is only correct when the caret happens to be at the end, which it is
 * not once someone goes back to edit a sentence they already typed. Returns the
 * new caret offset too, so the caller can restore it: the browser puts the caret
 * at the end of a controlled input whose value changed underneath it, which
 * would undo the insertion point on the very next keystroke.
 */
export function insertAtCaret(
  input: HTMLInputElement | HTMLTextAreaElement | null,
  current: string,
  insert: string,
): { value: string; caret: number } {
  const hasSelection =
    input != null && input.selectionStart !== null && input.selectionEnd !== null;
  const start = hasSelection ? (input.selectionStart as number) : current.length;
  const end = hasSelection ? (input.selectionEnd as number) : current.length;

  return {
    value: current.slice(0, start) + insert + current.slice(end),
    caret: start + insert.length,
  };
}
