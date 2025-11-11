/**
 * 設定の型定義
 * 実際のアプリケーションで使用する設定項目をここに追加してください
 */
export interface Settings {
  enabledSites?: {
    [domain: string]: boolean;
  };
  showToastNotification?: boolean;
}

/** 対応サイトのリスト */
export interface SiteInfo {
  domain: string;
  name: string;
  url: string;
}

export const SUPPORTED_SITES: SiteInfo[] = [
  { domain: 'chatgpt.com', name: 'ChatGPT', url: 'https://chatgpt.com' },
  { domain: 'claude.ai', name: 'Claude', url: 'https://claude.ai' },
  { domain: 'perplexity.ai', name: 'Perplexity', url: 'https://perplexity.ai' },
  { domain: 'copilot.microsoft.com', name: 'Microsoft Copilot', url: 'https://copilot.microsoft.com' },
  { domain: 'grok.com', name: 'Grok', url: 'https://grok.com' },
  { domain: 'notion.so', name: 'Notion AI', url: 'https://www.notion.so/ai' },
];

/**
 * 設定のデフォルト値
 * 初回起動時や設定がリセットされた時に使用されます
 */
export const DEFAULT_SETTINGS: Settings = {
  enabledSites: SUPPORTED_SITES.reduce((acc, site) => {
    acc[site.domain] = true;
    return acc;
  }, {} as { [domain: string]: boolean }),
  showToastNotification: true,
};
