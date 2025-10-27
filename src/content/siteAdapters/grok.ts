import { BaseSiteAdapter } from './base';

export class GrokAdapter extends BaseSiteAdapter {
  getInputElement(): HTMLElement | null {
    // placeholder="どんなことでもお尋ねください"のtextarea
    const input = document.querySelector('textarea[placeholder*="お尋ねください"]');
    if (input) return input as HTMLElement;

    // フォールバック: 最初のtextarea
    const textarea = document.querySelector('textarea');
    return textarea as HTMLElement;
  }

  getSubmitButton(): HTMLElement | null {
    // aria-label="Grokに聞く"のボタン
    const submitBtn = document.querySelector('button[aria-label*="Grok"]');
    if (submitBtn) return submitBtn as HTMLElement;

    // フォールバック: 送信ボタンを探す
    const buttons = Array.from(document.querySelectorAll('button'));
    const submitButton = buttons.find(btn => {
      const ariaLabel = btn.getAttribute('aria-label');
      return ariaLabel?.includes('聞く') || ariaLabel?.includes('Ask');
    });

    return submitButton as HTMLElement || null;
  }

  setInputValue(value: string): void {
    const input = this.getInputElement();
    if (!input) return;

    if (input instanceof HTMLTextAreaElement) {
      // 通常のtextarea
      input.value = value;
    }

    this.triggerInputEvent(input);
  }

  getInputValue(): string {
    const input = this.getInputElement();
    if (!input) return '';

    if (input instanceof HTMLTextAreaElement) {
      return input.value;
    }

    return '';
  }

  getUserPromptHistory(): string[] {
    // Grokのユーザーメッセージを取得
    const messages: string[] = [];

    const grokContainer = document.querySelector('main [data-testid="primaryColumn"] [aria-label="Grok"]');
    if (!grokContainer) return messages;

    const lastChild = grokContainer.children[grokContainer.children.length - 1]
    const chatMessages = lastChild.querySelector('.css-175oi2r [style="flex-direction: column;"]');
    if (!chatMessages) return messages;

    // spanを除外
    const chatMessageDivs = Array.from(chatMessages.children).filter(child => child.tagName === 'DIV');

    // 偶数番目のdivがユーザーメッセージ
    const userMessages = chatMessageDivs.filter((_, index) => index % 2 === 0);
    userMessages.forEach(msgDiv => {
      const textContent = msgDiv.textContent?.trim();
      if (textContent && !messages.includes(textContent)) {
        messages.push(textContent);
      }
    });

    return messages;
  }
}
