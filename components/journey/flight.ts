// An arrival and a resting frame per chapter. Each arrival is beyond its
// caption fade and shows a different part of the shot from the resting frame.
const arrivals = [.56, .59, .57, .73, .49, .68];
export const flightStops = [0, ...arrivals.flatMap((phase, chapter) => [chapter + phase, chapter + 1])];

export function nextFlightStop(position: number, direction: number, tolerance: number) {
  if (direction > 0) return flightStops.find(stop => stop > position + tolerance) ?? null;
  for (let i = flightStops.length - 1; i >= 0; i--) {
    if (flightStops[i] < position - tolerance) return flightStops[i];
  }
  return null;
}

export function cameraAtScroll(offset: number, range: number, lastChapter: number) {
  if (range <= 0 || lastChapter <= 0) return 0;
  const position = Math.max(0, Math.min(1, offset / range)) * lastChapter;
  // Slow down around the captions. The slope stays between .45 and 1.55,
  // so even a one-pixel reversal moves the camera through a chapter boundary.
  const turn = 2 * Math.PI;
  return position - .55 * Math.sin(turn * (position % 1)) / turn;
}

export function easeCamera(current: number, target: number, elapsedMs: number) {
  const distance = target - current;
  if (Math.abs(distance) < .00005) return target;
  // A short native-scroll settle, with the same timing on 60 and 120 Hz phones.
  return current + distance * -Math.expm1(-elapsedMs / 75);
}

// Apply a soft knee to high-velocity wheel samples. Small movements retain
// their original distance and even the largest flick keeps moving the film.
export function journeyWheelDelta(delta: number, viewportHeight: number) {
  const knee = Math.max(40, viewportHeight * .064);
  const distance = Math.abs(delta);
  if (distance <= knee) return delta;
  return Math.sign(delta) * knee * (1 + Math.log(distance / knee));
}

function ease(start: number, end: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

// Exit the old caption before the camera crosses the set. The incoming caption
// and client reel each have their own cue, tied to the picture in both directions.
const entrances = [.4, .45, .42, .66, .30, .59];
const exits = [.26, .19, .19, .15, .10, .16];

export function overlayAt(position: number) {
  const left = Math.floor(position);
  if (left >= 6) return { chapter: 6, opacity: 1, reel: 0 };
  const phase = position - left;
  const incoming = phase >= entrances[left];
  const opacity = incoming
    ? ease(entrances[left], entrances[left] + .15, phase)
    : 1 - ease(0, exits[left], phase);
  let reel = 0;
  if (left === 4) reel = ease(.84,1,phase);
  if (left === 5) reel = 1-ease(0,.12,phase);
  return { chapter: left + Number(incoming), opacity, reel };
}
