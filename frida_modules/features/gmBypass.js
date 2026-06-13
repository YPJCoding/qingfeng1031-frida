// ============================================================================
// DNF Frida modern modular package - gmBypass.js
// 通过 Hook isGM/isGMUser 绕过 GM 权限检查。
// ============================================================================

// GM 权限绕过区
// ============================================================================

//安装 GM 权限绕过 Hook
function installGmBypass() {
  // WongWork::CGMAccounts::isGM — 强制返回 true
  Interceptor.attach(ptr(0x08109346), {
    onLeave: function (retval) {
      retval.replace(1)
    }
  })

  // CUser::isGMUser — 强制返回 true
  Interceptor.attach(ptr(0x0814589c), {
    onLeave: function (retval) {
      retval.replace(1)
    }
  })

  bootLog('[GM] GM权限已绕过')
}

// ============================================================================

if (!globalThis.dnfPlugin) {
  globalThis.dnfPlugin = {}
}

__dnfExport({ installGmBypass })
