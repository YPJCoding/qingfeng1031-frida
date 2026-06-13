// ============================================================================
// DNF Frida modern modular package - utilityPatches.js
// 杂项补丁：史诗免确认、解除创建角色限制。
// ============================================================================

function cancelEpicOk() {
  Memory.patchCode(ptr(0x085A56CE).add(2), 1, function (code) {
    var cw = new X86Writer(code, { pc: ptr(0x085A56CE).add(2) })
    cw.putU8(9)
    cw.flush()
  })
  Interceptor.attach(ptr(0x08150f18), {
    onLeave: function (retval) { retval.replace(0) }
  })
}

function disableCreateCharacterLimit() {
  Interceptor.attach(ptr(0x8401922), {
    onLeave: function (retval) { retval.replace(1) }
  })
}

function installUtilityPatches() {
  try { cancelEpicOk() } catch (e) { bootLog('[UTIL] 史诗免确认安装失败: ' + e) }
  try { disableCreateCharacterLimit() } catch (e) { bootLog('[UTIL] 创建角色限制解除失败: ' + e) }
  bootLog('[UTIL] 辅助补丁已安装')
}

if (!globalThis.dnfPlugin) { globalThis.dnfPlugin = {} }
__dnfExport({ cancelEpicOk, disableCreateCharacterLimit, installUtilityPatches })
