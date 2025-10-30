import { ISiteAdapter } from '../types';
import { HistoryManager } from '../storage/historyManager';
import { Toast } from './toast';

export class KeyHandler {
  private currentIndex: number = -1;
  private originalInput: string = '';
  private history: string[] = [];
  private isNavigating: boolean = false;
  private useDefaultUpKey: boolean = true; // デフォルトの上キーを使用するか
  private useDefaultDownKey: boolean = true; // デフォルトの下キーを使用するか
  private toast: Toast;
  private showToastNotification: boolean = true;
  private keydownHandler: ((e: Event) => void) | null = null;

  constructor(
    private adapter: ISiteAdapter,
    private historyManager: HistoryManager
  ) {
    this.toast = new Toast();
  }

  async initialize(): Promise<void> {
    this.history = this.historyManager.getHistory();
    await this.checkCommandsConfig();
    await this.loadSettings();
    this.setupKeyListener();
  }

  private async loadSettings(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['settings'], (data) => {
        if (data.settings) {
          this.showToastNotification = data.settings.showToastNotification !== false;
        }
        resolve();
      });
    });
  }

  // Commands APIでキーが設定されているかチェック（backgroundに問い合わせ）
  private async checkCommandsConfig(): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'CHECK_COMMANDS_CONFIG' });
      this.useDefaultUpKey = response.useDefaultUpKey;
      this.useDefaultDownKey = response.useDefaultDownKey;
    } catch (error) {
      console.error('Failed to check commands config:', error);
      // エラー時はデフォルトキーを有効にする
      this.useDefaultUpKey = true;
      this.useDefaultDownKey = true;
    }
  }

  private setupKeyListener(): void {
    // documentレベルでキーイベントをキャプチャ
    document.addEventListener('keydown', (e: Event) => {
      const keyEvent = e as KeyboardEvent;

      // 入力要素がフォーカスされているかチェック
      const input = this.adapter.getInputElement();
      if (!input || document.activeElement !== input) {
        return;
      }

      // Alt+上矢印キー（デフォルトキーが有効な場合のみ）
      if (keyEvent.key === 'ArrowUp' && keyEvent.altKey && this.useDefaultUpKey) {
        this.handleArrowUp(keyEvent);
        return;
      }
      // Alt+下矢印キー（デフォルトキーが有効な場合のみ）
      else if (keyEvent.key === 'ArrowDown' && keyEvent.altKey && this.useDefaultDownKey) {
        this.handleArrowDown(keyEvent);
        return;
      }

      // 修飾キーなしの通常のキー入力の場合，ナビゲーション終了
      if (!keyEvent.ctrlKey && !keyEvent.altKey && !keyEvent.metaKey) {
        this.resetNavigation();
      }
    });
  }

  private handleArrowUp(event?: KeyboardEvent): void {
    if (event) {
      event.preventDefault();
    }

    // 最新の履歴を取得
    this.history = this.historyManager.getHistory();

    if (this.history.length === 0) return;

    // 初めてナビゲーションを開始する場合，現在の入力を保存
    if (!this.isNavigating) {
      this.originalInput = this.adapter.getInputValue();
      this.isNavigating = true;
      this.currentIndex = this.history.length;
    }

    // 履歴を遡る
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.adapter.setInputValue(this.history[this.currentIndex]);
      this.showNavigationToast();
    }
  }

  private handleArrowDown(event?: KeyboardEvent): void {
    if (!this.isNavigating) return;

    if (event) {
      event.preventDefault();
    }

    // 履歴を進む
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      this.adapter.setInputValue(this.history[this.currentIndex]);
      this.showNavigationToast();
    } else {
      // 最新まで来たら元の入力に戻る
      this.currentIndex = this.history.length;
      this.adapter.setInputValue(this.originalInput);
      this.isNavigating = false;
      this.toast.hide();
    }
  }

  private resetNavigation(): void {
    this.isNavigating = false;
    this.currentIndex = -1;
    this.originalInput = '';
    this.toast.hide();
  }

  private showNavigationToast(): void {
    if (!this.showToastNotification) return;
    
    const position = this.currentIndex + 1;
    const total = this.history.length;
    this.toast.show(`${position}/${total}`);
  }

  updateSettings(settings: any): void {
    if (settings.showToastNotification !== undefined) {
      this.showToastNotification = settings.showToastNotification;
      if (!this.showToastNotification) {
        this.toast.hide();
      }
    }
  }

  // Commands APIから呼び出すための公開メソッド
  navigateUp(): void {
    console.log('Navigating up in history');
    this.handleArrowUp();
  }

  navigateDown(): void {
    console.log('Navigating down in history');
    this.handleArrowDown();
  }

  cleanup(): void {
    this.resetNavigation();
    this.toast.cleanup();
    
    // イベントリスナーを削除
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler, { capture: true });
      this.keydownHandler = null;
    }
  }
}
