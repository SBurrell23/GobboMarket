let activeTooltip: HTMLElement | null = null;

export function showTooltip(target: HTMLElement, html: string): void {
  hideTooltip();
  const tip = document.createElement('div');
  tip.className = 'tooltip anim-fade-in';
  tip.innerHTML = html;
  tip.style.cssText = `
    position: fixed;
    background: var(--bg-dark);
    border: 1px solid var(--gold-dim);
    border-radius: var(--radius-sm);
    padding: 8px 12px;
    font-size: 0.85rem;
    color: var(--ink);
    max-width: 250px;
    z-index: 300;
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(0,0,0,0.6);
  `;
  document.body.appendChild(tip);

  const rect = target.getBoundingClientRect();
  const tipRect = tip.getBoundingClientRect();

  let left = rect.left + rect.width / 2 - tipRect.width / 2;
  let top = rect.top - tipRect.height - 8;

  if (top < 4) top = rect.bottom + 8;
  if (left < 4) left = 4;
  if (left + tipRect.width > window.innerWidth - 4) {
    left = window.innerWidth - tipRect.width - 4;
  }

  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
  activeTooltip = tip;
}

export function hideTooltip(): void {
  if (activeTooltip) {
    activeTooltip.remove();
    activeTooltip = null;
  }
}
