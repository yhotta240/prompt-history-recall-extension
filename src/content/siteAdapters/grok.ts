import { BaseSiteAdapter } from './base';

export class GrokAdapter extends BaseSiteAdapter {
  getInputElement(): HTMLElement | null {
    const form = document.querySelector('main form');
    if (!form) return null;
    const textarea = form.querySelector('textarea');
    const input = form.querySelector('div[contenteditable]');
    return textarea as HTMLTextAreaElement || input as HTMLDivElement || null;
  }

  getSubmitButton(): HTMLElement | null {
    // フォールバック: 送信ボタンを探す
    const buttons = Array.from(document.querySelectorAll('button'));
    const submitButton = buttons.find(btn => {
      const ariaLabel = btn.getAttribute('aria-label');
      return ariaLabel?.includes('送信') || ariaLabel?.includes('Ask Grok');
    });

    return submitButton as HTMLElement || null;
  }

  setInputValue(value: string): void {
    const input = this.getInputElement();
    if (!input) return;

    if (input.isContentEditable) {
      // contentEditableなdiv
      input.innerText = value;
    } else if (input instanceof HTMLTextAreaElement) {
      input.innerText = value;
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

  /**
   * Grok のユーザープロンプト履歴を取得する関数
   */
  getUserPromptHistory(): string[] {
    const messages: string[] = [];

    const grokContainer = document.querySelector('main .breakout [style="overflow-anchor: none;"] .relative');
    if (!grokContainer) {
      console.warn("Grok container not found.");
      return messages;
    }

    const chatMessages = grokContainer.children;
    if (!chatMessages || chatMessages.length === 0) {
      console.warn("No chat messages found in Grok container.");
      return messages;
    }

    const collectMessage = (ele: HTMLElement) => {
      const textContent = ele.textContent?.trim();
      if (textContent && !messages.includes(textContent)) {
        messages.push(textContent);
      }
    }

    Array.from(chatMessages).forEach((child) => {
      const messageId = child.id;
      if (messageId.includes('last-reply-container')) {
        const firstChild = child.firstElementChild;
        if (firstChild) {
          collectMessage(firstChild as HTMLElement);
        }
      }

      const isUserMessage = child.classList.contains('items-end');
      if (isUserMessage) {
        collectMessage(child as HTMLElement);
      }
    });

    return messages;
  }
}
