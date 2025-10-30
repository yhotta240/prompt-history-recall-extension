export class Toast {
  private toastElement: HTMLDivElement | null = null;
  private hideTimeout: number | null = null;

  /**
   * トースト通知を表示
   * @param message 表示するメッセージ（例: "3/10"）
   * @param duration 表示時間（ミリ秒，デフォルト: 1500ms）
   */
  show(message: string, duration: number = 1500): void {
    // 既存のトーストを削除
    this.hide();

    // トースト要素を作成
    this.toastElement = document.createElement('div');
    this.toastElement.textContent = message;
    this.toastElement.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      font-family: system-ui, -apple-system, sans-serif;
      z-index: 999999;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease-in-out;
    `;

    document.body.appendChild(this.toastElement);

    // フェードイン
    requestAnimationFrame(() => {
      if (this.toastElement) {
        this.toastElement.style.opacity = '1';
      }
    });

    // 自動で非表示
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
    this.hideTimeout = window.setTimeout(() => {
      this.hide();
    }, duration);
  }

  /**
   * トーストを非表示
   */
  hide(): void {
    if (this.toastElement) {
      this.toastElement.style.opacity = '0';
      setTimeout(() => {
        if (this.toastElement && this.toastElement.parentNode) {
          this.toastElement.parentNode.removeChild(this.toastElement);
        }
        this.toastElement = null;
      }, 200);
    }

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  /**
   * クリーンアップ
   */
  cleanup(): void {
    this.hide();
  }
}
