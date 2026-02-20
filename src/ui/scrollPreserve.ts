/** Saves scroll positions of app scroll containers (excludes modals). */
export function saveScrollPositions(): Map<Element, number> {
  const saved = new Map<Element, number>();
  const app = document.getElementById('app');
  if (!app) return saved;
  const selectors =
    '.customer-queue-scroll, .supplier-scroll, .screen, .market-layout__sidebar, .market-layout__center';
  app.querySelectorAll(selectors).forEach((el) => {
    if (el instanceof HTMLElement && el.scrollHeight > el.clientHeight) {
      saved.set(el, el.scrollTop);
    }
  });
  return saved;
}

/** Restores scroll positions after a modal closes. Call after backdrop is removed. */
export function restoreScrollPositions(saved: Map<Element, number>): void {
  requestAnimationFrame(() => {
    saved.forEach((scrollTop, el) => {
      if (el.isConnected) {
        (el as HTMLElement).scrollTop = scrollTop;
      }
    });
  });
}
