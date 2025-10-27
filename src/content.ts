import { ISiteAdapter } from './types';
import { HistoryManager } from './storage/historyManager';
import { InputDetector } from './content/inputDetector';
import { KeyHandler } from './content/keyHandler';
import { ChatGPTAdapter } from './content/siteAdapters/chatgpt';
import { ClaudeAdapter } from './content/siteAdapters/claude';
import { PerplexityAdapter } from './content/siteAdapters/perplexity';
import { CopilotAdapter } from './content/siteAdapters/copilot';

class ContentScript {
  private adapter: ISiteAdapter | null = null;
  private historyManager: HistoryManager | null = null;
  private inputDetector: InputDetector;
  private keyHandler: KeyHandler | null = null;
  private lastUrl: string = '';

  constructor() {
    this.inputDetector = new InputDetector();
    this.lastUrl = window.location.href;
  }

  async initialize(): Promise<void> {
    const domain = window.location.hostname;
    // console.log('[Prompt History Recall] Initializing on', domain);

    // サイトに応じたアダプターを選択
    this.adapter = this.getSiteAdapter();
    if (!this.adapter) {
      // console.log('[Prompt History Recall] No adapter found for this site');
      return;
    }

    // HistoryManagerを初期化（アダプターが必要）
    this.historyManager = new HistoryManager(this.adapter);

    // 入力フィールドの検出を待機
    const inputElement = await this.inputDetector.detectInputElement(this.adapter);
    if (!inputElement) {
      // console.log('[Prompt History Recall] Input element not found');
      return;
    }

    // console.log('[Prompt History Recall] Input element detected');

    // キーハンドラーの初期化
    this.keyHandler = new KeyHandler(this.adapter, this.historyManager);
    this.keyHandler.initialize();

    // ページ遷移（URL変更）を検知
    this.setupUrlChangeDetection();

    // console.log('[Prompt History Recall] Initialization complete');
  }

  private setupUrlChangeDetection(): void {
    // MutationObserverでDOM変更を監視してURL変更を検知
    const observer = new MutationObserver(() => {
      if (window.location.href !== this.lastUrl) {
        // console.log('[Prompt History Recall] URL changed, reinitializing...');
        this.lastUrl = window.location.href;
        // URL変更時に再初期化
        this.cleanup();
        setTimeout(() => this.initialize(), 500);
      }
    });

    observer.observe(document, { subtree: true, childList: true });

    // popstateイベントも監視（ブラウザの戻る/進む）
    window.addEventListener('popstate', () => {
      // console.log('[Prompt History Recall] Pop state event, reinitializing...');
      this.cleanup();
      setTimeout(() => this.initialize(), 500);
    });
  }

  private getSiteAdapter(): ISiteAdapter | null {
    const hostname = window.location.hostname;

    if (hostname.includes('openai.com') || hostname.includes('chatgpt.com')) {
      return new ChatGPTAdapter();
    }

    if (hostname.includes('claude.ai')) {
      return new ClaudeAdapter();
    }

    if (hostname.includes('perplexity.ai')) {
      return new PerplexityAdapter();
    }

    if (hostname.includes('copilot.microsoft.com')) {
      return new CopilotAdapter();
    }

    // 他のサイトのアダプターは今後追加
    return null;
  }

  cleanup(): void {
    this.adapter?.cleanup();
    this.keyHandler?.cleanup();
  }
}

// 初期化
const contentScript = new ContentScript();
contentScript.initialize();