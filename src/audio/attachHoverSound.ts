import { soundManager } from './SoundManager.js';

export function attachHoverSound(el: HTMLElement): void {
  el.addEventListener('mouseenter', () => {
    soundManager.play('ui_hover', { volume: 0.35 });
  });
}
