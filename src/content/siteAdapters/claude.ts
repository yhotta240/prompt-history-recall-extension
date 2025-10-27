import { BaseSiteAdapter } from './base';

export class ClaudeAdapter extends BaseSiteAdapter {
  getInputElement(): HTMLElement | null {
    // ProseMirrorエディタ（data-testid="chat-input"）
    const input = document.querySelector('[data-testid="chat-input"]');
    if (input) return input as HTMLElement;

    // フォールバック: contenteditable="true"でrole="textbox"の要素
    const contentEditable = document.querySelector('[contenteditable="true"][role="textbox"]');
    return contentEditable as HTMLElement;
  }

  getSubmitButton(): HTMLElement | null {
    // aria-label="メッセージを送信"のボタン
    return document.querySelector('button[aria-label*="送信"]');
  }

  setInputValue(value: string): void {
    const input = this.getInputElement();
    if (!input) return;

    if (input.isContentEditable) {
      // ProseMirrorエディタの場合、innerTextを使う
      input.textContent = value;

      // カーソルを末尾に移動
      const range = document.createRange();
      const sel = window.getSelection();
      if (input.childNodes.length > 0) {
        range.setStart(input.childNodes[0], value.length);
        range.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }

    this.triggerInputEvent(input);
  }

  getInputValue(): string {
    const input = this.getInputElement();
    if (!input) return '';

    if (input.isContentEditable) {
      return input.textContent || '';
    }

    return '';
  }

  getUserPromptHistory(): string[] {
    // Claudeのユーザーメッセージを取得
    const messages: string[] = [];

    // data-testid="user-message"または類似の属性を持つ要素を探す
    const userMessages = document.querySelectorAll('[data-testid*="user"], [role="row"]');

    userMessages.forEach(messageEl => {
      const element = messageEl as HTMLElement;

      // ユーザーメッセージかどうかを判定
      const isUserMessage =
        element.querySelector('[data-testid*="user"]') ||
        element.textContent?.trim().length > 0;

      if (isUserMessage) {
        const text = element.textContent?.trim() || '';
        if (text.length > 0 && !messages.includes(text)) {
          messages.push(text);
        }
      }
    });

    return messages;
  }
}
