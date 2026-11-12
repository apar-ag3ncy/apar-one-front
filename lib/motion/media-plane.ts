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
