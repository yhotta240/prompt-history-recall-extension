import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { PopupPanel } from './components/popup-panel';
import { dateTime } from './utils/date';
import { clickURL } from './utils/dom';
import { getSiteAccessText } from './utils/permissions';

class PopupManager {
  private panel: PopupPanel;
  private enabled: boolean = false;
  private enabledElement: HTMLInputElement | null;
  private manifestData: chrome.runtime.Manifest;

  constructor() {
    this.panel = new PopupPanel();
    this.enabledElement = document.getElementById('enabled') as HTMLInputElement;
    this.manifestData = chrome.runtime.getManifest();

    this.loadInitialState();
    this.addEventListeners();
  }

  private loadInitialState(): void {
    chrome.storage.local.get(['settings', 'enabled'], (data) => {
      if (this.enabledElement) {
        this.enabled = data.enabled || false;
        this.enabledElement.checked = this.enabled;
      }
      this.showMessage(`${this.manifestData.name} が起動しました`);

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
          this.showMessage(this.enabled ? `${this.manifestData.name} は有効になっています` : `${this.manifestData.name} は無効になっています`);
        });
      });
    }

    this.setupSettingsListeners();
    this.initializeUI();
  }

  private setupSettingsListeners(): void {
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
    const title = document.getElementById('title');
    if (title) {
      title.textContent = this.manifestData.name;
    }
    const titleHeader = document.getElementById('title-header');
    if (titleHeader) {
      titleHeader.textContent = this.manifestData.name;
    }
    const enabledLabel = document.getElementById('enabled-label');
    if (enabledLabel) {
      enabledLabel.textContent = `${this.manifestData.name} を有効にする`;
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
}

document.addEventListener('DOMContentLoaded', () => new PopupManager());