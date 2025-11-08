/**
 * オートリロード
 * - サーバ未起動時は静かに終了してネットワークエラーを出さない
 */
const DEV_SERVER_URL = "ws://localhost:6571";

/** サーバ（HTTP）の存在を短時間で確認する */
async function checkServerReachable(httpUrl: string, timeout = 1000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    await fetch(httpUrl, { method: "GET", mode: "no-cors", signal: controller.signal });
    clearTimeout(id);
    return true;
  } catch {
    return false;
  }
}

/** オートリロードを初期化する */
export function reloadExtension(): void {
  const httpUrl = DEV_SERVER_URL.replace(/^ws:/, "http:").replace(/^wss:/, "https:");

  (async () => {
    if (!await checkServerReachable(httpUrl)) {
      console.log("オートリロードサーバが見つかりません:", DEV_SERVER_URL);
      return;
    }

    try {
      const ws = new WebSocket(DEV_SERVER_URL);

      ws.onopen = () => console.log("オートリロードサーバに接続しました:", DEV_SERVER_URL);
      ws.onmessage = () => {
        console.log("変更を検出しました。拡張機能を再読み込みします。");
        chrome.runtime.reload();
      };
      ws.onclose = () => console.log("オートリロードサーバとの接続が閉じられました");
      ws.onerror = () => { /* 接続エラーは無視 */ };
    } catch {
      // 初期化エラーは無視
    }
  })();
}