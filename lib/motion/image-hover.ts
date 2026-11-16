const owners = new Set<object>();

/** Separate owners let the HTML and curved-image renderers hand over safely. */
export function setImageHover(owner: object, active: boolean) {
  if (active) owners.add(owner);
  else owners.delete(owner);
  if (owners.size) document.documentElement.dataset.onImage = "1";
  else delete document.documentElement.dataset.onImage;
}
