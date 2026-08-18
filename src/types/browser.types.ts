/**
 * Shapes for browser APIs the DOM lib does not describe.
 */

/** Safari only exposes the audio constructor under its vendor prefix. */
export interface WindowWithWebkitAudio {
  webkitAudioContext?: typeof AudioContext;
}
