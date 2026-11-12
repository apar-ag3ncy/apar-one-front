/** Only intercept destinations on the current document; leave routing to Next. */
export function samePageAnchor(href: string, currentHref: string) {
  try {
    const current = new URL(currentHref);
    const destination = new URL(href, current);
    if (
      destination.origin !== current.origin ||
      destination.pathname !== current.pathname ||
      destination.search !== current.search ||
      !destination.hash
    ) return null;
    return { hash: destination.hash, id: decodeURIComponent(destination.hash.slice(1)) };
  } catch {
    return null;
  }
}

/** Preserve the keyboard's place after navigating to a non-interactive section. */
export function focusAnchor(target: HTMLElement) {
  if (!target.hasAttribute("tabindex") && target.tabIndex < 0) {
    target.setAttribute("tabindex", "-1");
    target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
  }
  target.focus({ preventScroll: true });
}
