// ============================================================================
// DNF Frida modern modular package - legacyAliases.js
// Legacy compatibility aliases for old manual function names.
// ============================================================================

// 21. 旧命名兼容区
// ============================================================================
// 兼容旧脚本中可能被外部手动调用的函数名。
/** fixTod。
 * @param {unknown} skipUserApc 参数。
 * @returns {unknown} 返回值。*/
function fixTod(skipUserApc) {
  return installTowerOfDespairFix(skipUserApc)
}
/** fixUseEmblem。
 * @returns {unknown} 返回值。*/
function fixUseEmblem() {
  return installAvatarEmblemFix()
}
/** getRandomInt2。
 * @param {unknown} min 参数。
 * @param {unknown} max 参数。
 * @returns {unknown} 返回值。*/
function getRandomInt2(min, max) {
  return getRandomInt(min, max)
}

// ============================================================================
// 模块公共 API 注册区
// ============================================================================
if (!globalThis.dnfPlugin) {
  globalThis.dnfPlugin = {}
}

__dnfExport({ fixTod, fixUseEmblem, getRandomInt2 })
