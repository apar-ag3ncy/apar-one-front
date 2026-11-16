/** Fill the card with the smallest proportional crop; never add a zoom layer. */
export function coverFit(width: number, height: number, frameWidth: number, frameHeight: number,
  positionY = .5, edgeTrim = 0) {
  const boxWidth = frameWidth * (1 + edgeTrim * 2), boxHeight = frameHeight * (1 + edgeTrim * 2);
  const scale = Math.max(boxWidth / width, boxHeight / height);
  const fittedWidth = width * scale, fittedHeight = height * scale;
  return { x: (boxWidth - fittedWidth) / 2 - frameWidth * edgeTrim,
    y: (boxHeight - fittedHeight) * positionY - frameHeight * edgeTrim,
    width: fittedWidth, height: fittedHeight };
}

export function planeMesh(columns = 24, rows = 16) {
  const vertices = new Float32Array(columns * rows * 12);
  let offset = 0;
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const x = column / columns, y = row / rows;
      const right = (column + 1) / columns, bottom = (row + 1) / rows;
      vertices.set([x, y, right, y, x, bottom, x, bottom, right, y, right, bottom], offset);
      offset += 12;
    }
  }
  return vertices;
}

export const mediaBend = (velocity: number) => Math.max(-14, Math.min(14, velocity * .006));

/** Invert the small vertex bend so hover pixels stay underneath the pointer. */
export function photoPoint(x: number, y: number, width: number, height: number,
  state: { entry: number; parallax: number; hover: number; x: number; y: number }, bend: number, side: number) {
  const entry = 1 - state.entry;
  const localX = x - state.x * state.hover * 3;
  const localY = y - entry * 24 - state.parallax * 6 + state.hover * 3 - state.y * state.hover * 3;
  let u = x / width, v = y / height;
  for (let i = 0; i < 4; i++) {
    u = (localX - width * .03 * entry - Math.sin(v * 3.14159) * side * entry * 8) / (width * (1 - .06 * entry));
    const curve = Math.sin(u * 3.14159);
    v = (localY - curve * (bend - entry * 11)) / (height + curve * entry * 22);
  }
  return { x: u * width, y: v * height };
}
