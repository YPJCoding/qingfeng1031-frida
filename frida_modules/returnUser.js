// ============================================================================
// DNF Frida modern modular package - returnUser.js
// Return-user day threshold patch.
// ============================================================================

// 18. 勇士归来业务区
// ============================================================================

// 设置回归勇士判定天数。
// 传入 day 后会写入对应秒数：day * 86400。
/** setReturnUserDays。
 * @param {unknown} day 参数。
 * @returns {unknown} 返回值。*/
function setReturnUserDays(day) {
  const time = day * 86400
  Memory.protect(pluginAddress.returnUserDays, 32, 'rwx')
  pluginAddress.returnUserDays.writeU32(time)
}

// 旧函数名兼容。
/** setReturnUser。
 * @param {unknown} day 参数。
 * @returns {unknown} 返回值。*/
function setReturnUser(day) {
  return setReturnUserDays(day)
}

// ============================================================================

// ============================================================================
// 模块公共 API 注册区
// ============================================================================
if (!globalThis.dnfPlugin) {
  globalThis.dnfPlugin = {}
}

/**
 * Registers public symbols exported by returnUser.js.
 * Symbols are also attached to globalThis to preserve old script-style references
 * between modules loaded through Frida Script.load().
 * @returns {void}
 */
function registerCurrentModuleSymbols() {
  globalThis.setReturnUserDays = setReturnUserDays
  globalThis.dnfPlugin.setReturnUserDays = setReturnUserDays
  globalThis.setReturnUser = setReturnUser
  globalThis.dnfPlugin.setReturnUser = setReturnUser
}

registerCurrentModuleSymbols()
