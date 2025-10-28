import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { PopupPanel } from './components/popup-panel';
import { dateTime } from './utils/date';
import { clickURL } from './utils/dom';
import { getSiteAccessText } from './utils/permissions';
import meta from '../public/manifest.meta.json';

class PopupManager {
  private panel: PopupPanel;
  private enabled: boolean = false;
  private enabledElement: HTMLInputElement | null;
  private manifestData: chrome.runtime.Manifest;
  private manifestMetadata: { [key: string]: any } = (meta as any) || {};

  constructor() {
    this.panel = new PopupPanel();
    this.enabledElement = document.getElementById('enabled') as HTMLInputElement;
    this.manifestData = chrome.runtime.getManifest();
    this.manifestMetadata = (meta as any) || {};

    this.loadInitialState();
    this.addEventListeners();
  }

  private loadInitialState(): void {
    chrome.storage.local.get(['settings', 'enabled'], (data) => {
      if (this.enabledElement) {
        this.enabled = data.enabled || false;
        this.enabledElement.checked = this.enabled;
      }
      this.showMessage(`${this.manifestData.short_name} が起動しました`);

      // 設定値の読み込み例
      // const settings = data.settings || {};
      // if (settings.theme) {
      //   const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
      //   if (themeSelect) themeSelect.value = settings.theme;
      // }
    });
  }

  private addEventListeners(): void {
    if (this.enabledElement) {
      this.enabledElement.addEventListener('change', (event) => {
        this.enabled = (event.target as HTMLInputElement).checked;
        chrome.storage.local.set({ enabled: this.enabled }, () => {
          this.showMessage(this.enabled ? `${this.manifestData.short_name} は有効になっています` : `${this.manifestData.short_name} は無効になっています`);
        });
      });
    }

    this.setupSettingsListeners();
    this.initializeUI();
  }

  private setupSettingsListeners(): void {
    // ショートカット設定を開くボタン
    const openShortcutsButton = document.getElementById('open-shortcuts-button');
    if (openShortcutsButton) {
      openShortcutsButton.addEventListener('click', () => {
        chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
        this.showMessage('ショートカット設定ページを開きました');
      });
    }

    // ショートカット状態を表示
    this.updateShortcutStatus();

    // 設定項目のイベントリスナー例
    //
    // セレクトボックスの例:
    // const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
    // if (themeSelect) {
    //   themeSelect.addEventListener('change', (event) => {
    //     const value = (event.target as HTMLSelectElement).value;
    //     this.saveSetting('theme', value, `テーマを「${value}」に変更しました`);
    //   });
    // }
    //
    // チェックボックスの例:
    // const notificationToggle = document.getElementById('enable-notifications') as HTMLInputElement;
    // if (notificationToggle) {
    //   notificationToggle.addEventListener('change', (event) => {
    //     const checked = (event.target as HTMLInputElement).checked;
    //     this.saveSetting('notifications', checked, `通知を${checked ? '有効' : '無効'}にしました`);
    //   });
    // }
    //
    // スライダーの例:
    // const fontSizeRange = document.getElementById('font-size') as HTMLInputElement;
    // if (fontSizeRange) {
    //   fontSizeRange.addEventListener('change', (event) => {
    //     const value = (event.target as HTMLInputElement).value;
    //     this.saveSetting('fontSize', value, `フォントサイズを${value}pxに変更しました`);
    //   });
    // }
  }

  private initializeUI(): void {
    const short_name = this.manifestData.short_name || this.manifestData.name;
    const title = document.getElementById('title');
    if (title) {
      title.textContent = short_name;
    }
    const titleHeader = document.getElementById('title-header');
    if (titleHeader) {
      titleHeader.textContent = short_name;
    }
    const enabledLabel = document.getElementById('enabled-label');
    if (enabledLabel) {
      enabledLabel.textContent = `${short_name} を有効にする`;
    }

    const newTabButton = document.getElementById('new-tab-button');
    if (newTabButton) {
      newTabButton.addEventListener('click', () => {
        chrome.tabs.create({ url: 'popup.html' });
      });
    }

    this.setupInfoTab();
  }

