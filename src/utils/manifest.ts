/** Manifest 関連のユーティリティ */
function getManifest(): chrome.runtime.Manifest {
  return chrome.runtime.getManifest();
}

/** Manifest からターゲットURLパターンを取得 */
function getContentScriptsMatches(): string[] {
  const manifest = getManifest();
  return manifest.content_scripts?.[0]?.matches || [];
}

export { getManifest, getContentScriptsMatches };