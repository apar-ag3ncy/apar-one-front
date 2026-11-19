// Fractions of one chapter's scroll distance, applied symmetrically on either
// side of its resting position. The middle of each transition cruises steadily.
const hold = .10;
const ramp = .08;

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
  const stop = Math.round(position);
  const distance = Math.abs(position - stop) - hold;
  if (distance <= 0) return stop;

  // Integrate a short acceleration ramp, then continue at constant speed.
  // Normalizing keeps the halfway point halfway in both scroll directions.
  const travel = distance < ramp ? distance * distance / (2 * ramp) : distance - ramp / 2;
  return stop + Math.sign(position - stop) * travel / (1 - 2 * hold - ramp);
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
