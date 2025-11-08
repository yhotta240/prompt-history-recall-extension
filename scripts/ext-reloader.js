// 開発専用の webpack プラグインです．
// ビルド後に接続中のクライアントへ WebSocket 経由で "reload" を送信し，拡張機能のホットリロードを行います．
let WebSocket
try {
  WebSocket = require("ws")
} catch (err) {
  // `ws` がインストールされていない（例: production 環境など）の場合は
  // リローダー機能を無効化して安全に処理します．
  WebSocket = null
  console.warn("ext-reloader: 'ws' モジュールが見つかりません — リローダーを無効化します．")
}

class ExtensionReloader {
  constructor() {
    // `ws` が利用可能な場合はサーバを作成し，そうでなければ空の clients 配列でフォールバックします．
    if (WebSocket) {
      this.wss = new WebSocket.Server({ port: 6571 })
    } else {
      this.wss = { clients: [] }
    }
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tap("ExtensionReloader", () => {
      for (const client of this.wss.clients) {
        // `ws` 未使用時は clients が空なのでループはスキップされます．
        try {
          if (WebSocket && client.readyState === WebSocket.OPEN) {
            client.send("reload")
          }
        } catch (e) {
          // 個々のクライアント送信エラーは無視して次へ進めます．
        }
      }
    })
  }
}

module.exports = ExtensionReloader
