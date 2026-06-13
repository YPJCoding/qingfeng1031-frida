// ============================================================================
// DNF Frida modern modular package - legacyAliases.js
// Legacy compatibility aliases for old manual function names.
// ============================================================================

// ============================================================================
// 兼容旧脚本中可能被外部手动调用的函数名。
function fixTod(skipUserApc) {
  return installTowerOfDespairFix(skipUserApc)
}
function fixUseEmblem() {
  return installAvatarEmblemFix()
}
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
