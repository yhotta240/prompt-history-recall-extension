import { BaseSiteAdapter } from './base';

export class NotionAIAdapter extends BaseSiteAdapter {
  getInputElement(): HTMLElement | null {
    // contenteditable="true"でdata-content-editable-leaf="true"のdiv
    const input = document.querySelector('[contenteditable="true"][data-content-editable-leaf="true"]');
    if (input) return input as HTMLElement;

    // フォールバック: placeholderに「質問や検索」が含まれるinput
    const inputs = Array.from(document.querySelectorAll('[contenteditable="true"]'));
    const targetInput = inputs.find(el => {
      const placeholder = el.getAttribute('placeholder');
      return placeholder?.includes('質問') || placeholder?.includes('検索');
    });

    return targetInput as HTMLElement || null;
  }

  getSubmitButton(): HTMLElement | null {
    // aria-label="AIメッセージを送信"のボタン
    const submitBtn = document.querySelector('button[aria-label*="送信"]');
    if (submitBtn) return submitBtn as HTMLElement;

    // フォールバック: 送信ボタンを探す
    const buttons = Array.from(document.querySelectorAll('button'));
    const submitButton = buttons.find(btn => {
      const ariaLabel = btn.getAttribute('aria-label');
      return ariaLabel?.includes('AI') && ariaLabel?.includes('メッセージ');
    });

    return submitButton as HTMLElement || null;
  }

  setInputValue(value: string): void {
    const input = this.getInputElement();
    if (!input) return;

    if (input.isContentEditable) {
      // Notionはcontenteditable
      input.textContent = value;

      // カーソルを末尾に移動
      const range = document.createRange();
      const sel = window.getSelection();
      if (input.firstChild) {
        range.setStart(input.firstChild, value.length);
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
    // Notion AIのユーザーメッセージを取得
    const messages: string[] = [];

    const layoutChatContainer = document.querySelector('div.layout-chat .layout-content');
    const selectableContainer = layoutChatContainer?.querySelector('div.notion-selectable-container');

    const chatContainer = selectableContainer?.querySelector('div.autolayout-col.autolayout-fill-width');
    if (!chatContainer) return messages;

    // 偶数番目の子要素がユーザーメッセージ
    const userContainers = Array.from(chatContainer.children).filter((_, index) => index % 2 === 0);

    userContainers.forEach(container => {
      const children = Array.from(container.querySelector('div.autolayout-col')?.children || []);
      const userMessages = children[children.length - 1];
      const text = userMessages.textContent?.trim();
      if (text) {
        messages.push(text);
      }
    });

    return messages;
  }
}
