// ============================================================================
// DNF Frida modern modular package - dropRate.js
// 通过 CLuckPoint::GetItemRarity Hook 实现爆率倍率控制。
// ============================================================================

// ============================================================================
let dropRateMultiplier = 2.0

// 统计计数器
let dropCallCount = 0
let dropRarityStats = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

//安装爆率控制 Hook
function installDropRateHook() {
  const target = ptr(0x8550BE4)

  Interceptor.replace(target, new NativeCallback(
    function (a1, a2, roll, a4) {
      const originalRoll = roll
      const newRoll = Math.min(Math.floor(roll * dropRateMultiplier), 1000000)
      const rarity = cLuckPointGetItemRarity(a1, a2, newRoll, a4)

      // 统计
      dropCallCount++
      dropRarityStats[rarity] = (dropRarityStats[rarity] || 0) + 1

      // 每500次输出统计快照
      if (dropCallCount % 500 === 0) {
        console.log(`[DROP-STATS] #${dropCallCount} | ×${dropRateMultiplier} | ` +
          `白=${dropRarityStats[0]||0} 蓝=${dropRarityStats[1]||0} 紫=${dropRarityStats[2]||0} ` +
          `粉=${dropRarityStats[3]||0} 橙=${dropRarityStats[4]||0} 勇者=${dropRarityStats[5]||0}`)
      }

      // 史诗以上实时通知
      if (rarity >= 4) {
        console.log(`[DROP-EPIC] roll: ${originalRoll} → ${newRoll} | rarity=${rarity}`)
      }

      return rarity
    },
    'int',
    ['pointer', 'pointer', 'int', 'int']
  ))

  console.log('[DROP-INIT] CLuckPoint::GetItemRarity hook installed at 0x8550BE4')
}

//入口
function installDropRate() {
  const config = globalConfig['drop_rate']
  if (config) {
    dropRateMultiplier = parseFloat(config['multiplier']) || 2.0
  }
  installDropRateHook()
  console.log(`爆率已启用, 倍率: ${dropRateMultiplier}, roll上限保护: 1000000`)
}

// ============================================================================

if (!globalThis.dnfPlugin) {
  globalThis.dnfPlugin = {}
}

__dnfExport({ installDropRate, installDropRateHook })
