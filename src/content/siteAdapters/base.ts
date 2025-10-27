import { ISiteAdapter } from '../../types';

export abstract class BaseSiteAdapter implements ISiteAdapter {
  protected observers: MutationObserver[] = [];

  abstract getInputElement(): HTMLElement | null;
  abstract getSubmitButton(): HTMLElement | null;
  abstract setInputValue(value: string): void;
  abstract getInputValue(): string;
  abstract getUserPromptHistory(): string[];

  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  protected triggerInputEvent(element: HTMLElement): void {
    const inputEvent = new Event('input', { bubbles: true });
    element.dispatchEvent(inputEvent);
  }
}
