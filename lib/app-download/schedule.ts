/** One automatic app download invitation per browser every two hours. */
export const APP_PROMPT_STORAGE_KEY = "fbmn:app-download:last-shown:v1";
export const APP_PROMPT_INTERVAL_MS = 2 * 60 * 60 * 1000;
export const APP_PROMPT_FIRST_VISIT_DELAY_MS = 1400;

export function getNextAutoPromptDelay(now: number, lastShownAt: number | null): number {
  if (lastShownAt === null ||
      !Number.isSafeInteger(lastShownAt) ||
      lastShownAt <= 0 ||
      lastShownAt > now + APP_PROMPT_INTERVAL_MS) {
    return APP_PROMPT_FIRST_VISIT_DELAY_MS;
  }
  return Math.max(0, lastShownAt + APP_PROMPT_INTERVAL_MS - now);
}
