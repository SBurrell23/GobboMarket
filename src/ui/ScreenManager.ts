import { eventBus } from '../core/EventBus.js';

export type ScreenName = 'market' | 'forge' | 'runecraft' | 'upgrades' | 'progress' | 'help';

export class ScreenManager {
  private screens = new Map<ScreenName, HTMLElement>();
  private currentScreen: ScreenName = 'market';

  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  register(name: ScreenName, element: HTMLElement): void {
    element.classList.add('screen');
    this.screens.set(name, element);
    this.container.appendChild(element);
  }

  show(name: ScreenName): void {
    if (!this.screens.has(name)) return;
    for (const [key, el] of this.screens) {
      el.classList.toggle('active', key === name);
    }
    this.currentScreen = name;
    eventBus.emit('screen:changed', { screen: name });
  }

  getCurrent(): ScreenName {
    return this.currentScreen;
  }

  getScreen(name: ScreenName): HTMLElement | undefined {
    return this.screens.get(name);
  }
}
