// ============================================================================
// DNF Frida modern modular package - returnUser.js
// Return-user day threshold patch.
// ============================================================================

// ============================================================================

// 设置回归勇士判定天数。
// 传入 day 后会写入对应秒数：day * 86400。
function setReturnUserDays(day) {
  const time = day * 86400
  Memory.protect(pluginAddress.returnUserDays, 32, 'rwx')
  pluginAddress.returnUserDays.writeU32(time)
}

// 旧函数名兼容。
function setReturnUser(day) {
  return setReturnUserDays(day)
}

// ============================================================================

if (!globalThis.dnfPlugin) {
  globalThis.dnfPlugin = {}
}

__dnfExport({ setReturnUserDays, setReturnUser })
