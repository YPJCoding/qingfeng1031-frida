// ============================================================================
// DNF Frida modern modular package - dropRate.js
// Drop rate multiplier via CLuckPoint::GetItemRarity hook.
// ============================================================================

// 23. 爆率控制区
// ============================================================================
let dropRateMultiplier = 2.0

//安装爆率控制 Hook
function installDropRateHook() {
  const target = ptr(0x8550BE4)

  Interceptor.replace(target, new NativeCallback(
    function (a1, a2, roll, a4) {
      roll = Math.floor(roll * dropRateMultiplier)
      return cLuckPointGetItemRarity(a1, a2, roll, a4)
    },
    'int',
    ['pointer', 'pointer', 'int', 'int']
  ))
}

//入口
function installDropRate() {
  const config = globalConfig['drop_rate']
  if (config) {
    dropRateMultiplier = parseFloat(config['multiplier']) || 2.0
  }
  installDropRateHook()
  bootLog(`[INFO] 爆率已启用, 倍率: ${dropRateMultiplier}`)
}

// ============================================================================

if (!globalThis.dnfPlugin) {
  globalThis.dnfPlugin = {}
}

__dnfExport({ installDropRate, installDropRateHook })
