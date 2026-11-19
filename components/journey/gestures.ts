// A wheel burst can contain dozens of momentum events. One swipe has an
// explicit lifetime, from touchstart to touchend or touchcancel.
export function bindJourneyGestures(
  track: HTMLElement,
  next: (direction: number, distance: number) => number | null,
  go: (stop: number) => void,
) {
  const nested = (event: Event) => !!(event.target as Element | null)?.closest?.(
    'dialog,[data-lenis-prevent],select,textarea,[contenteditable="true"]',
  );
  function consume(event: Event) {
    event.preventDefault();
    event.stopPropagation(); // The document's wheel smoother must not also move the page.
  }

  let lastWheel = -Infinity, wheelDirection = 0, wheelDistance = 0, wheelTaken = false;
  let peak = 0, previousDelta = 0;
  function wheel(event: WheelEvent) {
    if (!event.cancelable || event.defaultPrevented || event.ctrlKey || event.metaKey ||
        Math.abs(event.deltaY) <= Math.abs(event.deltaX) || nested(event)) return;
    const direction = Math.sign(event.deltaY);
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
    const distance = Math.abs(event.deltaY) * unit;
    // A second trackpad stroke can begin before the previous momentum tail ends.
    const renewedStroke = wheelTaken && previousDelta < peak * .25 &&
      distance > Math.max(14, previousDelta * 3, peak * .18);
    if (event.timeStamp - lastWheel > 170 || direction !== wheelDirection || renewedStroke) {
      wheelTaken = false;
      wheelDistance = 0;
      peak = 0;
    }
    peak = Math.max(peak, distance);
    previousDelta = distance;
    lastWheel = event.timeStamp;
    wheelDirection = direction;
    if (wheelTaken) { consume(event); return; }
    const stop = next(direction, distance);
    if (stop === null) return;
    consume(event);
    wheelDistance += distance;
    if (wheelDistance >= 8) { wheelTaken = true; go(stop); }
  }

  let finger: Touch | null = null, swipeTaken = false;
  function start(event: TouchEvent) {
    finger = event.touches.length === 1 && !nested(event) ? event.touches[0] : null;
    swipeTaken = false;
  }
  function move(event: TouchEvent) {
    if (event.touches.length !== 1) { finger = null; return; }
    if (!finger || !event.cancelable || event.defaultPrevented) return;
    if (swipeTaken) { consume(event); return; }
    const touch = event.touches[0];
    const dy = finger.clientY - touch.clientY;
    if (Math.abs(dy) <= Math.abs(finger.clientX - touch.clientX)) return;
    const stop = next(Math.sign(dy), Math.abs(dy));
    if (stop === null) return;
    consume(event);
    if (Math.abs(dy) >= 16) { swipeTaken = true; go(stop); }
  }
  function end() { finger = null; swipeTaken = false; }

  track.addEventListener('wheel', wheel, { passive: false });
  track.addEventListener('touchstart', start, { passive: true });
  track.addEventListener('touchmove', move, { passive: false });
  track.addEventListener('touchend', end);
  track.addEventListener('touchcancel', end);
  return () => {
    track.removeEventListener('wheel', wheel);
    track.removeEventListener('touchstart', start);
    track.removeEventListener('touchmove', move);
    track.removeEventListener('touchend', end);
    track.removeEventListener('touchcancel', end);
  };
}
