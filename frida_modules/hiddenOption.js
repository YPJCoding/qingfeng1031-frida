// ============================================================================
// DNF Frida modern modular package - hiddenOption.js
// Hidden option patch and random option hooks.
// ============================================================================

// 19. 时装潜能业务区
// ============================================================================

// 下发随机时装潜能属性前应用的内存补丁。
/** applyHiddenOptionPatch。
 * @returns {unknown} 返回值。*/
function applyHiddenOptionPatch() {
  // 关闭系统原本的属性分配逻辑。
  Memory.protect(ptr(0x08509d49), 3, 'rwx')
  ptr(0x08509d49).writeByteArray([0xeb])
  // 下发随机时装潜能属性，范围保持原脚本逻辑：1 ~ 63。
  Memory.protect(ptr(0x08509d34), 3, 'rwx')
  ptr(0x08509d34).writeUShort(getRandomInt(1, 64))
}

// 安装时装潜能相关 Hook。
/** installHiddenOptionFix。
 * @returns {unknown} 返回值。*/
function installHiddenOptionFix() {
  Interceptor.attach(ptr(0x08509b9e), {
    onEnter: function (args) {
      pluginSafeCall('applyHiddenOptionPatch', function () {
        applyHiddenOptionPatch()
      })
    },
    onLeave: function (retval) {}
  })
  Interceptor.attach(ptr(0x0817edec), {
    onEnter: function (args) {},
    onLeave: function (retval) {
      // 强制返回 1，保持原脚本绕过检查逻辑。
      retval.replace(1)
    }
  })
}

// 旧函数名兼容。
/** hiddenOption。
 * @returns {unknown} 返回值。*/
function hiddenOption() {
  return applyHiddenOptionPatch()
}
/** startHiddenOption。
 * @returns {unknown} 返回值。*/
function startHiddenOption() {
  return installHiddenOptionFix()
}

// ============================================================================

// ============================================================================
// 模块公共 API 注册区
// ============================================================================
if (!globalThis.dnfPlugin) {
  globalThis.dnfPlugin = {}
}

/**
 * Registers public symbols exported by hiddenOption.js.
 * Symbols are also attached to globalThis to preserve old script-style references
 * between modules loaded through Frida Script.load().
 * @returns {void}
 */
function registerCurrentModuleSymbols() {
  globalThis.applyHiddenOptionPatch = applyHiddenOptionPatch
  globalThis.dnfPlugin.applyHiddenOptionPatch = applyHiddenOptionPatch
  globalThis.installHiddenOptionFix = installHiddenOptionFix
  globalThis.dnfPlugin.installHiddenOptionFix = installHiddenOptionFix
  globalThis.hiddenOption = hiddenOption
  globalThis.dnfPlugin.hiddenOption = hiddenOption
  globalThis.startHiddenOption = startHiddenOption
  globalThis.dnfPlugin.startHiddenOption = startHiddenOption
}

registerCurrentModuleSymbols()