  private setupInfoTab(): void {
    const extensionLink = document.getElementById('extension_link') as HTMLAnchorElement;
    if (extensionLink) {
      extensionLink.href = `chrome://extensions/?id=${chrome.runtime.id}`;
      clickURL(extensionLink);
    }

    clickURL(document.getElementById('issue-link'));
    clickURL(document.getElementById('store_link'));
    clickURL(document.getElementById('github-link'));

    const extensionId = document.getElementById('extension-id');
    if (extensionId) {
      extensionId.textContent = chrome.runtime.id;
    }
    const extensionName = document.getElementById('extension-name');
    if (extensionName) {
      extensionName.textContent = this.manifestData.name;
    }
    const extensionVersion = document.getElementById('extension-version');
    if (extensionVersion) {
      extensionVersion.textContent = this.manifestData.version;
    }
    const extensionDescription = document.getElementById('extension-description');
    if (extensionDescription) {
      extensionDescription.textContent = this.manifestData.description ?? '';
    }

    chrome.permissions.getAll((result) => {
      const permissionInfo = document.getElementById('permission-info');
      const permissions = result.permissions;
      if (permissionInfo && permissions) {
        permissionInfo.textContent = permissions.join(', ');
      }

      const siteAccess = getSiteAccessText(result.origins);
      const siteAccessElement = document.getElementById('site-access');
      if (siteAccessElement) {
        siteAccessElement.innerHTML = siteAccess;
      }
    });

    chrome.extension.isAllowedIncognitoAccess((isAllowedAccess) => {
      const incognitoEnabled = document.getElementById('incognito-enabled');
      if (incognitoEnabled) {
        incognitoEnabled.textContent = isAllowedAccess ? '有効' : '無効';
      }
    });

    const languageMap: { [key: string]: string } = { 'en': '英語', 'ja': '日本語' };
    const language = document.getElementById('language') as HTMLElement;
    const languages = this.manifestMetadata.languages;
    language.textContent = languages.map((lang: string) => languageMap[lang]).join(', ');

    const publisherName = document.getElementById('publisher-name') as HTMLElement;
    const publisher = this.manifestMetadata.publisher || '不明';
    publisherName.textContent = publisher;

    const developerName = document.getElementById('developer-name') as HTMLElement;
    const developer = this.manifestMetadata.developer || '不明';
    developerName.textContent = developer;

    const githubLink = document.getElementById('github-link') as HTMLAnchorElement;
    githubLink.href = this.manifestMetadata.github_url;
    githubLink.textContent = this.manifestMetadata.github_url;
  }

  /**
   * 設定値を保存するヘルパーメソッド
   * @param key - 設定のキー名
   * @param value - 保存する値
   * @param message - 保存成功時に表示するメッセージ
   */
  private saveSetting(key: string, value: any, message?: string): void {
    chrome.storage.local.get(['settings'], (data) => {
      const settings = data.settings || {};
      settings[key] = value;
      chrome.storage.local.set({ settings }, () => {
        if (message) {
          this.showMessage(message);
        }
      });
    });
  }

  private showMessage(message: string, timestamp: string = dateTime()) {
    this.panel.messageOutput(message, timestamp);
  }

  private async updateShortcutStatus(): Promise<void> {
    const statusElement = document.getElementById('shortcut-status');
    if (!statusElement) return;

    try {
      const commands = await chrome.commands.getAll();
      const upCommand = commands.find(cmd => cmd.name === 'navigate-history-up');
      const downCommand = commands.find(cmd => cmd.name === 'navigate-history-down');

      const upKey = upCommand?.shortcut || 'Alt+Up';
      const downKey = downCommand?.shortcut || 'Alt+Down';

      const hasCustomUp = upCommand?.shortcut && upCommand.shortcut !== '';
      const hasCustomDown = downCommand?.shortcut && downCommand.shortcut !== '';

      if (hasCustomUp || hasCustomDown) {
        const statusParts = [];
        if (hasCustomUp) {
          statusParts.push(`上: <kbd>${upKey}</kbd> (カスタム)`);
        } else {
          statusParts.push(`上: <kbd>Alt+Up</kbd> (デフォルト)`);
        }
        if (hasCustomDown) {
          statusParts.push(`下: <kbd>${downKey}</kbd> (カスタム)`);
        } else {
          statusParts.push(`下: <kbd>Alt+Down</kbd> (デフォルト)`);
        }

        statusElement.innerHTML = `
          <strong>現在:</strong> ${statusParts.join(' / ')}<br>
          <span class="text-info">✓ カスタムキーが一部設定されています</span>
        `;
      } else {
        statusElement.innerHTML = `
          <strong>現在:</strong> <kbd>Alt</kbd> + <kbd>↑</kbd> / <kbd>Alt</kbd> + <kbd>↓</kbd><br>
          <span class="text-success">✓ デフォルトキーが使用可能です</span>
        `;
      }
    } catch (error) {
      console.error('Failed to get commands:', error);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => new PopupManager());