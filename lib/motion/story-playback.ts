export const STORY_INTERVAL = 2500;

export function nextStory(index: number, direction: number, count: number) {
  const step = index >= count - 1 ? -1 : index <= 0 ? 1 : direction;
  return { index: count < 2 ? 0 : index + step, direction: step };
}

export function createStoryPlayback(advance: () => void, onPlaying: (playing: boolean) => void = () => {}) {
  const pauses = new Set(["offscreen"]);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  let playing = false;
  const stopTimer = () => { clearTimeout(timer); timer = undefined; };
  const sync = () => {
    const enabled = !disposed && pauses.size === 0;
    if (playing !== enabled) { playing = enabled; onPlaying(enabled); }
    if (!enabled) { stopTimer(); return; }
    if (timer !== undefined) return;
    timer = setTimeout(() => { timer = undefined; advance(); sync(); }, STORY_INTERVAL);
  };
  return {
    pause(reason: string) { pauses.add(reason); sync(); },
    resume(reason: string) { pauses.delete(reason); sync(); },
    restart() { stopTimer(); sync(); },
    dispose() { disposed = true; stopTimer(); },
  };
}
