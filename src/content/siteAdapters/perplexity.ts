import { BaseSiteAdapter } from './base';

export class PerplexityAdapter extends BaseSiteAdapter {
  getInputElement(): HTMLElement | null {
    // id="ask-input"のcontenteditable要素
    const input = document.querySelector('#ask-input');
    if (input) return input as HTMLElement;

    // フォールバック: contenteditable="true"でrole="textbox"
    const contentEditable = document.querySelector('[contenteditable="true"][role="textbox"]');
    return contentEditable as HTMLElement;
  }

  getSubmitButton(): HTMLElement | null {
    // aria-label="Submit"のボタン
    const submitBtn = document.querySelector('button[aria-label="Submit"]');
    if (submitBtn) return submitBtn as HTMLElement;

    // フォールバック: 入力フィールド近くの送信ボタンを探す
    const buttons = Array.from(document.querySelectorAll('button'));
    const submitButton = buttons.find(btn => {
      const ariaLabel = btn.getAttribute('aria-label');
      return ariaLabel?.includes('Submit') || ariaLabel?.includes('送信');
    });

    return submitButton as HTMLElement || null;
  }

  setInputValue(value: string): void {
    const input = this.getInputElement();
    if (!input) return;

    if (input.isContentEditable) {
      input.focus();

      // 全選択
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(input);
      selection?.removeAllRanges();
      selection?.addRange(range);

      // 削除（Lexicalはbeforeinput/inputイベントを監視）
      input.dispatchEvent(new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'deleteContent',
      }));

      // 新しいテキストを挿入
      input.dispatchEvent(new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: value,
      }));

      // Lexicalが実際にDOMを書き換えるまで待つために少し遅延させてinputイベントを発火
      setTimeout(() => this.triggerInputEvent(input), 10);
      return;
    }

    // 通常のinput要素の場合
    (input as HTMLInputElement | HTMLTextAreaElement).value = value;
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
    // Perplexityのユーザーメッセージを取得
    const messages: string[] = [];

    // textboxでcontenteditable="false"かつrole="textbox"の要素
    // これらはチャット履歴のユーザーメッセージ
    const textboxes = document.querySelectorAll('[role="textbox"][contenteditable="false"]');

    textboxes.forEach(textbox => {
      const text = textbox.textContent?.trim() || '';

      // 入力フィールドではなく、実際のメッセージのみを取得
      if (text.length > 0 && !text.includes('何でも尋ねてください') && !messages.includes(text)) {
        messages.push(text);
      }
    });

    return messages;
  }
}
