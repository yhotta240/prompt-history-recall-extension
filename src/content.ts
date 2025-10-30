import { ISiteAdapter } from './types';
import { HistoryManager } from './storage/historyManager';
import { InputDetector } from './content/inputDetector';
import { KeyHandler } from './content/keyHandler';
import { ChatGPTAdapter } from './content/siteAdapters/chatgpt';
import { ClaudeAdapter } from './content/siteAdapters/claude';
import { PerplexityAdapter } from './content/siteAdapters/perplexity';
import { CopilotAdapter } from './content/siteAdapters/copilot';
import { GrokAdapter } from './content/siteAdapters/grok';
import { NotionAIAdapter } from './content/siteAdapters/notionai';
import { Settings, DEFAULT_SETTINGS } from './settings';

class ContentScript {
  private adapter: ISiteAdapter | null = null;
  private historyManager: HistoryManager | null = null;
  private inputDetector: InputDetector;
  public keyHandler: KeyHandler | null = null;
  private lastUrl: string = '';
  private settings: Settings = DEFAULT_SETTINGS;
  private urlObserver: MutationObserver | null = null;

  constructor() {
    this.inputDetector = new InputDetector();
    this.lastUrl = window.location.href;
  }

  async initialize(): Promise<void> {
    // 設定を読み込み
    await this.loadSettings();

    const domain = this.getCurrentDomain();

    // サイトが無効化されている場合は，既存の機能をクリーンアップして終了
    if (!this.isSiteEnabled(domain)) {
      // console.log('[Prompt History Recall] Site is disabled:', domain);
      this.cleanup();
      return;
    }

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

  private async loadSettings(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['settings'], (data) => {
        this.settings = data.settings || DEFAULT_SETTINGS;
        if (!this.settings.enabledSites) {
          this.settings.enabledSites = DEFAULT_SETTINGS.enabledSites;
        }
        resolve();
      });
    });
  }

  private getCurrentDomain(): string {
    const hostname = window.location.hostname;
    // ChatGPTの複数ドメインを統一
    if (hostname.includes('openai.com') || hostname.includes('chatgpt.com')) {
      return 'chatgpt.com';
    }
    return hostname;
  }

  private isSiteEnabled(domain: string): boolean {
    if (!this.settings.enabledSites) {
      return true;
    }
    return this.settings.enabledSites[domain] !== false;
  }

  private setupUrlChangeDetection(): void {
    // 既存のオブザーバーをクリーンアップ
    if (this.urlObserver) {
      this.urlObserver.disconnect();
    }

    // MutationObserverでDOM変更を監視してURL変更を検知（スロットリング付き）
    let lastCheck = Date.now();
    this.urlObserver = new MutationObserver(() => {
      const now = Date.now();
      // 500ms以内の連続した変更は無視（パフォーマンス最適化）
      if (now - lastCheck < 500) return;
      lastCheck = now;

      if (window.location.href !== this.lastUrl) {
        // console.log('[Prompt History Recall] URL changed, reinitializing...');
        this.lastUrl = window.location.href;
        // URL変更時に再初期化
        this.cleanup();
        setTimeout(() => this.initialize(), 500);
      }
    });

    this.urlObserver.observe(document.documentElement, {
      childList: true,
      subtree: false // パフォーマンス改善：サブツリー全体を監視しない
    });

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

    if (hostname.includes('x.com') && window.location.pathname.includes('/grok')) {
      return new GrokAdapter();
    }

    if (hostname.includes('notion.so') && (window.location.pathname.includes('/chat') || window.location.pathname.includes('/ai'))) {
      return new NotionAIAdapter();
    }

    // 他のサイトのアダプターは今後追加
    return null;
  }

  cleanup(): void {
    this.adapter?.cleanup();
    this.keyHandler?.cleanup();
    
    if (this.urlObserver) {
      this.urlObserver.disconnect();
      this.urlObserver = null;
    }
    
    this.adapter = null;
    this.historyManager = null;
    this.keyHandler = null;
  }
}

// 初期化
const contentScript = new ContentScript();
contentScript.initialize();

// Background scriptからのメッセージを受信
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'COMMAND') {
    if (!contentScript.keyHandler) return;

    // コマンドに応じた処理を実行
    if (message.command === 'navigate-history-up') {
      contentScript.keyHandler.navigateUp();
    } else if (message.command === 'navigate-history-down') {
      contentScript.keyHandler.navigateDown();
    }
  } else if (message.type === 'SETTINGS_UPDATED') {
    // 設定が更新されたら，KeyHandlerの設定を更新
    if (contentScript.keyHandler && message.settings) {
      contentScript.keyHandler.updateSettings(message.settings);
    }
    // サイトの有効/無効が変わった場合は再初期化
    contentScript.cleanup();
    setTimeout(() => contentScript.initialize(), 100);
  }
});