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

/**
 * Registers public symbols exported by legacyAliases.js.
 * Symbols are also attached to globalThis to preserve old script-style references
 * between modules loaded through Frida Script.load().
 * @returns {void}
 */
function registerCurrentModuleSymbols() {
  globalThis.fixTod = fixTod
  globalThis.dnfPlugin.fixTod = fixTod
  globalThis.fixUseEmblem = fixUseEmblem
  globalThis.dnfPlugin.fixUseEmblem = fixUseEmblem
  globalThis.getRandomInt2 = getRandomInt2
  globalThis.dnfPlugin.getRandomInt2 = getRandomInt2
}

registerCurrentModuleSymbols()
