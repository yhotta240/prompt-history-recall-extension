import { reloadExtension } from "./dev/reload";
import { getContentScriptsMatches } from "./utils/manifest";
import { reloadTargetTabs } from "./utils/reload-tabs";

// リロード対象のURLパターンを取得
const targetUrls = getContentScriptsMatches();

// Commands APIのイベントリスナー
chrome.commands.onCommand.addListener((command) => {
  // 拡張機能が有効かチェック
  chrome.storage.local.get(['enabled'], (data) => {
    if (data.enabled === false) {
      return;
    }

    // アクティブなタブを取得
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        // Content scriptにメッセージを送信
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'COMMAND',
          command: command
        });
      }
    });
  });
});

// Content scriptからショートカット設定状態の問い合わせを受け付ける
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_COMMANDS_CONFIG') {
    chrome.commands.getAll((commands) => {
      // 各コマンドごとにカスタムショートカットが設定されているかチェック
      const upCommand = commands.find(cmd => cmd.name === 'navigate-history-up');
      const downCommand = commands.find(cmd => cmd.name === 'navigate-history-down');

      const hasCustomUpKey = upCommand?.shortcut && upCommand.shortcut !== '';
      const hasCustomDownKey = downCommand?.shortcut && downCommand.shortcut !== '';

      sendResponse({
        useDefaultUpKey: !hasCustomUpKey,
        useDefaultDownKey: !hasCustomDownKey
      });
    });
    return true; // 非同期レスポンスを示す
  }
  return false;
});

/**
 * バックグラウンドスクリプトを初期化
 */
function initialize(): void {
  console.log("現在の環境：", process.env.NODE_ENV);
  // 開発用ホットリロード機能を初期化
  if (process.env.NODE_ENV === "development") {
    reloadExtension();
  }
  // 拡張機能起動時にターゲットタブをリロード
  reloadTargetTabs(targetUrls);
}

initialize();