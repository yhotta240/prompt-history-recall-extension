import { BaseSiteAdapter } from './base';

export class CopilotAdapter extends BaseSiteAdapter {
  getInputElement(): HTMLElement | null {
    // data-testid="composer-input"のtextarea
    const input = document.querySelector('[data-testid="composer-input"]');
    if (input) return input as HTMLElement;

    // フォールバック: id="userInput"のtextarea
    const userInput = document.querySelector('#userInput');
    return userInput as HTMLElement;
  }

  getSubmitButton(): HTMLElement | null {
    // aria-label="Copilot と会話する"のボタン
    const submitBtn = document.querySelector('button[aria-label*="会話"]');
    if (submitBtn) return submitBtn as HTMLElement;

    // フォールバック: 送信ボタンを探す
    const buttons = Array.from(document.querySelectorAll('button'));
    const submitButton = buttons.find(btn => {
      const ariaLabel = btn.getAttribute('aria-label');
      return ariaLabel?.includes('Copilot') || ariaLabel?.includes('Submit');
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
    // Microsoft Copilotのユーザーメッセージを取得
    const messages: string[] = [];

    // チャット履歴からユーザーメッセージを探す
    // 具体的なセレクタはページ構造によって調整が必要
    const userMessages = document.querySelectorAll('[data-content="user-message"]');

    userMessages.forEach(messageEl => {
      const element = messageEl as HTMLElement;
      const text = element.textContent?.trim() || '';

      if (text.length > 0 && !messages.includes(text)) {
        messages.push(text);
      }
    });

    return messages;
  }
}
