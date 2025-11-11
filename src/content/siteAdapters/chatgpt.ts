import { BaseSiteAdapter } from './base';

export class ChatGPTAdapter extends BaseSiteAdapter {
  getInputElement(): HTMLElement | null {
    // ProseMirrorエディタ（メイン入力）
    const proseMirror = document.querySelector('#prompt-textarea.ProseMirror');
    if (proseMirror) return proseMirror as HTMLElement;

    // フォールバックとしてtextareaも探す
    const textarea = document.querySelector('textarea[name="prompt-textarea"]');
    return textarea as HTMLElement;
  }

  getSubmitButton(): HTMLElement | null {
    // data-testid="send-button"で送信ボタンを取得
    return document.querySelector('button[data-testid="send-button"]');
  }

  setInputValue(value: string): void {
    const input = this.getInputElement();
    if (!input) return;

    if (input instanceof HTMLTextAreaElement) {
      input.value = value;
    } else if (input.isContentEditable) {
      // ProseMirrorエディタの場合
      input.textContent = value;
    }

    this.triggerInputEvent(input);
  }

  getInputValue(): string {
    const input = this.getInputElement();
    if (!input) return '';

    if (input instanceof HTMLTextAreaElement) {
      return input.value;
    } else if (input.isContentEditable) {
      return input.textContent || '';
    }

    return '';
  }

  getUserPromptHistory(): string[] {
    const articles = Array.from(document.querySelectorAll('article'));

    const userMessages = articles
      .filter(article => {
        const userTurn: boolean = article.dataset.turn === 'user' || false;
        return userTurn;
      })
      .map(article => {
        // whitespace-pre-wrapクラスのdivから直接テキストを取得
        const messageDiv = article.querySelector('.whitespace-pre-wrap');
        if (!messageDiv) return '';

        // テキストノードのみを取得
        let text = '';
        const childNodes = Array.from(messageDiv.childNodes);
        for (const node of childNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            text += node.textContent || '';
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            // コードブロックやリンクなどの子要素も含める（ボタン以外）
            if (el.tagName !== 'BUTTON') {
              text += el.textContent || '';
            }
          }
        }

        return text.trim();
      })
      .filter(text => text.length > 0);

    return userMessages;
  }
}

