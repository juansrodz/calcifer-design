/** Polls `url` until it answers (any status) or the attempts run out. */
export async function waitForServer(
  url: string,
  { attempts = 40, delayMs = 250 }: { attempts?: number; delayMs?: number } = {},
): Promise<void> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await fetch(url, { method: 'HEAD' });
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error(`${url} did not answer after ${attempts} attempts`);
}
