import { ISiteAdapter } from '../types';
import { HistoryManager } from '../storage/historyManager';

export class KeyHandler {
  private currentIndex: number = -1;
  private originalInput: string = '';
  private history: string[] = [];
  private isNavigating: boolean = false;

  constructor(
    private adapter: ISiteAdapter,
    private historyManager: HistoryManager
  ) { }

  initialize(): void {
    this.history = this.historyManager.getHistory();
    this.setupKeyListener();
  }

  private setupKeyListener(): void {
    const input = this.adapter.getInputElement();
    if (!input) return;

    input.addEventListener('keydown', (e: Event) => {
      const keyEvent = e as KeyboardEvent;

      // 上矢印キー
      if (keyEvent.key === 'ArrowUp') {
        this.handleArrowUp(keyEvent);
      }
      // 下矢印キー
      else if (keyEvent.key === 'ArrowDown') {
        this.handleArrowDown(keyEvent);
      }
      // その他のキーが押されたらナビゲーション終了
      else if (!keyEvent.ctrlKey && !keyEvent.altKey && !keyEvent.metaKey) {
        this.resetNavigation();
      }
    });

    // 入力フィールドがフォーカスを失ったらリセット
    input.addEventListener('blur', () => {
      this.resetNavigation();
    });
  }

  private handleArrowUp(event: KeyboardEvent): void {
    event.preventDefault();

    // 最新の履歴を取得
    this.history = this.historyManager.getHistory();

    if (this.history.length === 0) return;

    // 初めてナビゲーションを開始する場合、現在の入力を保存
    if (!this.isNavigating) {
      this.originalInput = this.adapter.getInputValue();
      this.isNavigating = true;
      this.currentIndex = this.history.length;
    }

    // 履歴を遡る
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.adapter.setInputValue(this.history[this.currentIndex]);
    }
  }

  private handleArrowDown(event: KeyboardEvent): void {
    if (!this.isNavigating) return;

    event.preventDefault();

    // 履歴を進む
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      this.adapter.setInputValue(this.history[this.currentIndex]);
    } else {
      // 最新まで来たら元の入力に戻る
      this.currentIndex = this.history.length;
      this.adapter.setInputValue(this.originalInput);
      this.isNavigating = false;
    }
  }

  private resetNavigation(): void {
    this.isNavigating = false;
    this.currentIndex = -1;
    this.originalInput = '';
  }

  cleanup(): void {
    this.resetNavigation();
  }
}
