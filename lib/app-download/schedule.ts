/** One automatic app download invitation per browser every two hours. */
export const APP_PROMPT_STORAGE_KEY = "fbmn:app-download:last-shown:v1";
export const APP_PROMPT_INTERVAL_MS = 2 * 60 * 60 * 1000;
export const APP_PROMPT_FIRST_VISIT_DELAY_MS = 1400;

export function getNextAutoPromptDelay(now: number, lastShownAt: number | null,
  firstDelayMs:number=APP_PROMPT_FIRST_VISIT_DELAY_MS,
  intervalMs:number=APP_PROMPT_INTERVAL_MS): number {
  if (lastShownAt === null ||
      !Number.isSafeInteger(lastShownAt) ||
      lastShownAt <= 0 ||
      lastShownAt > now + intervalMs) {
    return firstDelayMs;
  }
  return Math.max(0, lastShownAt + intervalMs - now);
}
