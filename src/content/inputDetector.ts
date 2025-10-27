import { ISiteAdapter } from '../types';

export class InputDetector {
  private checkInterval: number = 500;
  private maxAttempts: number = 20;

  async detectInputElement(adapter: ISiteAdapter): Promise<HTMLElement | null> {
    let attempts = 0;

    return new Promise((resolve) => {
      const check = () => {
        const input = adapter.getInputElement();

        if (input) {
          resolve(input);
          return;
        }

        attempts++;
        if (attempts >= this.maxAttempts) {
          resolve(null);
          return;
        }

        setTimeout(check, this.checkInterval);
      };

      check();
    });
  }

  isValidInputElement(element: HTMLElement): boolean {
    if (!element) return false;

    // textareaまたはcontentEditableな要素
    if (element instanceof HTMLTextAreaElement) return true;
    if (element.isContentEditable) return true;

    return false;
  }
}
